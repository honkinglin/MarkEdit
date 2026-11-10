import type { Page } from '@playwright/test';
// CodeMirror owns contenteditable DOM; use keyboard input rather than replacing its DOM with fill().
export async function replaceMarkdown(page: Page, label: string, content: string) {
  const input = page.getByRole('textbox', { name: label, exact: true });
  await input.click();
  await input.press('ControlOrMeta+a');
  // Firefox's insertText does not reliably update CodeMirror's document.
  if (page.context().browser()?.browserType().name() !== 'firefox') {
    await page.keyboard.insertText(content);
    return;
  }
  await input.press('Backspace');
  const lines = content.split('\n');
  for (let index = 0; index < lines.length; index += 1) {
    if (index > 0) await input.press('Enter');
    await input.pressSequentially(lines[index]);
  }
}
