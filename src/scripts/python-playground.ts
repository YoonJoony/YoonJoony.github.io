import type { EditorView } from 'codemirror';
import type { PythonConfig } from '../lib/python-config';

type Output =
  | { type: 'table'; title: string; columns: string[]; indexLabel: string; index: string[]; rows: string[][]; note: string }
  | { type: 'plot'; data: string }
  | { type: 'text' | 'stdout' | 'stderr' | 'error' | 'notice'; text: string };
type Reply = { type: 'status'; text: string } | { type: 'running' } | { type: 'output'; output: Output }
  | { type: 'done'; success: boolean } | { type: 'fatal'; text: string };

// 한 페이지에 예제가 여러 개 있어도 무거운 Python 환경은 하나만 유지합니다.
let owner: PythonPlayground | undefined;

function element<K extends keyof HTMLElementTagNameMap>(tag: K, text?: string) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  return node;
}

class PythonPlayground extends HTMLElement {
  private editor?: EditorView;
  private worker?: Worker;
  private timer?: ReturnType<typeof setTimeout>;
  private initialized = false;
  private busy = false;
  private initial = '';
  private config!: PythonConfig;
  private textarea!: HTMLTextAreaElement;
  private runButton!: HTMLButtonElement;
  private stopButton!: HTMLButtonElement;
  private resetButton!: HTMLButtonElement;
  private status!: HTMLElement;
  private output!: HTMLElement;
  private onPageHide = () => this.release('페이지를 이동해 실행 환경을 종료했습니다.');

  connectedCallback() {
    if (this.initialized) return;
    this.initialized = true;
    this.config = JSON.parse(this.dataset.config!);
    this.textarea = this.querySelector('[data-code]')!;
    this.initial = this.textarea.value;
    this.runButton = this.querySelector('[data-run]')!;
    this.stopButton = this.querySelector('[data-stop]')!;
    this.resetButton = this.querySelector('[data-reset]')!;
    this.status = this.querySelector('[data-status]')!;
    this.output = this.querySelector('[data-output]')!;
    this.querySelector<HTMLElement>('[data-js-fallback]')!.hidden = true;
    this.runButton.disabled = this.resetButton.disabled = false;
    this.status.textContent = '준비됨';
    this.runButton.addEventListener('click', () => this.run());
    this.stopButton.addEventListener('click', () => this.release('중지됨 · 코드는 유지됩니다.'));
    this.resetButton.addEventListener('click', () => {
      this.release('예제를 처음 상태로 되돌렸습니다.');
      if (this.editor) this.editor.dispatch({ changes: { from: 0, to: this.editor.state.doc.length, insert: this.initial } });
      this.textarea.value = this.initial;
      this.output.replaceChildren(element('p', '실행하면 텍스트, 표, 그래프가 이곳에 순서대로 표시됩니다.'));
    });
    this.querySelector('[data-editor]')!.addEventListener('keydown', (event) => {
      const key = event as KeyboardEvent;
      if (key.key === 'Enter' && (key.ctrlKey || key.metaKey)) {
        key.preventDefault(); key.stopPropagation(); this.run();
      }
    }, { capture: true });
    window.addEventListener('pagehide', this.onPageHide);
    void this.enhanceEditor();
  }

  private async enhanceEditor() {
    try {
      // 편집기 로딩에 실패해도 기본 textarea로 실행할 수 있습니다.
      const { createEditor } = await import('./python-editor');
      if (!this.isConnected) return;
      this.editor = createEditor(this.querySelector('[data-editor]')!, this.textarea.value, this.textarea.getAttribute('aria-describedby')!);
      this.textarea.hidden = true;
    } catch { /* textarea를 그대로 사용합니다. */ }
  }

  disconnectedCallback() {
    this.release('실행 환경을 종료했습니다.');
    this.editor?.destroy();
    window.removeEventListener('pagehide', this.onPageHide);
  }

  private setBusy(busy: boolean) {
    this.busy = busy;
    this.runButton.disabled = busy;
    this.stopButton.disabled = !busy;
    this.output.setAttribute('aria-busy', String(busy));
  }

  // 무한 반복도 Worker를 종료하면 즉시 멈춥니다. 다음 실행은 새 환경에서 시작합니다.
  release(message: string) {
    clearTimeout(this.timer);
    this.worker?.terminate();
    this.worker = undefined;
    if (owner === this) owner = undefined;
    if (this.status) this.status.textContent = message;
    if (this.output) this.setBusy(false);
  }

