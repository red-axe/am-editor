# am-editor

编辑器引擎纯 JavaScript 编写。插件可配合 React 或 Vue 等主流前端库渲染

## Getting Started

Install dependencies,
使用 lerna 管理包和依赖

```bash
$ yarn
```

Start the dev server

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
