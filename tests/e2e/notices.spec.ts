import { test, expect, type Page } from '@playwright/test';

const fixture = (scenario: string) => `/__tests/notices/${scenario}/`;
const originals = (page: Page) => page.locator('[data-notice-original] a');
const animationTime = (page: Page) => page.locator('[data-notice-track]').evaluate((track) =>
  Number(track.getAnimations()[0]?.currentTime ?? 0));
const noPageOverflow = async (page: Page) => {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
};

test('compact notices match the design in both themes; no notices leaves the original spacing', async ({ page }) => {
  await page.goto(fixture('short'));
  const bar = page.locator('notice-bar');
  await expect(bar).toHaveAttribute('data-mode', 'static');
  await expect(bar.getByRole('heading')).toHaveText('공지');
  await expect(bar.locator('svg, img')).toHaveCount(0);
  await expect(originals(page)).toHaveCount(3);
  await expect(bar.locator('[data-notice-copy]')).toHaveCount(0);
  await expect(bar.getByRole('button')).toBeHidden();
  await expect(bar.locator('.notice-chip').first()).toHaveCSS('border-radius', '4px');
  await expect(bar.locator('.notice-chip').first()).toHaveCSS('background-color', 'rgb(43, 43, 43)');
  expect((await originals(page).first().boundingBox())!.height).toBe(44);
  await expect(page.locator('.profile-hero')).toHaveCSS('margin-bottom', '24px');
  await page.screenshot({ path: test.info().outputPath('notice-desktop-dark.png'), fullPage: true });
  await page.getByRole('button', { name: '밝은 테마로 변경' }).click();
  await expect(bar.locator('.notice-chip').first()).toHaveCSS('background-color', 'rgb(233, 233, 229)');
  await page.screenshot({ path: test.info().outputPath('notice-desktop-light.png'), fullPage: true });
  await originals(page).first().click();
  await expect(page).toHaveURL(/\/posts\/blog-memo\/$/);
  await page.goto(fixture('empty'));
  await expect(page.locator('notice-bar')).toHaveCount(0);
  await expect(page.locator('.profile-hero')).toHaveCSS('margin-bottom', '52px');
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('.profile-hero')).toHaveCSS('margin-bottom', '38px');
});

test('overflow moves at a steady pace and supports hover and explicit pause/resume', async ({ page }) => {
  await page.goto(fixture('long'));
  const bar = page.locator('notice-bar');
  await expect(bar).toHaveAttribute('data-mode', 'auto');
  await expect(page.locator('[data-notice-copy]')).toHaveCount(1);
  await expect(page.getByRole('region', { name: '공지' }).getByRole('link')).toHaveCount(3);
  await expect.poll(() => animationTime(page)).toBeGreaterThan(1700);
  const before = await animationTime(page);
  await expect.poll(() => animationTime(page)).toBeGreaterThan(before + 100);
  await bar.hover();
  await expect.poll(() => page.locator('[data-notice-track]').evaluate((track) => track.getAnimations()[0].playState)).toBe('paused');
  const stopped = await animationTime(page);
  await page.waitForTimeout(150);
  expect(await animationTime(page)).toBe(stopped);
  await page.mouse.move(0, 0);
  await expect.poll(() => animationTime(page)).toBeGreaterThan(stopped + 50);
  await page.getByRole('button', { name: '공지 자동 이동 멈춤' }).click();
  await expect(bar).toHaveAttribute('data-mode', 'manual');
  await expect(page.locator('[data-notice-copy]')).toHaveCount(0);
  await page.mouse.move(0, 0);
  await expect(page.getByRole('button', { name: '공지 자동 이동 재생' })).toBeVisible();
  await page.getByRole('button', { name: '공지 자동 이동 재생' }).click();
  await page.mouse.move(0, 0);
  await expect(bar).toHaveAttribute('data-mode', 'auto');
  await expect(page.locator('[data-notice-copy]')).toHaveCount(1);
  await noPageOverflow(page);
});

test('keyboard visits only original links and brings each focused title into view', async ({ page }) => {
  await page.goto(fixture('long'));
  await page.getByRole('link', { name: '소개 더 보기' }).focus();
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press('Tab');
    await expect(originals(page).nth(i)).toBeFocused();
    await expect(page.locator('notice-bar')).toHaveAttribute('data-mode', 'manual');
    const link = (await originals(page).nth(i).boundingBox())!;
    const viewport = (await page.locator('[data-notice-viewport]').boundingBox())!;
    expect(link.x).toBeLessThan(viewport.x + viewport.width);
    expect(link.x + link.width).toBeGreaterThan(viewport.x);
  }
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: '공지 자동 이동 재생' })).toBeFocused();
  await expect(page.locator('[data-notice-copy]')).toHaveCount(0);
});

