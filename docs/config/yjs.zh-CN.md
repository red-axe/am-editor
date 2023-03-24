---
toc: menu
---

# 协同编辑配置

该开源库通过监听编辑区域(contenteditable 根节点)内的 html 结构的变化，使用 `MutationObserver` 反推数据结构，并通过 `WebSocket` 与 [Yjs](https://github.com/yjs/yjs) 连接交互，实现多用户协同编辑的功能。

## 安装

```bash
yarn add yjs @aomao/plugin-yjs @aomao/plugin-yjs-websocket
```

## 使用

### 客户端

```ts
import { withYjs, YjsEditor, YCursorEditor, CursorStateChangeEvent, CursorData } from '@aomao/plugin-yjs';
import { WebsocketProvider } from '@aomao/plugin-yjs-websocket';

// 初始化 yjs doc
const doc = new Y.Doc()

// 初始化 WebsocketProvider
const provider = new WebsocketProvider('服务端url', '文档id', doc, { connect: false })

const handleStatus = (event: Record<'status', 'connecting' | 'connected' | 'disconnected'>) => {
	if (!YjsEditor.isYjsEditor(engine)) return;
	// 相关连接状态处理
	const { status } = event;
	if(status === 'connected') {
		// 连接成功
		YjsEditor.connect(engine)
	} else if(status === 'disconnected') {
		// 连接断开
		YjsEditor.disconnect(engine)
	} else if(status === 'connecting') {
		// 连接中
	}
};
if (provider) provider.on('status', handleStatus);

// 获取yjs文档的分享类型，这里的 `content` 表示文档的根节点，需要和服务端保持一致，如果你要修改，请保持客户端与服务端这两处一致
const sharedType = doc.get('content', Y.XmlElement) as Y.XmlElement;
// 使用 yjs 插件
// provider.awareness 是 yjs 的 awareness 插件，用于实现光标同步
withYjs(engine, sharedType, provider.awareness, {
	data: {
		name: '当前协作用户的名称',
		color: '当前协作用户的颜色',
		avatar?: '可选，当前协作用户的头像',
		... // 其他自定义数据
	},
});
```

监听协作者的光标状态变化

```ts
// added 为新增的协作者，removed 为移除的协作者，updated 为更新的协作者
const handleCursorChange = ({ added, removed, updated }: CursorStateChangeEvent) => {
	if (added.length > 0) {
		for (const id of added) {
			// 获取协作者的信息
			const addedUser = YCursorEditor.cursorState(e, id);
			... // 可以自定义处理新增的协作者
		}
	}
	if (removed.length > 0) {
		for (const id of removed) {
			... // 可以自定义处理移除的协作者
		}
	}
	// 这里更新了协作者的光标信息会触发这个事件，而且比较频繁，如果只是为了显示当前所有的协作者用户信息，使用 added 和 removed 就足够了
	if (updated.length > 0) {
		for (const id of updated) {
			... // 可以自定义处理更新的协作者
		}
	}
};
// 订阅光标状态变化
YCursorEditor.on(e, 'change', handleCursorChange);
```

### 服务端

`@aomao/plugin-yjs-websocket` 也提供了 `nodejs` 服务端的实现，可以直接使用

```ts
yarn add yjs @aomao/plugin-yjs-websocket
```

简单配置即可使用

```ts
import startServer from '@aomao/plugin-yjs-websocket/server';
// 启动服务，默认端口为 1234，使用 leveldb 作为数据库
startServer();
```

相关配置

```ts
startServer({
	// 监听的 host，默认为 0.0.0.0
	host?: string;
	// 监听的端口，默认为 1234
	port?: number;
	// 自定义效验，返回 code !== 200 时，会终止连接
	// 需要返回文档的 id，默认取 ws 链接中的 ws:domain.com/docname 其中 docname为文档 id
	auth?: (
		request: http.IncomingMessage,
		ws: WebSocket,
	) => Promise<{ code: number; data: string } | string>;
	// http server request listener
	requestListener?: http.RequestListener;
	// 持久化选项，false 为不持久化
	/**
	 * 默认为 leveldb
	 * {
	 *   provider: 'leveldb';
	 *   dir?: string; // leveldb 的目录，默认为 ./db
	 * }
	 * mongodb 配置
	 * {
	 *   provider: 'mongodb';
	 *   url
	 * }
	 */
	persistenceOptions?: PersistenceOptions | false;
	// 文档内容字段，默认为 content
	contentField?: string;
	// 更新回调
	callback?: UpdateCallback;
})
```

#### 使用配置

##### `auth` 用于自定义效验

返回 code !== 200 时，会终止连接

需要返回文档的 id，默认取 ws 链接中的 ws:domain.com/docname 其中 docname 为文档 id

```ts
const auth = async (request: http.IncomingMessage, ws: WebSocket) => {
	const { url } = request;
	const docname = url.split('/').pop();
	if (!docname) return { code: 400, data: '文档id不能为空' };
	return docname;
};

startServer({ auth });
```

##### `requestListener` 用于自定义 http server 的 request listener，可以用于自定义路由

```ts
const app = express();
app.get('/doc/:name', (req, res) => {
	res.send('hello world');
});

startServer(app);
```

##### `persistenceOptions` 用于自定义持久化方式，目前支持 `leveldb` 和 `mongodb`

```ts
startServer({
	persistenceOptions: {
		provider: 'leveldb',
		dir: './db',
	},
});
```

```ts
startServer({
	persistenceOptions: {
		provider: 'mongodb',
		url: 'mongodb://localhost:27017',
	},
});
```

##### `contentField` 用于自定义文档内容字段，默认为 `content`

```ts
startServer({
	contentField: 'content',
});
```

##### `callback` 用于自定义更新回调

```ts
startServer({
	callback: {
		// 或则 action: string, 使用一个url来接收post请求
		action: (data: Record<string, any>) => {
			// data 为更新的数据
		},
		// 超时时间，默认为 5000
		timeout: 5000;
		// ContentType 为 "Array" | "Map" | "Text" | "XmlFragment"
		// 需要发送的对应数据类型
		objects?: Record<string, ContentType>;
	},
});
```

##### `startServer` 会反应一个 `http.Server` 实例，可以通过 `server.getYDoc(name)` 获取对应的 `Y.Doc` 实例

```ts
const server = startServer();
const doc = server.getYDoc('docname');
```
