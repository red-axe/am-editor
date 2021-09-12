---
toc: menu
---

# Collaborative editing configuration

The editor is based on the [sharedb](https://github.com/share/sharedb) and [json0](https://github.com/ottypes/json0) protocols to interactively manipulate data

The client (editor) establishes a long connection communication with the server through `WebSocket`, and every time the editor changes the dom structure, it will be converted to `json0` format operation command (ops) and sent to the server and modify the server data. Distribute to each client

## Client

In the demo case, an editor has provided a client code that uses the `json0` protocol to interact with `sharedb` through `WebSocket` and `sharedb` according to common needs.

[React](https://github.com/yanmao-cc/am-editor/blob/master/examples/react/components/editor/ot/client.ts)

[Vue](https://github.com/yanmao-cc/am-editor/blob/master/examples/vue/src/components/ot-client.ts)

```ts
//Instantiate the collaborative editing client, you need to pass in the current editor instance
const ot = new OTClient(engine);
// Engine.setValue is no longer needed here. Only need to pass the value to OTClient when connecting. After connecting to the server, if the server does not have the document, it will be created with the default value, otherwise the latest document data of the server will be returned
// Connect to the collaborative server, if the server does not have a document corresponding to the docId, it will be initialized with defaultValue
// url server ws link
// docId The unique identification id of the document
// defaultValue on the server side, if the document corresponding to docId does not exist, a new document will be created with this value
ot.connect(url, docId, defaultValue);
ot.on('ready', (member) => {
	console.log('OT Ready');
});
```

This code has been able to meet the basic editing needs, if you need more functions, you can expand by yourself

## Server

`ot-server` is a network service created with `nodejs`, and `WebSocket.Server` is used to handle the client's `WebSocket` connection

[ot-server](https://github.com/yanmao-cc/am-editor/tree/master/ot-server)

In the demonstration case, only simulated user data is provided. In the production environment, we need the client to transmit the `token` parameter for identity verification

Use the command

```bash
# Development environment
yarn dev
# or
# Formal environment
yarn start
```

## Collaborative data

`sharedb` will save the operation data of each client and server as a log, and will keep the newly generated document data after each operation. These operations are performed in `ot-server`

`sharedb` provides two ways to save these data

-   RAM
-   Database

In the case that no database is provided by default, `sharedb` saves these data in memory by default, but these data cannot be persisted and will disappear after restart. It is not recommended to use in a production environment.

If you need to use the memory storage test, [ot-server -> client](https://github.com/yanmao-cc/am-editor/blob/master/ot-server/src/client.js) this in the file Delete the `{db: mongodb}` of the code `constructor(backend = new ShareDB({ db: mongodb }))`, and the corresponding reference and instantiation of `mongodb` need to be deleted

In the demonstration case, the `mongodb` database is used to save all data persistence, so we need to install the `mongodb` database

-   You can install the database version that suits your environment from [MongoDB official website download](https://www.mongodb.com/try/download/community)
-   After the installation is complete, create a database and set the user name, password and other permissions
-   Finally, configure the database name, user name, password and other information to [config](https://github.com/yanmao-cc/am-editor/tree/master/ot-server/config) to start normally `ot -server`

[Linux Installation Tutorial](https://www.jianshu.com/p/62455ccaeefe)

[Windows installation tutorial](https://segmentfault.com/a/1190000039742854) Windows can download the msi version directly, the installation is relatively easy, the next step is the next step. . .