test('resizing and larger text recalculate overflow without accumulating copies', async ({ page }) => {
  await page.goto(fixture('short'));
  for (const width of [768, 390, 1440, 320, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    const small = width < 500;
    await expect(page.locator('notice-bar')).toHaveAttribute('data-mode', small ? 'auto' : 'static');
    await expect(page.locator('[data-notice-copy]')).toHaveCount(small ? 1 : 0);
    await noPageOverflow(page);
  }
  await page.setViewportSize({ width: 768, height: 1000 });
  await page.addStyleTag({ content: '.notice-chip { font-size: 30px; }' });
  await expect(page.locator('notice-bar')).toHaveAttribute('data-mode', 'auto');
  await expect(page.locator('[data-notice-copy]')).toHaveCount(1);
  await noPageOverflow(page);
});

test('reduced motion and JavaScript disabled retain readable, scrollable links', async ({ page, browser }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(fixture('single'));
  await expect(page.locator('notice-bar')).toHaveAttribute('data-mode', 'manual');
  await expect(page.locator('[data-notice-copy]')).toHaveCount(0);
  await expect(page.locator('[data-notice-toggle]')).toBeHidden();
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(page.locator('notice-bar')).toHaveAttribute('data-mode', 'auto');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('[data-notice-copy]')).toHaveCount(0);
  await noPageOverflow(page);

  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const staticPage = await context.newPage();
  await staticPage.goto('http://127.0.0.1:4322' + fixture('long'));
  await expect(originals(staticPage)).toHaveCount(3);
  await expect(staticPage.locator('[data-notice-copy]')).toHaveCount(0);
  await expect(staticPage.locator('[data-notice-toggle]')).toBeHidden();
  const last = originals(staticPage).last();
  await last.scrollIntoViewIfNeeded();
  expect(await staticPage.locator('[data-notice-viewport]').evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
  await last.click();
  await expect(staticPage).toHaveURL(/\/posts\/python-study01\/$/);
  await context.close();
});

test('the repeated title stays clickable at the loop boundary and history restores the bar', async ({ page }) => {
  await page.goto(fixture('long'));
  await expect(page.locator('[data-notice-copy]')).toHaveCount(1);
  const boundaryShift = await page.locator('[data-notice-track]').evaluate((track) => {
    const animation = track.getAnimations()[0];
    animation.pause();
    const end = Number(animation.effect!.getTiming().duration) + 1500;
    animation.currentTime = end - 1;
    const before = track.querySelector('[data-notice-copy]')!.getBoundingClientRect().x;
    animation.currentTime = end + 1;
    const after = track.querySelector('[data-notice-original]')!.getBoundingClientRect().x;
    return Math.abs(after - before);
  });
  expect(boundaryShift).toBeLessThan(1);
  await page.locator('[data-notice-track]').evaluate((track) => {
    const animation = track.getAnimations()[0];
    animation.pause();
    // 다음 주기 직전으로 이동해, 오른쪽에서 다시 나타난 복제 링크를 확인합니다.
    animation.currentTime = Number(animation.effect!.getTiming().duration) + 1490;
  });
  const copy = page.locator('[data-notice-copy] a').first();
  await expect(copy).toHaveAttribute('tabindex', '-1');
  await copy.click({ position: { x: 50, y: 22 } });
  await expect(page).toHaveURL(/\/posts\/blog-memo\/$/);
  await page.goBack();
  await expect(page.locator('notice-bar')).toHaveAttribute('data-mode', 'auto');
  await expect(page.locator('[data-notice-copy]')).toHaveCount(1);
});

test('mobile touch can pause, swipe and then follow a title without page overflow', async ({ browser }) => {
  const context = await browser.newContext({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4322' + fixture('long'));
  const viewport = page.locator('[data-notice-viewport]');
  await viewport.scrollIntoViewIfNeeded();
  const box = (await viewport.boundingBox())!;
  const client = await context.newCDPSession(page);
  const x = box.x + box.width - 20;
  const y = box.y + box.height / 2;
  await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  for (let delta = 10; delta <= 120; delta += 10) {
    await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x - delta, y }] });
  }
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect(page.locator('notice-bar')).toHaveAttribute('data-mode', 'manual');
  expect(await viewport.evaluate((element) => element.scrollLeft)).toBeGreaterThan(50);
  await expect(page.getByRole('button', { name: '공지 자동 이동 재생' })).toBeVisible();
  await noPageOverflow(page);
  await page.screenshot({ path: test.info().outputPath('notice-mobile.png'), fullPage: true });
  await page.touchscreen.tap(box.x + 50, y);
  await expect(page).toHaveURL(/\/posts\/blog-memo\/$/);
  await context.close();
});
