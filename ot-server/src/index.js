const http = require('http');
const url = require('url');
const express = require('express');
const WebSocket = require('ws');
const bodyParser = require('body-parser');
const queryString = require('querystring');
const Client = require('./client');

startServer();

const getParams = (request) => {
	return queryString.parse(url.parse(request.url).query);
};

function startServer() {
	// Create a web server to serve files and listen to WebSocket connections
	const app = express();

	app.use(bodyParser.json({ limit: '10mb' }));
	app.use(
		bodyParser.urlencoded({
			extended: false,
		}),
	);

	const server = http.createServer(app);
	try {
		var wss = new WebSocket.Server({ server });
		const client = new Client();
		let id = 1;
		const getId = (docId, userId) => {
			let uuid = Client.getUUID(docId, userId);
			while (client.hasUUID(docId, uuid)) {
				id++;
				userId = id;
				console.log('userId', userId);
				uuid = Client.getUUID(docId, userId);
			}
			return userId;
		};
		wss.on('connection', function (ws, request) {
			//用户连接到 socket，此处应根据request获取到相关参数，并且处理用户token，传递到api，效验数据合法性
			//此处为模拟演示数据
			const params = getParams(request);
			let { uid } = params;
			if (!uid) uid = id;
			client.listen(ws);
			ws.addEventListener('message', (event) => {
				try {
					if (!event.data) return;
					const { data, action } = JSON.parse(event.data);
					if (action === 'ready') {
						client.add(ws, data.doc_id, {
							id: getId(data.doc_id, uid),
							name: `G-${uid}`,
						});
					}
				} catch (error) {}
			});
			if (!params.uid) id++;
		});
	} catch (error) {
		console.log(error);
	}
	server.listen(8080);
	console.log('OT Server Listening on http://localhost:8080');
}
