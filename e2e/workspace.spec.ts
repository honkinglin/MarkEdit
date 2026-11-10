import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

async function ready(page: Page) {
  await page.goto('/');
  await expect(page.getByRole('textbox', { name: 'Markdown 源码' })).toBeVisible();
}
async function command(page: Page, label: string) {
  await page.getByRole('button', { name: '打开命令菜单' }).click();
  await page.getByRole('textbox', { name: '搜索命令' }).fill(label);
  await page.getByRole('textbox', { name: '搜索命令' }).press('Enter');
}

test('中文编辑、保存、刷新与 Markdown 下载', async ({ page }, info) => {
  await ready(page);
  const source = '# 发布验收\n\n中文内容与 **格式**。\n\n## 第二节\n\n- [x] 完成';
  await page.getByRole('textbox', { name: 'Markdown 源码' }).fill(source);
  await page.getByRole('textbox', { name: '文档名称' }).fill('发布验收.md');
  await command(page, '保存当前文档');
  await expect(page.getByText('已保存当前文档', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: '发布验收', exact: true })).toBeVisible();
  await expect(page.getByRole('textbox', { name: '文档名称' })).toHaveValue('发布验收.md');
  const downloaded = page.waitForEvent('download');
  await page.getByRole('button', { name: '导出 Markdown', exact: true }).click();
  const file = await downloaded;
  expect(file.suggestedFilename()).toBe('发布验收.md');
  expect(await readFile((await file.path())!, 'utf8')).toBe(source);
  await page.screenshot({ path: info.outputPath('workbench.png'), fullPage: true });
});

test('命令菜单键盘路径与对话框焦点', async ({ page }) => {
  await ready(page);
  await page.getByRole('textbox', { name: 'Markdown 源码' }).press('ControlOrMeta+k');
  const dialog = page.getByRole('dialog', { name: '命令与快捷键' });
  await expect(dialog).toBeVisible();
  await expect(page.getByRole('textbox', { name: '搜索命令' })).toBeFocused();
  await page.getByRole('textbox', { name: '搜索命令' }).fill('新建文档');
  await page.getByRole('textbox', { name: '搜索命令' }).press('Enter');
  await expect(dialog).not.toBeVisible();
  await expect(page.getByText('已新建文档', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '链接', exact: true }).click();
  await expect(page.getByRole('dialog', { name: '插入链接' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: '插入链接' })).not.toBeVisible();
  await expect(page.getByRole('button', { name: '链接', exact: true })).toBeFocused();
});

test('备份再导入创建独立副本', async ({ page }) => {
  await ready(page);
  await page.getByRole('textbox', { name: 'Markdown 源码' }).fill('# 备份往返\n\n唯一内容');
  const downloaded = page.waitForEvent('download');
  await command(page, '备份全部文档与历史');
  const backup = await downloaded;
  const path = (await backup.path())!;
  const content = await readFile(path, 'utf8');
  expect(content).toContain('备份往返');
  const chooser = page.waitForEvent('filechooser');
  await command(page, '导入工作台备份');
  await (
    await chooser
  ).setFiles({ name: 'backup.json', mimeType: 'application/json', buffer: Buffer.from(content) });
  await expect(
    page.getByText('已将备份导入为独立副本，现有文档未被覆盖', { exact: true }),
  ).toBeVisible();
  const expand = page.getByRole('button', { name: '展开侧栏' });
  if (await expand.isVisible()) await expand.click();
  await expect(page.getByRole('button', { name: '文档 2', exact: true })).toBeVisible();
});

test('扩展渲染与非法图表局部回退', async ({ page }) => {
  await ready(page);
  await page
    .getByRole('textbox', { name: 'Markdown 源码' })
    .fill('# 扩展验收\n\n公式 $x^2$\n\n```mermaid\nflowchart LR\n A[写作] --> B[预览]\n```');
  await expect(page.locator('.katex')).toBeVisible();
  await expect(page.getByRole('img', { name: 'Mermaid 图表' })).toBeVisible();
  await page
    .getByRole('textbox', { name: 'Markdown 源码' })
    .fill('# 正文仍然可用\n\n```mermaid\nnot-a-diagram\n```');
  await expect(page.getByText('图表暂时无法渲染', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: '正文仍然可用' })).toBeVisible();
});
