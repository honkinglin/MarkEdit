# 独立 React 消费示例

从仓库根目录运行：

```bash
npm ci
npm run example:setup
npm run example:dev
```

`example:setup` 构建并打包 `@markedit/react`，再把 tarball 安装到本目录。本示例不属于 npm workspace；所有组件 import 来自安装包，没有源码 alias。`.benchmarks` 是可重新生成的本地构建目录，不提交二进制包。

运行 `npm run example:build` 验证类型声明与生产打包。已经生成 tarball 时也可在本目录执行 `npm ci`，依赖版本以本目录的 package-lock 为准。

界面覆盖受控输入、父组件重置、ref 插入、只读/主题/视图切换、独立非受控实例的卸载重挂、独立预览。内容只存在内存中，不连接工作台存储。
