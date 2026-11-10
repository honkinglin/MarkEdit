# 第三方声明

MarkEdit 采用 [MIT 许可](LICENSE)。第三方依赖保留各自版权与许可，不由本项目重新授权。

主要依赖包含 React、CodeMirror、react-markdown/remark、KaTeX、Mermaid、highlight.js、DOMPurify 和 Lucide；版本以 lockfile 为准。`npm run release:report` 会读取实际安装的生产依赖许可字段和 LICENSE/NOTICE 文本，生成 `.benchmarks/third-party-notices.json`，供发布审阅。自动清单不替代许可审核。

KaTeX 字体随组件分发，原许可保留在包内 `dist/licenses/katex-LICENSE.txt`。其余依赖通过 npm 安装；静态演示构建也需要按最终分发方式遵守相应许可。
