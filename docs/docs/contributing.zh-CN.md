# 贡献

## 贡献插件

参考插件教程文档

## 贡献 Engine 代码

在 GitHub 上 clone am-editor 仓库

### 安装依赖

```bash
$ yarn

//or

$ npm install
```

### 启动项目

```bash
//普通启动
$ yarn start

//or
//服务端渲染模式启动，将调用 site-ssr 。要完全使用ssr模式，启动后需要主动访问 7001 端口
$ yarn ssr
```

### 启动协同服务

```bash
$ cd ot-server
$ yarn start
```

### 编译

因为我们有多个 package，使用的是 lerna 管理模式

在编译配置上，我们使用了 [father-build](https://github.com/umijs/father)

一个命令就可以编译所有的包

```bash
$ yarn build
```

需要注意的是，[father-build](https://github.com/umijs/father) 对 vue 很不友好，我们需要改动 node_modules/father/lib/getRollupConfig.ts 文件中的 getPlugins 方法。 [我的分支上已修改，可以参考一下](https://github.com/itellyou-com/father/blob/master/packages/father-build/src/getRollupConfig.ts)

在 vue 项目中还需要添加.fatherrc.ts 配置文件

```ts
import vue from 'rollup-plugin-vue';
import commonjs from '@rollup/plugin-commonjs';

export default {
	extraExternals: ['vue'],
	extraRollupPlugins: [
		{ before: 'postcss', plugins: [vue({ preprocessStyles: true })] },
		commonjs(),
	],
};
```

这样在使用 father-build 编译 vue 项目时不会出错

站点打包

```bash
$ yarn docs:build
```

## 贡献文档

am-editor 使用 [dumi](https://d.umijs.org/) 作为文档站点工具，

1. 每篇文档左下方有 “在 GitHub 上编辑这篇文档”，你可以通过这里进行文档修改
2. 打开 Github 上的 docs 目录，用文件编辑器新建、修改、预览文件，然后提 PR
3. 你还可以 clone am-editor 仓库，修改 docs 目录下的文件，本地文档调试完成后统一提 PR

## 经济支持

### 支付宝

![alipay](https://cdn-object.yanmao.cc/contribution/alipay.png?x-oss-process=image/resize,w_200)

### 微信支付

![wechat](https://cdn-object.yanmao.cc/contribution/weichat.png?x-oss-process=image/resize,w_200)

### PayPal

https://paypal.me/aomaocom
