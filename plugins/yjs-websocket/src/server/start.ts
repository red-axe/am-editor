import WebSocket from 'ws';
import http from 'http';
import { setupWSConnection, UpdateCallback } from './utils';
import { initPersistence, PersistenceOptions } from './persistence';
import { WSSharedDoc } from './types';

const wss = new WebSocket.Server({ noServer: true });

export interface ServerOptions {
	// http server host
	host: string;
	// http server port
	port: number;
	// http server request listener
	requestListener?: http.RequestListener;
	// 效验
	auth?: (
		request: http.IncomingMessage,
		ws: WebSocket,
	) => Promise<void | { code: number; data: string | Buffer }>;
	// 连接回调
	onConnection?: (doc: WSSharedDoc, conn: WebSocket.WebSocket) => void;
	// 持久化选项，false 为不持久化
	persistenceOptions?: PersistenceOptions | false;
	// 文档内容字段，默认为 content
	contentField?: string;
	// 更新回调
	callback?: UpdateCallback;
}

const SERVER_OPTIONS_WEAKMAP = new WeakMap<http.Server, ServerOptions>();

export const startServer = (options: ServerOptions) => {
	const {
		auth = () => Promise.resolve(),
		requestListener,
		onConnection,
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

	wss.on('connection', (conn, req) => {
		const { callback } = SERVER_OPTIONS_WEAKMAP.get(server) ?? {};
		setupWSConnection(conn, req, {
			callback,
			onConnection,
		});
	});

	server.on('upgrade', (request, socket, head) => {
		// You may check auth of request here..
		// See https://github.com/websockets/ws#client-authentication
		const handleAuth = (ws: WebSocket) => {
			auth(request, ws).then((res) => {
				if (res && res.code !== 200) {
					ws.close(res.code, res.data);
				} else {
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
	return server;
};
