// MDX 글에서 사용할 수 있는 설정입니다. path는 Python 안에서 읽는 경로입니다.
export interface PythonDataset { path: string; label?: string }
export interface PythonConfig { datasets: PythonDataset[]; timeoutMs: number; base: string }

export function validatePythonConfig(datasets: PythonDataset[], timeoutMs: number) {
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1000 || timeoutMs > 60_000) {
    throw new Error('Python 실행 제한은 1,000~60,000ms 사이의 정수여야 합니다.');
  }
  const paths = new Set<string>();
  for (const { path } of datasets) {
    if (!/^\/data\/[^/]+(?:\/[^/]+)*$/.test(path)
      || /[?#%\\\u0000-\u001f]/.test(path) || path.split('/').some((part) => part === '.' || part === '..')) {
      throw new Error(`CSV 경로는 /data/ 아래의 파일이어야 합니다: ${path}`);
    }
    if (!path.endsWith('.csv') || paths.has(path)) throw new Error(`CSV 경로가 중복되거나 .csv 파일이 아닙니다: ${path}`);
    paths.add(path);
  }
  if (datasets.length > 5) throw new Error('실행 예제 하나에는 CSV를 최대 5개까지 등록할 수 있습니다.');
}
