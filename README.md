# am-editor

暂时处于测试阶段，还未发布任何包

编辑器引擎纯 JavaScript 编写。插件可配合 React 或 Vue 等主流前端库渲染

## Getting Started

Install dependencies,
使用 lerna 管理包和依赖

```bash
$ yarn
```

Start the dev server
事例还未添加各插件的按钮触发，暂时支持快捷键测试，默认快捷键在插件中查看

```bash
$ yarn start
```

Start the dev server by SSR
用于编辑器站点 SSR，同时测试服务端渲染插件

```bash
$ yarn ssr
```

Start the ot server
默认支持协同编辑，需要开启协同编辑服务

```bash
$ cd ot-server
$ yarn start
```

Build documentation,

```bash
$ npm run docs:build
```

Build library via `father-build`,

```bash
$ npm run build
```
