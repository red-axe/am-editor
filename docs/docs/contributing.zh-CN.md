# 贡献

## 贡献插件

参考插件教程文档

## 贡献 Engine 代码

在 GitHub 上 clone am-editor 仓库

### 安装依赖

```bash
$ yarn
$ lerna bootstrap
```

### 启动项目

```bash
$ yarn start
```

### 启动协同服务

```bash
$ cd yjs-server
$ yarn dev
```

### 编译

因为我们有多个 package，使用的是 lerna 管理模式

在编译配置上，我们使用了 [father-build](https://github.com/umijs/father)

一个命令就可以编译所有的包

```bash
$ yarn build
```

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

![alipay](https://cdn-object.aomao.com/contribution/alipay.png?x-oss-process=image/resize,w_200)

### 微信支付

![wechat](https://cdn-object.aomao.com/contribution/weichat.png?x-oss-process=image/resize,w_200)

### PayPal

https://paypal.me/aomaocom
