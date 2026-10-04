"""브라우저로 넘길 결과를 텍스트·표·PNG 데이터로 변환합니다. 서버 파일은 만들지 않습니다."""
import base64
import contextlib
import io
import itertools
import json
import traceback
import warnings
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib import font_manager
from pyodide.code import eval_code_async

font_manager.fontManager.addfont("/fonts/NanumGothic-Regular.ttf")

def _emit(output):
    _send_output(json.dumps(output, ensure_ascii=False))

def _cell(value):
    text = str(value)
    return text if len(text) <= 300 else text[:300] + "…"

class _Stream(io.TextIOBase):
    def __init__(self, kind):
        self.kind = kind
        self.pending = ""

    def write(self, text):
        # 긴 print 한 번이 화면을 가득 채우지 않도록 부분만 보냅니다.
        self.pending += text[:10000]
        if "\n" in self.pending or len(self.pending) >= 10000:
            self.flush()
        return len(text)

    def flush(self):
        if self.pending:
            _emit({"type": self.kind, "text": self.pending})
            self.pending = ""

_stdout = _Stream("stdout")
_stderr = _Stream("stderr")

def _flush():
    _stdout.flush()
    _stderr.flush()

def _table(frame, title):
    preview = frame.iloc[:30, :12]
    _emit({
        "type": "table", "title": title,
        "columns": [_cell(column) for column in preview.columns],
        "indexLabel": _cell(frame.index.name) if frame.index.name is not None else "index",
        "index": [_cell(index) for index in preview.index],
        "rows": [[_cell(cell) for cell in row] for row in preview.itertuples(index=False, name=None)],
        "note": f"전체 {frame.shape[0]}행 × {frame.shape[1]}열" + (" · 앞 30행 / 12열까지 표시" if frame.shape[0] > 30 or frame.shape[1] > 12 else ""),
    })

def display(*values):
    """print는 문자열, display는 자료형에 맞는 미리보기를 출력합니다."""
    _flush()
    for value in values:
        if isinstance(value, pd.DataFrame):
            _table(value, "DataFrame")
        elif isinstance(value, pd.Series):
            _table(value.to_frame(name=value.name if value.name is not None else "value"), f"Series · dtype={value.dtype}")
        elif isinstance(value, np.ndarray):
            title = f"ndarray · shape={value.shape} · dtype={value.dtype}"
            if value.ndim <= 2:
                if value.ndim == 0:
                    _emit({"type": "text", "text": title + "\n" + _cell(value.item())})
                else:
                    _table(pd.DataFrame(value), title)
            else:
                # 3차원 이상은 앞쪽 축의 인덱스마다 2차원 단면으로 보여 줍니다.
                # 배열 전체를 문자열/list로 바꾸지 않아 큰 배열도 미리보기만 생성합니다.
                _emit({"type": "text", "text": title + "\n앞쪽 축의 단면을 최대 4개 표시합니다."})
                for index in itertools.islice(np.ndindex(value.shape[:-2]), 4):
                    label = ", ".join(map(str, index))
                    _table(pd.DataFrame(value[index]), f"[{label}, :, :]")
        else:
            _emit({"type": "text", "text": repr(value)[:10000]})

def _show(*args, **kwargs):
    _flush()
    numbers = plt.get_fignums()
    try:
        for number in numbers[:6]:
            figure = plt.figure(number)
            # 과도하게 큰 캔버스 대신 최대 12인치, 100dpi로 렌더링합니다.
            width, height = figure.get_size_inches()
            scale = min(1, 12 / max(width, height))
            figure.set_size_inches(width * scale, height * scale)
            buffer = io.BytesIO()
            # 현재 고정한 Matplotlib/Pyodide 조합의 글꼴 렌더러가 내는 두 경고만 숨깁니다.
            # 독자가 작성한 코드의 경고는 redirect_stderr를 통해 그대로 보여 줍니다.
            with warnings.catch_warnings():
                warnings.filterwarnings("ignore", message=r"The [xy] parameter as float was deprecated.*", category=matplotlib.MatplotlibDeprecationWarning)
                figure.savefig(buffer, format="png", dpi=100)
            _emit({"type": "plot", "data": base64.b64encode(buffer.getvalue()).decode("ascii")})
        if len(numbers) > 6:
            _emit({"type": "notice", "text": "한 번의 show()에서는 그래프를 최대 6개 표시합니다."})
    finally:
        plt.close("all")

async def _run_code(source):
    # 실행마다 변수를 새로 만들어 이전 실행의 변수 때문에 결과가 달라지지 않게 합니다.
    namespace = {"__name__": "__main__", "display": display}
    plt.close("all")
    matplotlib.rcdefaults()
    matplotlib.rcParams.update({"font.family": "NanumGothic", "axes.unicode_minus": False, "figure.figsize": (6, 3.6)})
    plt.show = _show
    _stdout.pending = _stderr.pending = ""
    with contextlib.redirect_stdout(_stdout), contextlib.redirect_stderr(_stderr):
        try:
            result = await eval_code_async(source, globals=namespace, filename="<블로그 예제>")
            if result is not None:
                display(result)
            _flush()
            return True
        except BaseException:
            _flush()
            _emit({"type": "error", "text": traceback.format_exc(limit=8)[-12000:]})
            return False
        finally:
            plt.close("all")
