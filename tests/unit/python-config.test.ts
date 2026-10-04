import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validatePythonConfig } from '../../src/lib/python-config.ts';

test('Python examples accept nested public CSVs and a bounded execution time', () => {
  assert.doesNotThrow(() => validatePythonConfig([{ path: '/data/학습/예제.csv' }], 30_000));
  for (const timeout of [0, -1, 60001, Infinity, 1000.5]) {
    assert.throws(() => validatePythonConfig([], timeout));
  }
});

test('invalid, duplicate and external dataset paths fail during build', () => {
  for (const path of ['/data/../secret.csv', '/data/./a.csv', '/data//a.csv', '/data/a.csv/', '/data/%2e%2e/a.csv', '/data/a.csv?x', '/data/a.csv#x', '/data/a\\b.csv', '/data/a.json', 'https://example.com/a.csv', '/other/a.csv']) {
    assert.throws(() => validatePythonConfig([{ path }], 30_000), path);
  }
  assert.throws(() => validatePythonConfig([{ path: '/data/a.csv' }, { path: '/data/a.csv' }], 30_000));
  assert.throws(() => validatePythonConfig(Array.from({ length: 6 }, (_, i) => ({ path: `/data/${i}.csv` })), 30_000));
});
