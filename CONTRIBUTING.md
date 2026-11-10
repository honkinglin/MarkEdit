# 参与开发

## 环境与命令

使用 `.nvmrc` 指定的 Node.js 24 和 npm；首次运行 `npm ci`。工作台使用 `npm run dev`，独立组件示例先运行 `npm run example:setup` 再运行 `npm run example:dev`。

提交前运行：

```bash
npm run check
npm run example:setup
npm run example:build
npx playwright install chromium firefox webkit
npm run test:e2e
npm run benchmark
npm run release:report
```

浏览器测试启动两个生产预览服务（4173/4174），不复用已有服务；请先释放这些端口。每项测试使用独立浏览器上下文，不读取个人浏览器草稿。`test-results` 保存失败截图、trace 和视频；`playwright-report` 为 HTML 报告。`npx playwright show-report` 可在本机查看。

## 模块边界

- `src/`：工作台、IndexedDB 文档仓库与保存队列。
- `packages/editor/src/`：唯一的组件实现；不得依赖工作台存储或全局主题。
- `examples/react-consumer/`：独立安装 tarball，禁止添加指向包源码的 alias。
- `e2e/`：真实生产构建上的用户流程；用可访问名称定位，不依赖随机 ID。
- `project/`：随 Git 提交的架构、验收和发布记录。`docs/` 保留现有本地忽略规则。

## 修改要求

代码使用 Prettier：`npm run format`。修复数据保存或编辑契约时补充能复现问题的测试；避免只验证实现细节。受控状态、撤销、跨文档切换、只读和异步上传尤其需要回归。

修改包后重新生成 tarball 并运行 `example:setup`，提交更新后的两个 lockfile。`.benchmarks` 不提交；包名或版本改变时同步示例的本地文件依赖。版本升级与发布单独进行，不在普通修复中取消 `private`。

PR 描述说明触发条件、修改后的行为、验证命令与未验证范围。不要添加未经实测的性能或兼容性保证。禁止将个人草稿、凭证、真实上传文件写入测试夹具、截图或报告。

仓库：[honkinglin/MarkEdit](https://github.com/honkinglin/MarkEdit)。本项目采用 MIT 许可，欢迎通过仓库 Issue/PR 提交反馈和贡献。
