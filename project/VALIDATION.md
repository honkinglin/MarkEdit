# 验收记录

## Performance update · 2026-11-10

The P7 implementation and measurements are documented in [PERFORMANCE.md](PERFORMANCE.md). Unit coverage includes committed outline metadata and document replacement. Browser coverage adds desktop list continuation/undo, URL-paste handling, and outline navigation across layouts. Clipboard data is simulated explicitly because Firefox clears data in constructed ClipboardEvents; OS clipboard permissions and actual mobile IME input are not covered by this test.

Final verification: 55 unit tests and 32 browser tests passed. Type checks, production builds, independent package consumption, package verification, the initial-JS budget, and tarball integrity checks passed. Browser latency is measured locally and is not a CI timing gate.

## English interface update · 2026-11-10

- 53 unit tests passed, including English count formatting and preservation of existing multilingual drafts.
- 28 Playwright tests passed across Chromium, Firefox, WebKit, and mobile Chromium. English UI and templates remain the default with a Chinese browser locale. Existing Chinese content still saves, reloads, backs up, and downloads without translation.
- The workspace, reusable component, and independent tarball example build successfully. Package verification follows shared JS chunks when checking external React imports.
- README screenshots were refreshed from the English production builds.
- These changes are local; the latest inspected remote CI ([run 42755427315](https://github.com/honkinglin/MarkEdit/actions/runs/42755427315)) passed for `ca913f7`, before this English update.
- Remaining work is tracked in [STATUS.md](STATUS.md).

## P5 baseline (historical)

日期：2026-11-09。环境：macOS arm64、Node 24.14；本地生产构建与独立 tarball 消费示例。结果针对当前工作区，不能替代推送后的 GitHub CI 和线上域名验收。

## 自动化范围

- 单元测试：51 项，覆盖 Markdown、安全、编辑事务、存储与组件契约。
- Playwright：Chromium 158、Firefox 159、WebKit 27.2 和 Pixel 7 Chromium 视口；每组 6 项，共 24 项。完整矩阵 24/24 通过。格式、类型、单元测试、工作台/组件/独立示例构建和发布报告检查均通过。
- 用户流程：中文编辑/保存/刷新/下载、命令菜单与对话框焦点、备份导入独立副本、公式/图表及错误回退、独立安装组件的受控更新/只读/实例重挂、表格插入与横向溢出。
- 包验证：ESM、类型声明、CSS 作用域、字体文件、外置 React、MIT 与 KaTeX 许可证；独立示例 lockfile 对照 tarball 完整性。

验收发现并修复命令菜单 Enter 的默认行为可能重新触发打开按钮的问题。CodeMirror 输入测试在 Firefox 使用逐键输入及 Enter 换行，其他浏览器使用 insertText，避免直接填入 contenteditable 的合成事件差异；未因此修改编辑器实现。对话框焦点测试使用键盘打开，避免将 WebKit 鼠标点击不自动聚焦按钮的行为误判为焦点恢复错误。

## 性能与构建

100KB（102400 bytes、43760 字符、752 行）文档，20 次测量：目录提取中位数 20.13ms、P95 23.18ms；预览 SSR 中位数 35.94ms、P95 44.98ms。这不是浏览器输入延迟或绘制耗时。运行 `npm run benchmark` 复测，硬件与负载会影响结果。

构建仍有较大 chunk 提示，主要涉及基础编辑依赖与 Mermaid/ELK；尚不能宣称首屏体积或长文交互已完成优化。产物大小、依赖许可清单、tarball 摘要见 `npm run release:report` 生成的 `.benchmarks/` 报告。

## 远端与发布状态

GitHub 已公开：<https://github.com/honkinglin/MarkEdit>。已修复的版本为 `c720478`；[对应 CI](https://github.com/honkinglin/MarkEdit/actions/runs/42754872603) 在本次部署检查时仍在运行，本地通过不代替远端结果。

本项目与组件包使用 MIT。Vercel 项目 `markedit` 已创建在 Kyrie Lin's projects 团队，生产部署 `dpl_BSLFRxTB2bth5k8mB4kf6gDsNFoK` 状态 READY，构建提交 `c720478`，构建约 49 秒。

演示站：<https://markedit-seven.vercel.app>。线上 Chromium 验证公开 HTTP 200、中文编辑/保存/刷新恢复、Markdown 下载内容一致、390px 窄屏无横向溢出，未发现 pageerror。此验证使用全新浏览器上下文，没有修改用户已有文档。已关联 GitHub main，后续推送由 Vercel 自动构建。组件仍为 private，尚未发布 npm 或正式 GitHub release。

## 人工验收与展示

WebKit 不等同于真实 Safari，移动视口不等同于真机；中文逐键输入不等同于系统输入法组合输入。真实 IME、系统剪贴板权限、配额耗尽、崩溃恢复和真实上传后端仍需人工验收。

README 使用已有真实截图；中文保存测试额外输出 `workbench.png`。失败时保留 Playwright trace、截图与视频，CI 上传报告；专门用于展示的演示 GIF/视频尚待制作。
