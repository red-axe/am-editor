---
toc: menu
---

# 协同编辑配置

编辑器基于 [sharedb](https://github.com/share/sharedb) 与 [json0](https://github.com/ottypes/json0) 协议交互协作操作数据

客户端（编辑器）通过 `WebSocket` 与服务端建立长连接通信，编辑器每次的 dom 结构变更都将转换为`json0`格式操作命令（ops）发送到服务端并修改服务端数据后再分发给各个客户端

## 客户端

在演示案例中已经有根据常用需求提供了一份编辑器通过 `WebSocket` 与 `sharedb` 使用 `json0` 协议交互的客户端代码

[React & Vue 通用](https://github.com/yanmao-cc/am-editor/blob/master/examples/react/components/editor/ot/client.ts)

```ts
//实例化协作编辑客户端，需要传入当前编辑器实例
const ot = new OTClient(engine);
// 这里不再需要使用 engine.setValue。只需要在连接的时候把 value 传给 OTClient。在连接到服务端后，如果服务端没有该文档将以默认值创建，否则就返回服务端的最新文档数据
// 连接协同服务端，如果服务端没有对应docId的文档，将使用 defaultValue 初始化
// url 服务端ws链接
// docId 文档的唯一识别id
// defaultValue 在服务端如果docId对应的文档不存在，将会以这个值创建一个新文档
ot.connect(url, docId, defaultValue);
ot.on('ready', (member) => {
	console.log('OT Ready');
});
```

这份代码已经能满足基本的编辑需求，如果需要更多功能可自行扩展

默认的演示代码是关闭协同的，需要在这里启用：

https://github.com/red-axe/am-editor/blob/master/examples/react/editor.tsx#L102 这个位置需要修改 IS_DEV 为 false

## 服务端

`ot-server` 是使用 `nodejs` 创建的一个网络服务，使用 `WebSocket.Server` 处理客户端的 `WebSocket` 连接

[ot-server](https://github.com/yanmao-cc/am-editor/tree/master/ot-server)

演示案例中仅提供了模拟的用户数据，在生产环境中我们需要客户端传输`token`参数进行身份效验

使用命令

```bash
# 开发环境
yarn dev
# or
# 正式环境
yarn start
```

## 协同数据

`sharedb` 会把每次客户端与服务端的操作数据保存为日志，并且在每次操作后都会把最新生成的文档数据保留下来。这些操作都在 `ot-server` 中进行

`sharedb` 提供了两种方式保存这些数据

-   内存
-   数据库

在默认不提供数据库的情况下，`sharedb` 默认把这些数据都保存在内存中，但是这些数据并不能持久化，重启后将会消失，在生产环境中并不建议使用。

如果需要使用内存存储测试，[ot-server -> client](https://github.com/yanmao-cc/am-editor/blob/master/ot-server/src/client.js) 文件中的这段代码 `constructor(backend = new ShareDB({ db: mongodb }))` 的 `{db: mongodb}` 删除即可，相应的也需要把 `mongodb` 上面的引用及实例化删除

演示案例中使用了 `mongodb` 数据库保存了所有的数据持久化，所以我们需要安装 `mongodb` 数据库

-   可以在 [MongoDB 官网下载](https://www.mongodb.com/try/download/community) 安装符合自己环境的数据库版本
-   安装完成后，创建一个数据库，并设置用户名、密码等权限
-   最后把数据库名称、用户名、密码等信息配置到[config](https://github.com/yanmao-cc/am-editor/tree/master/ot-server/config) 就可以正常启动 `ot-server` 了

[Linux 安装教程](https://www.jianshu.com/p/62455ccaeefe)

[Windows 安装教程](https://segmentfault.com/a/1190000039742854) Windows 可以直接下载 msi 版本的，安装比较容易，下一步下一步。。。
