import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { replaceMarkdown } from './helpers';

async function ready(page: Page) {
  await page.goto('/');
  await expect(page.getByRole('textbox', { name: 'Markdown source' })).toBeVisible();
}
async function command(page: Page, label: string) {
  await page.getByRole('button', { name: 'Open command menu' }).click();
  await page.getByRole('textbox', { name: 'Search commands' }).fill(label);
  await page.getByRole('textbox', { name: 'Search commands' }).press('Enter');
}

test('中文编辑、保存、刷新与 Markdown 下载', async ({ page }, info) => {
  await ready(page);
  const source = '# 发布验收\n\n中文内容与 **格式**。\n\n## 第二节\n\n- [x] 完成';
  await replaceMarkdown(page, 'Markdown source', source);
  await page.getByRole('textbox', { name: 'Document name' }).fill('发布验收.md');
  await command(page, 'Save current document');
  await expect(page.getByText('Document saved', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: '发布验收', exact: true })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Document name' })).toHaveValue('发布验收.md');
  const downloaded = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export Markdown', exact: true }).click();
  const file = await downloaded;
  expect(file.suggestedFilename()).toBe('发布验收.md');
  expect(await readFile((await file.path())!, 'utf8')).toBe(source);
  await page.screenshot({ path: info.outputPath('workbench.png'), fullPage: true });
});

test('命令菜单键盘路径与对话框焦点', async ({ page }) => {
  await ready(page);
  await page.getByRole('textbox', { name: 'Markdown source' }).press('ControlOrMeta+k');
  const dialog = page.getByRole('dialog', { name: 'Commands and shortcuts' });
  await expect(dialog).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Search commands' })).toBeFocused();
  await page.getByRole('textbox', { name: 'Search commands' }).fill('New document');
  await page.getByRole('textbox', { name: 'Search commands' }).press('Enter');
  await expect(dialog).not.toBeVisible();
  await expect(page.getByText('Document created', { exact: true })).toBeVisible();
  const linkButton = page.getByRole('button', { name: 'Link', exact: true });
  await linkButton.focus();
  await linkButton.press('Enter');
  await expect(page.getByRole('dialog', { name: 'Insert link' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Insert link' })).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Link', exact: true })).toBeFocused();
});

test('备份再导入创建独立副本', async ({ page }) => {
  await ready(page);
  await replaceMarkdown(page, 'Markdown source', '# 备份往返\n\n唯一内容');
  const downloaded = page.waitForEvent('download');
  await command(page, 'Back up all documents and history');
  const backup = await downloaded;
  const path = (await backup.path())!;
  const content = await readFile(path, 'utf8');
  expect(content).toContain('备份往返');
  const chooser = page.waitForEvent('filechooser');
  await command(page, 'Import workspace backup');
  await (
    await chooser
  ).setFiles({ name: 'backup.json', mimeType: 'application/json', buffer: Buffer.from(content) });
  await expect(
    page.getByText(
      'Backup imported as independent copies. Existing documents were not overwritten.',
      { exact: true },
    ),
  ).toBeVisible();
  const expand = page.getByRole('button', { name: 'Expand sidebar' });
  if (await expand.isVisible()) await expand.click();
  await expect(page.getByRole('button', { name: 'Documents 2', exact: true })).toBeVisible();
});

test('扩展渲染与非法图表局部回退', async ({ page }) => {
  await ready(page);
  await replaceMarkdown(
    page,
    'Markdown source',
    '# 扩展验收\n\n公式 $x^2$\n\n```mermaid\nflowchart LR\n A[写作] --> B[预览]\n```',
  );
  await expect(page.locator('.katex')).toBeVisible();
  await expect(page.getByRole('img', { name: 'Mermaid diagram' })).toBeVisible();
  await replaceMarkdown(
    page,
    'Markdown source',
    '# 正文仍然可用\n\n```mermaid\nnot-a-diagram\n```',
  );
  await expect(page.getByText('Could not render diagram', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: '正文仍然可用' })).toBeVisible();
});

test.describe('English defaults', () => {
  test.use({ locale: 'zh-CN' });

  test('uses English UI and templates regardless of browser language', async ({ page }, info) => {
    await ready(page);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByRole('textbox', { name: 'Document name' })).toHaveValue(
      'Getting started.md',
    );
    await expect(
      page.getByRole('heading', { name: 'Give your ideas room to grow.' }),
    ).toBeVisible();
    await expect(page.locator('body')).not.toContainText(/[\u3400-\u9fff]/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(
      false,
    );
    await page.screenshot({ path: info.outputPath('welcome.png'), fullPage: true });
    await page.getByRole('button', { name: 'Open command menu' }).click();
    await page.getByRole('textbox', { name: 'Search commands' }).fill('NEW DOCUMENT');
    await page.getByRole('textbox', { name: 'Search commands' }).press('Enter');
    await expect(page.getByRole('textbox', { name: 'Document name' })).toHaveValue('Untitled.md');
    await expect(page.getByText('0 characters', { exact: false })).toBeVisible();
    await page.getByRole('button', { name: 'Version history', exact: true }).click();
    await expect(page.getByRole('region', { name: 'Version history' })).toBeVisible();
    await expect(page.locator('body')).not.toContainText(/[\u3400-\u9fff]/);
  });
});

test('Desktop Markdown commands and responsive outline navigation', async ({ page, isMobile }) => {
  await ready(page);
  const input = page.getByRole('textbox', { name: 'Markdown source', exact: true });
  // Android emulation does not reproduce a physical/IME Enter key.
  // Desktop commands are checked here; outline navigation is checked on every project.
  if (!isMobile) {
    await replaceMarkdown(page, 'Markdown source', '- first');
    await input.press('End');
    await input.press('Enter');
    await expect(input).toContainText('- first');
    await input.pressSequentially('second');
    await expect(page.locator('.markdown-body li')).toHaveText(['first', 'second']);
    await input.press('ControlOrMeta+z');
    await expect(page.locator('.markdown-body')).not.toContainText('second');

    await replaceMarkdown(page, 'Markdown source', 'website');
    await expect(page.locator('.markdown-body')).toHaveText('website');
    await input.press('ControlOrMeta+a');
    await expect
      .poll(() => page.evaluate(() => document.getSelection()?.toString()))
      .toBe('website');
    await input.evaluate((element) => {
      const data = new DataTransfer();
      data.setData('text/plain', 'https://example.com');
      // Firefox clears clipboardData in a synthetic ClipboardEvent constructor.
      // Supply test data explicitly; this tests URL-paste handling, not OS permissions.
      const event = new Event('paste', { bubbles: true, cancelable: true });
      Object.defineProperty(event, 'clipboardData', { value: data });
      element.dispatchEvent(event);
    });
    await expect(page.locator('.markdown-body a')).toHaveAttribute('href', 'https://example.com');
  }
  await replaceMarkdown(page, 'Markdown source', '# Repeated\n\n## Repeated\n\n## Last');
  const toggle = page.getByRole('button', { name: 'Document outline', exact: true });
  if ((await toggle.getAttribute('aria-pressed')) !== 'true') await toggle.click();
  const outline = page.getByRole('navigation', { name: 'Document outline' });
  await expect(outline.getByRole('button')).toHaveText(['Repeated', 'Repeated', 'Last']);
  await outline.getByRole('button', { name: 'Last', exact: true }).click();
  await expect(input).toBeFocused();
  const ids = await page
    .locator('.markdown-body h1, .markdown-body h2')
    .evaluateAll((nodes) => nodes.map((node) => node.id));
  expect(new Set(ids).size).toBe(3);
});