  private fail(message: string) {
    this.release('실행하지 못했습니다 · 다시 실행할 수 있습니다.');
    this.render({ type: 'error', text: message });
  }

  private run() {
    if (this.busy) return;
    const code = this.editor?.state.doc.toString() ?? this.textarea.value;
    if (!code.trim()) { this.status.textContent = '실행할 코드를 입력해 주세요.'; return; }
    if (owner && owner !== this) owner.release('다른 예제로 이동해 실행 환경을 종료했습니다.');
    owner = this;
    this.output.replaceChildren();
    this.setBusy(true);
    this.status.textContent = 'Python 환경 준비 중…';
    // 네트워크 준비 시간과 실제 코드 실행 제한을 따로 둡니다.
    this.timer = setTimeout(() => this.fail('환경 준비 시간이 초과되었습니다. 인터넷 연결을 확인하고 다시 실행해 주세요.'), 180_000);
    try {
      if (!this.worker) {
        const worker = new Worker(new URL('./python.worker.ts', import.meta.url), { type: 'module' });
        this.worker = worker;
        // 중지한 Worker의 늦은 메시지가 새 실행 결과에 섞이지 않게 합니다.
        worker.onmessage = ({ data }: MessageEvent<Reply>) => { if (this.worker === worker && this.busy) this.onReply(data); };
        worker.onerror = (event) => {
          event.preventDefault();
          if (this.worker === worker) this.fail('Python 환경을 불러오지 못했습니다. 인터넷 연결을 확인하고 다시 실행해 주세요.');
        };
      }
      this.worker.postMessage({ code, config: this.config });
    } catch (error) { this.fail(String(error)); }
  }

  private onReply(data: Reply) {
    if (data.type === 'status') this.status.textContent = data.text;
    if (data.type === 'running') {
      clearTimeout(this.timer);
      this.status.textContent = '실행 중…';
      this.timer = setTimeout(() => this.fail(`실행 시간이 ${this.config.timeoutMs / 1000}초를 넘어 중지했습니다. 반복문이나 데이터 크기를 확인해 주세요.`), this.config.timeoutMs);
    }
    if (data.type === 'output') this.render(data.output);
    if (data.type === 'fatal') this.fail(`${data.text}\n인터넷 연결과 예제 파일 경로를 확인한 뒤 다시 실행해 주세요.`);
    if (data.type === 'done') {
      clearTimeout(this.timer);
      this.setBusy(false);
      this.status.textContent = data.success ? '실행 완료' : '코드 오류 · 수정 후 다시 실행해 주세요.';
      if (!this.output.childElementCount) this.output.append(element('p', '실행이 완료되었습니다. print(), display() 또는 plt.show()로 결과를 출력해 보세요.'));
    }
  }

  private render(output: Output) {
    if (output.type === 'table') {
      const wrap = element('div');
      wrap.className = 'python-table';
      // 긴 표는 이 영역 안에서만 스크롤합니다. 모든 셀은 HTML 대신 일반 텍스트입니다.
      wrap.tabIndex = 0;
      wrap.setAttribute('role', 'region');
      wrap.setAttribute('aria-label', output.title);
      const table = element('table');
      table.append(element('caption', output.title));
      const head = element('thead');
      const row = element('tr');
      for (const column of [output.indexLabel, ...output.columns]) {
        const th = element('th', column); th.scope = 'col'; row.append(th);
      }
      head.append(row); table.append(head);
      const body = element('tbody');
      output.rows.forEach((cells, i) => {
        const tr = element('tr');
        const index = element('th', output.index[i]); index.scope = 'row'; tr.append(index);
        for (const cell of cells) tr.append(element('td', cell));
        body.append(tr);
      });
      table.append(body); wrap.append(table);
      wrap.append(element('p', output.note)); this.output.append(wrap);
    } else if (output.type === 'plot') {
      const figure = element('figure');
      const image = element('img');
      image.src = `data:image/png;base64,${output.data}`;
      image.alt = `Python 실행으로 생성한 그래프 ${this.output.querySelectorAll('figure').length + 1}`;
      figure.append(image); this.output.append(figure);
    } else {
      const last = this.output.lastElementChild;
      if ((output.type === 'stdout' || output.type === 'stderr') && last instanceof HTMLElement && last.dataset.kind === output.type) {
        last.append(document.createTextNode(output.text));
      } else {
        const block = element('pre', output.text);
        block.dataset.kind = output.type;
        this.output.append(block);
      }
    }
  }
}

if (!customElements.get('python-playground')) customElements.define('python-playground', PythonPlayground);
