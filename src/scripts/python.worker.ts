import bootstrap from './python-output.py?raw';
import type { PythonConfig } from '../lib/python-config';

// 버전을 고정해 글의 실행 환경이 예고 없이 바뀌지 않게 합니다.
const runtimeUrl = 'https://cdn.jsdelivr.net/pyodide/v314.0.7/full/';
interface Runtime {
  FS: { mkdirTree(path: string): void; writeFile(path: string, bytes: Uint8Array): void };
  globals: { set(name: string, value: unknown): void; delete(name: string): void };
  loadPackage(packages: string[]): Promise<void>;
  runPythonAsync(code: string): Promise<unknown>;
}
let runtime: Runtime | undefined;
let bytesSent = 0;
let outputCount = 0;
let limited = false;
const cache = new Map<string, Uint8Array>();
const send = (data: object) => self.postMessage(data);

async function loadFile(path: string, base: string) {
  if (cache.has(path)) return cache.get(path)!;
  const response = await fetch(`${base.replace(/\/$/, '')}${path}`, { signal: AbortSignal.timeout(30_000) });
  if (!response.ok) throw new Error(`${path} 파일을 불러오지 못했습니다 (HTTP ${response.status}).`);
  // 작은 학습용 자료만 사용합니다. 스트림으로 읽어 다운로드 중에도 크기를 제한합니다.
  const reader = response.body!.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 5 * 1024 * 1024) throw new Error(`${path} 파일이 5MB를 넘습니다. 작은 예제 파일을 사용해 주세요.`);
      chunks.push(value);
    }
  } finally { await reader.cancel(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  cache.set(path, bytes);
  return bytes;
}

// Python이 만든 HTML은 받지 않고 구조화된 데이터만 전달합니다.
function output(json: string) {
  if (limited) return;
  bytesSent += json.length;
  outputCount += 1;
  if (bytesSent > 8_000_000 || outputCount > 150) {
    limited = true;
    send({ type: 'output', output: { type: 'notice', text: '출력 한도에 도달했습니다. 일부 결과를 생략합니다. 코드에서 출력량을 줄여 주세요.' } });
    return;
  }
  send({ type: 'output', output: JSON.parse(json) });
}

self.onmessage = async ({ data }: MessageEvent<{ code: string; config: PythonConfig }>) => {
  bytesSent = outputCount = 0;
  limited = false;
  try {
    if (!runtime) {
      send({ type: 'status', text: 'Python 환경 불러오는 중…' });
      const moduleUrl = `${runtimeUrl}pyodide.mjs`;
      const { loadPyodide } = await import(/* @vite-ignore */ moduleUrl);
      runtime = await loadPyodide({ indexURL: runtimeUrl }) as Runtime;
      send({ type: 'status', text: 'pandas · NumPy · Matplotlib 준비 중…' });
      await runtime.loadPackage(['numpy', 'pandas', 'matplotlib']);
      const fontPath = '/fonts/NanumGothic-Regular.ttf';
      runtime.FS.mkdirTree('/fonts');
      runtime.FS.writeFile(fontPath, await loadFile(fontPath, data.config.base));
      runtime.globals.set('_send_output', output);
      await runtime.runPythonAsync(bootstrap);
    }
    send({ type: 'status', text: '예제 CSV 준비 중…' });
    for (const { path } of data.config.datasets) {
      const bytes = await loadFile(path, data.config.base);
      runtime.FS.mkdirTree(path.slice(0, path.lastIndexOf('/')));
      // 재실행하면 원본 CSV로 복구됩니다.
      runtime.FS.writeFile(path, bytes);
    }
    send({ type: 'running' });
    runtime.globals.set('_source_code', data.code);
    const success = await runtime.runPythonAsync('await _run_code(_source_code)');
    runtime.globals.delete('_source_code');
    send({ type: 'done', success: Boolean(success) });
  } catch (error) {
    send({ type: 'fatal', text: error instanceof Error ? error.message : String(error) });
  }
};
