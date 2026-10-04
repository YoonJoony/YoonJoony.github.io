# 글 안에서 Python 실행하기

## 1. 글은 `.mdx`로 작성하기

일반 `.md` 글은 지금처럼 작성하면 됩니다. 실행 기능이 필요한 글만 확장자를 `.mdx`로 만듭니다.
MDX는 Markdown 본문 안에 `PythonPlayground` 같은 UI 컴포넌트를 넣을 수 있는 형식입니다.

완성된 예제는 `src/content/blog/DE Map/Python/시각화/01_Python_시각화_예제.mdx`에 있습니다.
발행된 주소는 `/posts/python-visualization-01/`입니다.

```mdx
---
title: "나의 Python 실습"
description: "CSV를 읽고 결과를 확인합니다."
pubDate: 2026-10-04
slug: my-python-example
tags: [Python, Study]
draft: true
---

import PythonPlayground from '../../../../../components/PythonPlayground.astro';

## 직접 실행해 보기

<PythonPlayground
  title="CSV 읽기"
  code={String.raw`import pandas as pd
df = pd.read_csv("/data/python-visualization/study-hours.csv")
df`}
  datasets={[{ path: '/data/python-visualization/study-hours.csv', label: '공부 시간 CSV' }]}
/>
```

위 import 경로는 예제 글과 같은 깊이의 폴더 기준입니다. 파일을 다른 깊이로 옮기면 `../` 개수를 맞추세요.
Python 코드를 백틱으로 감쌀 때는 앞에 **`String.raw`를 붙이세요.**
일반 백틱은 Python 코드의 `\n`, `\t` 같은 문자를 JavaScript 단계에서 먼저 해석합니다.
예를 들어 `print("첫째 줄\n둘째 줄")`의 `\n`이 실제 줄바꿈으로 바뀌면, Python은 따옴표가 닫히지 않았다는 오류를 냅니다.
`String.raw`를 쓰면 이 문자가 그대로 Python에 전달되어 정상적으로 처리됩니다.

```mdx
export const code = String.raw`
year = 2024
name = "김지성"
print(f"년도 : {year}\n이름 : {name}")
`;

<PythonPlayground code={code} />
```

브라우저 편집창에는 Python 코드만 들어갑니다. 그곳에서는 `String.raw` 없이 `print(f"년도 : 2024\n이름 : 김지성")`처럼 입력하세요.
따옴표 안에서 Enter를 눌러 코드 자체를 여러 줄로 작성하려면 Python의 삼중 따옴표를 사용합니다.

```python
print(f"""년도 : 2024
이름 : 김지성""")
```

화면 폭 때문에 자동으로 접혀 보이는 줄은 실제 코드의 줄바꿈이 아니므로 실행에 영향을 주지 않습니다.

`String.raw`에서도 백틱과 `${...}`는 JavaScript 문법으로 처리됩니다. 이런 내용이 포함된 코드는 별도 `.py` 파일을 사용하는 편이 간단합니다.
긴 코드는 별도 `.py` 파일로 두고 `import code from './example.py?raw';`로 불러온 뒤 `code={code}`로 전달해도 됩니다.

## 2. CSV 파일 넣기

1. 저장소의 `public/data/` 아래에 CSV를 넣습니다.
2. `datasets`에 경로를 등록합니다. `public` 부분은 쓰지 않습니다.
3. Python에서는 같은 경로로 `pd.read_csv("/data/폴더/파일.csv")`를 호출합니다.

`datasets`에 등록하면 실행 전에 파일을 받아 Python의 메모리 파일 시스템에 복사합니다.
단순히 저장소의 아무 폴더에 넣는 것만으로는 Python에서 읽을 수 없습니다.
외부 URL은 제공 서버의 CORS 정책과 Pyodide 네트워크 기능에 따라 달라지므로, 기본 예제는 등록한 CSV를 사용하세요.
CSV는 파일당 최대 5MB, 한 박스에 최대 5개입니다. UTF-8 저장을 권장합니다.
`public/` 파일은 공개 주소로 제공되므로 공개할 학습 데이터만 넣습니다.

## 3. 결과를 표시하는 방법

| 코드 | 결과 |
| --- | --- |
| `print(value)` | 텍스트 |
| `display(df)` | DataFrame 표 |
| `display(series)` | 인덱스와 자료형을 포함한 Series 표 |
| `display(array)` | shape와 dtype을 포함한 배열 미리보기 |
| 마지막 줄의 `df` 또는 `array` | 해당 값을 자동 표시 |
| `plt.show()` | 그래프를 PNG 이미지로 표시 |

