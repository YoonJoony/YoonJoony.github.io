import { test, expect } from '@playwright/test';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const summary = (page: import('@playwright/test').Page, path: string) => page.locator('details[data-folder="' + path + '"] > summary');

test('home follows the approved layout and has no missing images', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: '땃땃한 최신글' })).toBeVisible();
  await expect(page.locator('.recent-grid .post-card')).toHaveCount(3);
  await expect(page.getByRole('heading', { name: 'News Research' })).toBeVisible();
  await expect(page.getByText('뉴스 리서치를 준비 중입니다')).toBeVisible();
  await expect(page.getByText('All blog posts', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Projects', exact: true })).toHaveCount(0);
  expect(await page.locator('body').innerText()).not.toContain('↗');
  const header = await page.locator('.site-header').boundingBox();
  const recent = await page.locator('.recent-section').boundingBox();
  expect(header!.x).toBe(recent!.x);
  expect(header!.width).toBe(recent!.width);
  await page.locator('.news-section').scrollIntoViewIfNeeded();
  await expect.poll(() => page.locator('img').evaluateAll((images) => images.every((image) => image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0))).toBe(true);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.screenshot({ path: test.info().outputPath('home-desktop.png'), fullPage: true });
  expect(errors).toEqual([]);
});

test('the first category opens on entry while manual collapse, history and folder links still work', async ({ page }) => {
  await page.goto('/posts/');
  await expect(page.locator('.root-folder').first()).toHaveAttribute('open', '');
  await expect(page.locator('details[open]')).toHaveCount(1);
  await expect(summary(page, 'DE Map/Python')).toBeVisible();
  await expect(page.locator('[data-reader-selection]')).toBeHidden();
  await page.reload();
  await expect(page.locator('details[open]')).toHaveCount(1);
  await summary(page, 'DE Map').click();
  await expect(page.locator('details[open]')).toHaveCount(0);
  await summary(page, 'BE Map').click();
  await expect(page.locator('details[data-folder="BE Map"]')).toHaveAttribute('open', '');
  await expect(page.locator('details[open]')).toHaveCount(1);
  await page.goBack();
  await expect(page.locator('details[open]')).toHaveCount(0);
  await page.goBack();
  await expect(page.locator('.root-folder').first()).toHaveAttribute('open', '');
  await page.goForward();
  await expect(page.locator('details[open]')).toHaveCount(0);
  await page.goto('/posts/?folder=Blog');
  await expect(page.locator('details[data-folder="Blog"]')).toHaveAttribute('open', '');
  await expect(page.locator('details[open]')).toHaveCount(1);
  await expect(page.locator('[data-post-card="blog-memo"]')).toBeVisible();
  await page.reload();
  await expect(page.locator('details[data-folder="Blog"]')).toHaveAttribute('open', '');
});

