import { test, expect } from '@playwright/test';
import { replaceMarkdown } from './helpers';

test('tarball 受控更新、只读与实例重挂', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('http://127.0.0.1:4174');
  await expect(page.getByRole('img', { name: 'Mermaid diagram' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('body')).not.toContainText(/[\u3400-\u9fff]/);
  await page.screenshot({ path: info.outputPath('components.png'), fullPage: true });
  const input = page.getByRole('textbox', { name: 'Controlled Markdown source' });
  await replaceMarkdown(page, 'Controlled Markdown source', '# 独立包验收');
  await expect(page.getByRole('heading', { name: '独立包验收' })).toBeVisible();
  await page.getByRole('button', { name: 'Reset by parent' }).click();
  await expect(page.getByRole('heading', { name: 'Reset by parent', exact: true })).toBeVisible();
  await page.getByRole('checkbox', { name: 'Read-only mode' }).check();
  await expect(input).toHaveAttribute('contenteditable', 'false');
  await expect(page.getByRole('button', { name: 'Insert text via ref' })).toBeDisabled();
  await page.getByRole('combobox', { name: 'Theme' }).selectOption('dark');
  await replaceMarkdown(page, 'Independent Markdown source', '# 另一份内容');
  await expect(page.getByRole('heading', { name: 'Reset by parent', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Unmount instance' }).click();
  await expect(page.getByRole('textbox', { name: 'Independent Markdown source' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Remount instance' }).click();
  await expect(page.getByRole('textbox', { name: 'Independent Markdown source' })).toContainText(
    'Free writing',
  );
  await expect(page.getByRole('img', { name: 'Mermaid diagram' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('插入面板使用键盘关闭，页面无横向溢出', async ({ page }) => {
  await page.goto('http://127.0.0.1:4174');
  await page.getByRole('button', { name: 'Table', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Insert table' });
  await expect(dialog).toBeVisible();
  await page.getByRole('spinbutton', { name: 'Data rows' }).fill('2');
  await page.getByRole('spinbutton', { name: 'Columns', exact: true }).fill('2');
  await page.getByRole('button', { name: 'Insert', exact: true }).click();
  await expect(page.getByRole('table').first()).toBeVisible();
  await expect(dialog).not.toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(overflow).toBe(false);
});
