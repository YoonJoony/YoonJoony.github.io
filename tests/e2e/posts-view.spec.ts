import { test, expect } from '@playwright/test';

test('title-only view preserves article selection and remembers each root folder', async ({ page }) => {
  await page.goto('/posts/python-study01/');
  const toggle = page.getByRole('switch', { name: '타이틀만 보기' });
  const card = page.locator('[data-post-card="python-study01"]');
  const url = page.url();
  await expect(toggle).toHaveCount(1);
  await expect(toggle).not.toBeChecked();
  await expect(card.locator('.post-image-link')).toBeVisible();
  await toggle.click();
  await expect(toggle).toBeChecked();
  await expect(page).toHaveURL(url);
  await expect(page.locator('details[open]')).toHaveCount(3);
  await expect(card.locator('.post-image-link')).toBeHidden();
  await expect(card.locator('h3')).toBeVisible();
  await expect(card.locator('.post-description')).toBeVisible();
  await expect(card.locator('.tags')).toBeVisible();
  await expect(page.locator('.article-cover')).toBeVisible();
  await expect(page.locator('.root-folder.is-title-only .post-image-link:visible')).toHaveCount(0);
  await page.screenshot({ path: test.info().outputPath('title-only-dark.png'), fullPage: true });

  await page.locator('[data-post-card="python-study02"] h3 a').click();
  await expect(page).toHaveURL(/\/posts\/python-study02\//);
  await expect(toggle).toBeChecked();
  await page.reload();
  await expect(toggle).toBeChecked();
  await expect(card.locator('.post-image-link')).toBeHidden();

  await page.locator('details[data-folder="Blog"] > summary').click();
  await expect(toggle).toHaveCount(1);
  await expect(toggle).not.toBeChecked();
  await expect(page.locator('[data-post-card="blog-memo"] .post-image-link')).toBeVisible();
  await page.goBack();
  await expect(toggle).toBeChecked();
  await expect(card.locator('.post-image-link')).toBeHidden();
  await toggle.focus();
  await page.keyboard.press('Space');
  await expect(toggle).not.toBeChecked();
  await expect(card.locator('.post-image-link')).toBeVisible();
  await expect(page.locator('.post-reader h1')).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(toggle).toBeChecked();
  await page.getByRole('button', { name: '밝은 테마로 변경' }).click();
  await page.screenshot({ path: test.info().outputPath('title-only-light.png'), fullPage: true });
  await page.locator('details[data-folder="AI Map"] > summary .folder-name').click();
  await expect(toggle).toHaveCount(0);
});

test('title-only switches fit narrow desktop and mobile directory headers', async ({ page }) => {
  for (const width of [1024, 320]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/posts/');
    const roots = page.locator('.root-folder');
    for (let index = 0; index < await roots.count(); index++) {
      const root = roots.nth(index);
      if (!(await root.getAttribute('open') === '')) await root.locator(':scope > summary .folder-name').click();
      const toggle = page.getByRole('switch', { name: '타이틀만 보기' });
      await expect(toggle).toHaveCount(1);
      const headerBox = (await root.locator(':scope > summary').boundingBox())!;
      const toggleBox = (await toggle.boundingBox())!;
      const nameBox = (await root.locator(':scope > summary .folder-name').boundingBox())!;
      expect(toggleBox.x + toggleBox.width).toBeLessThanOrEqual(headerBox.x + headerBox.width);
      expect(toggleBox.x).toBeGreaterThanOrEqual(nameBox.x + nameBox.width);
      expect(Math.abs(toggleBox.y + toggleBox.height / 2 - nameBox.y - nameBox.height / 2)).toBeLessThan(1);
      await toggle.click();
      await expect(toggle).toBeChecked();
      await expect(root).toHaveAttribute('open', '');
    }
    await page.goto('/posts/?folder=AI+Map%2FPython%2F파이썬+기본기');
    await expect(page.locator('[data-post-card="python-study01"] .post-image-link')).toBeHidden();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: test.info().outputPath(`title-only-${width}.png`), fullPage: true });
    await page.evaluate(() => sessionStorage.clear());
  }
});

test('title-only view still works when browser storage is unavailable', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'sessionStorage', { get() { throw new DOMException('Storage blocked', 'SecurityError'); } });
  });
  await page.goto('/posts/?folder=Blog');
  const toggle = page.getByRole('switch', { name: '타이틀만 보기' });
  await toggle.click();
  await expect(page.locator('[data-post-card="blog-memo"] .post-image-link')).toBeHidden();
  await page.locator('details[data-folder="AI Map"] > summary .folder-name').click();
  await page.locator('details[data-folder="Blog"] > summary .folder-name').click();
  await expect(toggle).toBeChecked();
  await toggle.click();
  await expect(page.locator('[data-post-card="blog-memo"] .post-image-link')).toBeVisible();
});
