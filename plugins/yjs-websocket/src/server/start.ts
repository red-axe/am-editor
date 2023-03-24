import WebSocket from 'ws';
import http from 'http';
import { getYDoc, setupWSConnection, UpdateCallback } from './utils';
import { initPersistence, PersistenceOptions } from './persistence';
import { WSSharedDoc } from './types';

const wss = new WebSocket.Server({ noServer: true });

export interface ServerOptions {
	// http server host
	host: string;
	// http server port
	port: number;
	// 效验
	auth: (
		request: http.IncomingMessage,
		ws: WebSocket,
	) => Promise<{ code: number; data: string } | string>;
	// http server request listener
	requestListener?: http.RequestListener;
	// 持久化选项，false 为不持久化
	persistenceOptions?: PersistenceOptions | false;
	// 文档内容字段，默认为 content
	contentField?: string;
	// 更新回调
	callback?: UpdateCallback;
}

const SERVER_OPTIONS_WEAKMAP = new WeakMap<http.Server, ServerOptions>();

declare module 'http' {
	interface Server {
		getYDoc: (name: string) => WSSharedDoc;
	}
}

export const startServer = (options: ServerOptions) => {
	const {
		auth,
		requestListener,
		host,
		port,
		persistenceOptions = { provider: 'leveldb' },
		contentField,
	} = options;
	const server = http.createServer((request, response) => {
		if (requestListener) {
			requestListener(request, response);
		} else {
			response.writeHead(200, { 'Content-Type': 'text/plain' });
			response.end('okay');
		}
	});

	SERVER_OPTIONS_WEAKMAP.set(server, options);
	const DOC_NAME_WEAKMAP = new WeakMap<WebSocket.WebSocket, string>();
	wss.on('connection', (conn, req) => {
		const { callback } = SERVER_OPTIONS_WEAKMAP.get(server) ?? {};
		const name = DOC_NAME_WEAKMAP.get(conn);
		if (!name) throw new Error('doc name not found');
		setupWSConnection(conn, req, {
			callback,
			docname: name,
		});
	});

	server.on('upgrade', (request, socket, head) => {
		// You may check auth of request here..
		// See https://github.com/websockets/ws#client-authentication
		const handleAuth = (ws: WebSocket) => {
			auth(request, ws).then((res) => {
				const resObject =
					typeof res === 'object' ? res : { code: 200, data: res };
				if (resObject.code !== 200) {
					ws.close(resObject.code, resObject.data);
				} else {
					DOC_NAME_WEAKMAP.set(ws, resObject.data);
					wss.emit('connection', ws, request);
				}
			});
		};
		wss.handleUpgrade(request, socket, head, handleAuth);
	});

	if (persistenceOptions !== false) {
		initPersistence(persistenceOptions, contentField);
	}

	server.listen(port, host, () => {
		console.log(`running at '${host}' on port ${port}`);
	});

	server.getYDoc = (name) => {
		const { callback } = SERVER_OPTIONS_WEAKMAP.get(server) ?? {};
		return getYDoc(name, undefined, undefined, callback);
	};

	return server;
};