test('folders open one branch; articles retain folder depth, refresh and history', async ({ page }) => {
  await page.goto('/posts/');
  await expect(page.locator('details[open]')).toHaveCount(1);
  await expect(page.locator('.root-folder')).toHaveCount(4);
  await summary(page, 'DE Map/Python').click();
  await summary(page, 'DE Map/Python/파이썬 기본기').click();
  const lessons = page.locator('details[data-folder="DE Map/Python/파이썬 기본기"] .post-card');
  await expect(lessons).toHaveCount(3);
  await lessons.first().getByRole('heading').getByRole('link').click();
  await expect(page).toHaveURL(/\/posts\/python-study01\//);
  await expect(page.locator('.post-reader h1')).toHaveText('실행환경 및 패키지');
  await expect(page.locator('details[open]')).toHaveCount(3);
  await page.reload();
  await expect(page.locator('details[open]')).toHaveCount(3);
  await page.locator('.article-cover').evaluate((image) => (image as HTMLImageElement).decode());
  await page.screenshot({ path: test.info().outputPath('posts-desktop.png'), fullPage: true });
  const desktopSize = await page.evaluate(() => ({ height: innerHeight, scroll: document.documentElement.scrollHeight, boxes: [...document.querySelectorAll('body,.posts-main,.posts-workspace,.site-header,.site-footer,.reader-pane')].map((item) => ({ class: item.className, top: item.getBoundingClientRect().top, height: item.getBoundingClientRect().height, overflow: getComputedStyle(item).overflow, minHeight: getComputedStyle(item).minHeight })) }));
  expect(desktopSize.scroll, JSON.stringify(desktopSize)).toBeLessThanOrEqual(desktopSize.height + 1);
  const parent = await summary(page, 'DE Map/Python').boundingBox();
  const nested = await lessons.first().boundingBox();
  expect(nested!.x).toBeGreaterThan(parent!.x);
  await summary(page, 'BE Map').click();
  await expect(page.locator('details[data-folder="DE Map"]')).not.toHaveAttribute('open', '');
  await expect(page.getByText('아직 공개된 글이 없습니다.').filter({ visible: true })).toBeVisible();
  await expect(page.locator('[data-reader-selection]')).toBeHidden();
  await page.goBack();
  await expect(page.locator('.post-reader h1')).toBeVisible();
  await expect(page.locator('details[open]')).toHaveCount(3);
});

test('tag filtering, incompatible deep links and browser history agree', async ({ page }) => {
  await page.goto('/posts/python-study01/?tag=ai');
  await expect(page).toHaveURL(/\/posts\/python-study01\/$/);
  await page.locator('[data-filter-tag="python"]').click();
  await expect(page.locator('.post-reader h1')).toBeVisible();
  await page.locator('[data-filter-tag="algorithm"]').click();
  await expect(page.locator('[data-reader-selection]')).toBeHidden();
  await expect(page).toHaveURL(/\/posts\/\?folder=.*&tag=algorithm/);
  await expect(page.locator('[data-post-card="python-study03"]')).toBeVisible();
  await expect(page.locator('[data-post-card="python-study01"]')).toBeHidden();
  await page.goBack();
  await expect(page.locator('.post-reader h1')).toBeVisible();
  await page.reload();
  await expect(page.locator('[data-filter-tag="python"]')).toHaveAttribute('aria-current', 'true');
  await page.goto('/posts/?tag=python');
  await expect(page.locator('details[open]')).toHaveCount(1);
  await expect(page.locator('.root-folder').first()).toHaveAttribute('open', '');
  await expect(page.locator('[data-filter-tag="python"]')).toHaveAttribute('aria-current', 'true');
});

test('keyboard navigation, theme persistence and legacy URLs work', async ({ page }) => {
  await page.goto('/posts/');
  await summary(page, 'DE Map').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('details[data-folder="DE Map"]')).not.toHaveAttribute('open', '');
  await page.keyboard.press('Enter');
  await expect(page.locator('details[data-folder="DE Map"]')).toHaveAttribute('open', '');
  await page.getByRole('button', { name: '밝은 테마로 변경' }).click();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.goto('/blog/first-post/');
  await expect(page).toHaveURL(/\/posts\/archive-first-post\//);
  await expect(page.locator('.post-reader h1')).toHaveText('First post');
});

test('mobile has a readable article and a working return to its folder', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.goto('/posts/');
  await expect(page.locator('.posts-sidebar')).toBeVisible();
  await expect(page.locator('.root-folder').first()).toHaveAttribute('open', '');
  await expect(page.locator('details[open]')).toHaveCount(1);
  await page.goto('/posts/python-study01/');
  await expect(page.locator('.posts-sidebar')).toBeHidden();
  await expect(page.locator('.post-reader h1')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: test.info().outputPath('posts-mobile.png'), fullPage: true });
  await page.getByRole('link', { name: '목록으로 돌아가기' }).click();
  await expect(page.locator('.posts-sidebar')).toBeVisible();
  await expect(page.locator('[data-post-card="python-study01"]')).toBeVisible();
  await page.locator('[data-post-card="python-study02"] h3 a').click();
  await expect(page.locator('.post-reader h1')).toHaveText('문법복습 기본자료형 및 제어문');
  await page.setViewportSize({ width: 320, height: 720 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('without JavaScript, static article and expandable folder links remain usable', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4321/posts/python-study01/');
  await expect(page.locator('.post-reader h1')).toBeVisible();
  await expect(page.locator('.prose')).toContainText('venv');
  await page.goto('http://127.0.0.1:4321/posts/');
  await expect(page.locator('.root-folder').first()).toHaveAttribute('open', '');
  await expect(page.locator('details[open]')).toHaveCount(1);
  await summary(page, 'DE Map/Python').click();
  await summary(page, 'DE Map/Python/파이썬 기본기').click();
  await page.locator('[data-post-card="python-study01"] h3 a').click();
  await expect(page.locator('.post-reader h1')).toBeVisible();
  await context.close();
});

test('drafts and archived templates are absent from public discovery and feeds', async ({ request }) => {
  const rss = await (await request.get('/rss.xml')).text();
  // 새 글을 쓸 때마다 수치를 바꾸지 않고 실제 공개 글과 RSS를 대조합니다.
  const entries = readdirSync('src/content/blog', { recursive: true, encoding: 'utf8' })
    .filter((path) => path.includes('/') && /\.mdx?$/.test(path))
    .map((path) => readFileSync(join('src/content/blog', path), 'utf8'));
  const publicSlugs = entries.filter((source) => !/^draft:\s*true\s*$/m.test(source))
    .map((source) => source.match(/^slug:\s*(\S+)\s*$/m)![1]);
  expect((rss.match(/<item>/g) ?? []).length).toBe(publicSlugs.length);
  for (const slug of publicSlugs) expect(rss).toContain(`/posts/${slug}/`);
  expect(rss).not.toContain('axi-0922');
  expect(rss).not.toContain('axi-1002');
  expect(rss).toContain('dlnpl-book');
  expect(rss).toContain('blog-memo');
  expect(rss).not.toContain('archive-');
  for (const name of readdirSync('dist').filter((name) => /^sitemap.*\.xml$/.test(name))) {
    const sitemap = readFileSync(join('dist', name), 'utf8');
    expect(sitemap).not.toContain('/posts/axi-0922/');
    expect(sitemap).not.toContain('/posts/axi-1002/');
    expect(sitemap).not.toContain('/posts/archive-');
    expect(sitemap).not.toContain('/blog/');
  }
  expect((await request.get('/posts/axi-0922/')).status()).toBe(404);
  expect((await request.get('/posts/axi-1002/')).status()).toBe(404);
  expect((await request.get('/posts/dlnpl-book/')).status()).toBe(200);
});
