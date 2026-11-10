# 发布检查表

当前处于本地发布准备阶段。`private: true` 有意保留，CI 不包含发布凭证、npm publish 或部署步骤。

## 可复现的候选版本

1. `npm ci`；`npm run check`。
2. `npm run example:setup`；`npm run example:build`。
3. `npx playwright install chromium firefox webkit`；`npm run test:e2e`。
4. `npm run benchmark`；`npm run release:report`。
5. 检查 `.benchmarks/release-report.json` 与 `third-party-notices.json`；核对当前 tarball 和消费项目 lockfile 的一致性。

报告中的阻塞项会明确列出；即使本地检查成功，也不会自动宣称已公开发布。GitHub CI 配置本身不等于远端执行成功。

## 公开发布前需要确定

- GitHub 仓库与所有者、npm 包名是否可用、发布账号和版本号。
- 单独确定本项目开源许可；依赖项的 MIT 许可不构成本项目的授权。
- 审阅第三方依赖许可及字体许可；自动清单不代替许可审核。KaTeX 许可已随组件字体产物保留。
- 托管账号与目标（例如 Vercel），演示站的域名与公开范围。
- 更新包 README、CHANGELOG、repository、license、版本与消费项目依赖；再解除组件包 `private`。

## 静态演示部署参数

工作台：仓库根目录，安装 `npm ci`，构建 `npm run build`，输出 `dist`。该应用使用浏览器存储，不需要数据库或密钥；更换域名会进入不同的本地文档空间，用户必须自行导出/导入迁移。

组件示例：根目录运行 `npm ci && npm run example:setup && npm run example:build`，输出 `examples/react-consumer/dist`。示例正文只在内存中。

正式部署前确认静态资源路径、CSP 与图片来源策略；不要把测试报告里的草稿或下载物作为公开站点文件。发布后在真实域名再次验证资源加载、保存/刷新、下载与窄屏交互。

## 尚需人工覆盖

Playwright 的 WebKit 不等同于真实 Safari 全矩阵；移动视口不等同于真机。真实中文输入法组合输入、系统剪贴板权限、浏览器配额耗尽、浏览器崩溃和上传后端还需人工验收。测试中的中文填入不能证明输入法兼容性。
