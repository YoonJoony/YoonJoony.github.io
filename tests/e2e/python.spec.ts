import { test, expect, type Locator, type Page } from '@playwright/test';

const url = '/posts/python-visualization-01/';
const widget = (page: Page, index = 0) => page.locator('python-playground').nth(index);
const status = (box: Locator) => box.locator('[data-status]');
const results = (box: Locator) => box.locator('[data-output]');

async function edit(box: Locator, code: string) {
  const editor = box.locator('.cm-content');
  await expect(editor).toBeVisible();
  await editor.click();
  await editor.press('ControlOrMeta+A');
  await editor.fill(code);
}

async function run(box: Locator) {
  await box.getByRole('button', { name: '실행', exact: true }).click();
  await expect(status(box)).toHaveText('실행 완료', { timeout: 150_000 });
}

// WASM과 실제 라이브러리를 실행하는 통합 검사입니다. CDN 네트워크가 필요합니다.
test.describe('Python in blog posts', () => {
  test.setTimeout(240_000);

  test('loads lazily, reads repository CSV, renders a Korean plot, and supports editing', async ({ page }) => {
    const errors: string[] = [];
    const downloads: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('request', (request) => { if (request.url().includes('cdn.jsdelivr.net/pyodide/')) downloads.push(request.url()); });
    await page.goto(url);
    const box = widget(page);
    await expect(box.locator('.cm-content')).toContainText('pd.read_csv');
    // MDX가 Python 문자열의 \\n을 실제 개행으로 먼저 바꾸면 실행 단계에서 SyntaxError가 납니다.
    await expect(box.locator('textarea')).toHaveValue(/print\("학습 기록:", len\(df\), "일\\n"\)/);
    expect(downloads).toHaveLength(0);
    await run(box);
    await expect(results(box)).toContainText('학습 기록: 5 일');
    expect(await results(box).locator('[data-kind="stdout"]').first().textContent()).toBe('학습 기록: 5 일\n\n');
    await expect(results(box).locator('table')).toHaveCount(1);
    await expect(results(box).locator('tbody tr')).toHaveCount(5);
    await expect(results(box).locator('tbody tr').first()).toContainText('월');
    await expect(results(box).locator('tbody tr').last()).toContainText('3.0');
    const plot = results(box).getByRole('img');
    await expect(plot).toHaveCount(1);
    await plot.evaluate((image) => (image as HTMLImageElement).decode());
    expect(await plot.evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBe(600);
    await expect(results(box)).not.toContainText('Glyph');
    const order = await results(box).evaluate((node) => [...node.children].map((child) => child.tagName));
    expect(order).toEqual(['PRE', 'DIV', 'FIGURE']);
    await box.locator('.python-toolbar').scrollIntoViewIfNeeded();
    await page.screenshot({ path: test.info().outputPath('python-desktop.png') });
    await edit(box, 'import pandas as pd\ndf = pd.read_csv("/data/python-visualization/study-hours.csv")\ndf["hours"] *= 2\ndf');
    await box.locator('.cm-content').press('ControlOrMeta+Enter');
    await expect(status(box)).toHaveText('실행 완료', { timeout: 150_000 });
    await expect(results(box).locator('tbody tr').last()).toContainText('6.0');
    await expect(results(box).locator('img')).toHaveCount(0);
    await expect(box.locator('.cm-content')).toHaveText('import pandas as pddf = pd.read_csv("/data/python-visualization/study-hours.csv")df["hours"] *= 2df');
    await page.getByRole('button', { name: '밝은 테마로 변경' }).click();
    await box.scrollIntoViewIfNeeded();
    await page.screenshot({ path: test.info().outputPath('python-light.png') });
    await box.getByRole('button', { name: '예제 초기화' }).click();
    await expect(box.locator('.cm-content')).toContainText('plt.show()');
    await expect(results(box).locator('table')).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test('renders Series, scalar and 1D/2D/3D arrays safely, truncates previews, and isolates examples', async ({ page }) => {
    await page.goto(url);
    const box = widget(page, 1);
    await run(box);
    await expect(results(box)).toContainText('Series · dtype=int64');
    await expect(results(box)).toContainText('ndarray · shape=(2, 2, 2) · dtype=int32');
    await expect(results(box).locator('table')).toHaveCount(3);
    await expect(results(box).locator('table').last().locator('tbody tr').last()).toContainText('7');
    await edit(box, `import numpy as np
import pandas as pd
display(np.array(42), np.array([1, 2]), np.arange(4).reshape(2, 2))
display(pd.DataFrame(np.arange(800).reshape(40, 20)))
display(pd.DataFrame({"text": ["<img src=x onerror=alert(1)>", None]}))
print("<script>alert(1)</script>")`);
    await run(box);
    await expect(results(box)).toContainText('shape=()');
    await expect(results(box)).toContainText('shape=(2,)');
    await expect(results(box)).toContainText('shape=(2, 2)');
    await expect(results(box)).toContainText('전체 40행 × 20열 · 앞 30행 / 12열까지 표시');
    const largeTable = results(box).locator('table').nth(2);
    await expect(largeTable.locator('tbody tr')).toHaveCount(30);
    await expect(largeTable.locator('thead th')).toHaveCount(13);
    await expect(results(box)).toContainText('<img src=x onerror=alert(1)>');
    await expect(results(box).locator('img, script')).toHaveCount(0);
    await edit(widget(page), 'print("다른 예제")');
    await run(widget(page));
    await expect(status(box)).toContainText('다른 예제로 이동');
    await expect(results(box)).toContainText('shape=(2, 2)');
  });

  test('shows errors, starts with fresh variables, stops infinite loops and recovers after timeouts', async ({ page }) => {
    await page.goto(url);
    const box = widget(page);
    await edit(box, 'remember = 1\nprint("오류 전 출력")\n1 / 0');
    await box.getByRole('button', { name: '실행', exact: true }).click();
    await expect(status(box)).toContainText('코드 오류', { timeout: 150_000 });
    await expect(results(box)).toContainText('오류 전 출력');
    await expect(results(box)).toContainText('ZeroDivisionError');
    await edit(box, 'print("remember" in globals())');
    await run(box);
    await expect(results(box)).toHaveText('False\n');
    await edit(box, 'while True:\n    pass');
    await box.getByRole('button', { name: '실행', exact: true }).click();
    await expect(status(box)).toHaveText('실행 중…');
    await box.getByRole('button', { name: '중지', exact: true }).click();
    await expect(status(box)).toContainText('중지됨');
    await expect(box.locator('.cm-content')).toContainText('while True:');
    await edit(box, 'print("중지 후 재실행")');
    await run(box);
    await expect(results(box)).toHaveText('중지 후 재실행\n');
    await page.clock.install();
    await edit(box, 'while True:\n    pass');
    await box.getByRole('button', { name: '실행', exact: true }).click();
    await expect(status(box)).toHaveText('실행 중…');
    // Worker는 실제로 실행하고 화면의 30초 타이머만 앞으로 이동합니다.
    await page.clock.fastForward(31_000);
    await expect(results(box)).toContainText('30초를 넘어 중지');
    await edit(box, 'print("시간 제한 후 재실행")');
    await run(box);
    await expect(results(box)).toHaveText('시간 제한 후 재실행\n');
  });

  test('recovers from CDN and CSV failures and keeps mobile output inside the screen', async ({ page, context }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await context.route('https://cdn.jsdelivr.net/pyodide/**', (route) => route.abort());
    await page.goto(url);
    const box = widget(page);
    await box.getByRole('button', { name: '실행', exact: true }).click();
    await expect(status(box)).toContainText('다시 실행할 수 있습니다', { timeout: 30_000 });
    await context.unroute('https://cdn.jsdelivr.net/pyodide/**');
    await context.route('**/data/python-visualization/study-hours.csv', (route) => route.fulfill({ status: 404, body: 'Not found' }));
    await box.getByRole('button', { name: '실행', exact: true }).click();
    await expect(results(box)).toContainText('HTTP 404', { timeout: 150_000 });
    await context.unroute('**/data/python-visualization/study-hours.csv');
    await run(box);
    await expect(results(box).locator('table')).toHaveCount(1);
    await results(box).locator('img').evaluate((image) => (image as HTMLImageElement).decode());
    await box.locator('.python-toolbar').scrollIntoViewIfNeeded();
    await page.screenshot({ path: test.info().outputPath('python-mobile.png'), fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.setViewportSize({ width: 320, height: 720 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(await box.evaluate((node) => node.scrollWidth <= node.clientWidth + 1)).toBe(true);
  });

  test('keeps readable code without JavaScript and loads no Python for normal articles', async ({ browser, page }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const staticPage = await context.newPage();
    await staticPage.goto(`http://127.0.0.1:4321${url}`);
    await expect(widget(staticPage).locator('textarea')).toHaveValue(/pd.read_csv/);
    await expect(widget(staticPage).getByRole('button', { name: '실행', exact: true })).toBeDisabled();
    await expect(staticPage.getByText('코드를 실행하려면 브라우저의 JavaScript를 켜 주세요.').first()).toBeVisible();
    await context.close();
    const requests: string[] = [];
    page.on('request', (request) => requests.push(request.url()));
    await page.goto('/posts/python-study01/');
    await expect(page.locator('.post-reader h1')).toBeVisible();
    expect(requests.filter((request) => request.includes('pyodide'))).toEqual([]);
  });
});