`display()`는 이 실행기가 제공하는 함수이므로 따로 import하지 않습니다.
`print(df)`는 일반 Python처럼 텍스트를 출력합니다. 표가 필요하면 `display(df)`를 사용하세요.
결과는 실행 순서대로 하나의 출력 영역에 나타납니다. 오류가 나도 그 전에 출력한 결과는 남습니다.
3차원 이상 배열은 앞쪽 축의 인덱스별 2차원 단면을 최대 4개 보여 줍니다.
표는 앞 30행·12열, 셀은 300자까지 표시합니다. 원본 데이터 자체를 자르지는 않습니다.
출력은 최대 150개/약 8MB, `show()` 한 번당 그래프 최대 6개입니다.
한글 그래프에는 포함된 나눔고딕을 적용합니다. 그래프는 정적 PNG이며 확대·드래그하는 대화형 차트는 아닙니다.

## 4. 실행·중지·초기화

- **실행** / **Ctrl 또는 ⌘ + Enter**: 편집기의 현재 코드를 실행합니다.
- **중지**: Worker와 Python 환경을 종료합니다. 수정한 코드와 이미 나온 결과는 유지합니다.
- **예제 초기화**: Worker를 종료하고 코드·출력을 처음 상태로 되돌립니다.
- 실행할 때마다 변수 공간을 새로 만들고 등록한 CSV를 원본으로 복구합니다.
- 같은 박스에서 재실행할 때 Python과 라이브러리는 재사용합니다. 라이브러리 내부를 직접 수정했다면 초기화를 사용하세요.
- 여러 박스 중 하나만 Python 환경을 유지합니다. 다른 박스를 실행하면 이전 환경을 종료합니다.
- 페이지 이동·새로고침 후에는 수정한 코드와 실행 결과가 저장되지 않습니다.

기본 실행 제한은 30초입니다. `<PythonPlayground timeoutMs={60000} ... />`로 1~60초 범위에서 조절합니다.
네트워크 준비 제한은 별도로 180초입니다. 메모리를 많이 쓰는 연산은 기기 자체에 부담을 줄 수 있으므로 작은 실습용 데이터를 사용하세요.

## 5. 파일 역할과 운영

- `src/components/PythonPlayground.astro`: 버튼·코드·출력 영역의 기본 HTML
- `src/scripts/python-playground.ts`: 버튼 동작, Worker 수명 관리, 결과를 안전하게 DOM으로 표시
- `src/scripts/python-editor.ts`: CodeMirror 편집기, Python 강조 색상
- `src/scripts/python.worker.ts`: Pyodide/라이브러리/CSV 로딩 및 실행 메시지 전달
- `src/scripts/python-output.py`: `display()`·`plt.show()` 결과 변환
- `src/styles/python-playground.css`: 실습 박스의 색상·여백·모바일 크기
- `public/fonts/`: Matplotlib 한글 글꼴과 OFL 라이선스

Pyodide **314.0.7**을 jsDelivr에서 첫 실행 시 불러옵니다. pandas·NumPy·Matplotlib는 해당 Pyodide 배포판 버전으로 고정됩니다.
네트워크가 차단되어 있으면 실행 오류와 재시도 안내가 나타납니다. WebAssembly와 모듈 Worker를 지원하는 최신 브라우저가 필요합니다.
JavaScript가 꺼져 있어도 원문과 예제 코드는 읽을 수 있습니다.
서버/API 키/별도 Python 백엔드는 필요하지 않습니다. GitHub Pages에 정적 파일로 배포합니다.
Web Worker는 화면을 멈추지 않게 실행을 분리하는 장치이며, 신뢰할 수 없는 코드를 위한 보안 격리 환경은 아닙니다.
일반 데스크톱 Python 전체, 패키지 임의 설치, GPU, 대화형 `input()`은 기본 지원 범위에 포함하지 않습니다.

## 6. 확인하기

```sh
npm run check
npm test
npm run build
npm run test:e2e
```

Python 브라우저 테스트는 실제 CDN의 Pyodide를 실행하므로 인터넷 연결과 Chrome/Chromium이 필요합니다.
데이터·표·한글 그래프, 편집·재실행, 오류 복구, 중지·시간 제한, 파일/네트워크 오류, 모바일 화면을 확인합니다.

참고: [Pyodide Worker](https://pyodide.org/en/stable/usage/webworker.html), [파일 로딩](https://pyodide.org/en/stable/usage/accessing-files.html), [Astro MDX](https://docs.astro.build/en/guides/integrations-guide/mdx/).
