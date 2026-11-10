import { test, expect } from '@playwright/test';
import { replaceMarkdown } from './helpers';

test('tarball 受控更新、只读与实例重挂', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('http://127.0.0.1:4174');
  const input = page.getByRole('textbox', { name: '受控 Markdown 源码' });
  await replaceMarkdown(page, '受控 Markdown 源码', '# 独立包验收');
  await expect(page.getByRole('heading', { name: '独立包验收' })).toBeVisible();
  await page.getByRole('button', { name: '父组件重置' }).click();
  await expect(page.getByRole('heading', { name: '父组件重置', exact: true })).toBeVisible();
  await page.getByRole('checkbox', { name: '只读模式' }).check();
  await expect(input).toHaveAttribute('contenteditable', 'false');
  await expect(page.getByRole('button', { name: 'ref 插入文字' })).toBeDisabled();
  await page.getByRole('combobox', { name: '主题' }).selectOption('dark');
  await replaceMarkdown(page, '独立 Markdown 源码', '# 另一份内容');
  await expect(page.getByRole('heading', { name: '父组件重置', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '卸载实例' }).click();
  await expect(page.getByRole('textbox', { name: '独立 Markdown 源码' })).toHaveCount(0);
  await page.getByRole('button', { name: '重新挂载' }).click();
  await expect(page.getByRole('textbox', { name: '独立 Markdown 源码' })).toContainText('自由记录');
  await expect(page.getByRole('img', { name: 'Mermaid 图表' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('插入面板使用键盘关闭，页面无横向溢出', async ({ page }) => {
  await page.goto('http://127.0.0.1:4174');
  await page.getByRole('button', { name: '表格', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: '插入表格' });
  await expect(dialog).toBeVisible();
  await page.getByRole('spinbutton', { name: '数据行数' }).fill('2');
  await page.getByRole('spinbutton', { name: '列数', exact: true }).fill('2');
  await page.getByRole('button', { name: '插入', exact: true }).click();
  await expect(page.getByRole('table').first()).toBeVisible();
  await expect(dialog).not.toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(overflow).toBe(false);
});
