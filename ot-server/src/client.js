const WebSocketJSONStream = require('@teamwork/websocket-json-stream');
const ShareDB = require('sharedb');
const { v3 } = require('uuid');
const Doc = require('./doc');

class Client {
	constructor(backend = new ShareDB()) {
		this.docs = [];
		this.timeouts = {};
		this.backend = backend;
		this.handleMessage();
	}

	handleMessage() {
		try {
			// 中间件处理 action 消息
			this.backend.use('receive', (context, next) => {
				const { action, data } = context.data || {};
				// 自定义消息
				if (!!action) {
					const { doc_id, uuid } = data;
					const doc = this.getDoc(doc_id);
					if (!doc) return;
					//广播消息
					if (action === 'broadcast') {
						doc.broadcast('broadcast', data);
					}
					//心跳检测
					else if (action === 'heartbeat') {
						const key = `${doc_id}-${uuid}`;
						const timeout = this.timeouts[key];
						if (timeout) clearTimeout(timeout);
						this.timeouts[key] = setTimeout(() => {
							doc.removeMember(uuid);
						}, 60000);
						doc.sendMessage(
							uuid,
							'heartbeat',
							new Date().getTime(),
						);
					}
					return;
				}
				// sharedb消息
				try {
					next();
				} catch (error) {
					console.error(error);
				}
			});
		} catch (error) {
			console.error(error);
		}
	}

	getDoc(docId) {
		return this.docs.find((doc) => doc.id === docId);
	}

	getUUID(docId, id) {
		return v3(docId.toString().concat('/' + id), v3.URL);
	}

	hasUUID(docId, uuid) {
		const doc = this.getDoc(docId);
		if (!doc) return false;
		return doc.hasMember(uuid);
	}

	add(ws, docId, member) {
		if (!member.uuid) {
			member.uuid = this.getUUID(docId, member.id);
		}
		let doc = this.getDoc(docId);
		if (!doc) {
			doc = new Doc(docId, () => {
				//注销
				const index = this.docs.findIndex((doc) => doc.id === docId);
				if (index > -1) {
					doc.doc.destroy();
					this.docs.splice(index, 1);
				}
			});
			this.docs.push(doc);
			//创建
			const reuslt = doc.create(this.backend.connect());
			if (!reuslt) return;
		} else {
			// 如果用户之前有连接到，那么就会移除之前的连接
			doc.removeMember(member.uuid);
		}
		try {
			// 建立协作 socket 连接
			const stream = new WebSocketJSONStream(ws);
			// 监听消息
			this.backend.listen(stream);
			// 增加用户到文档中
			doc.addMember(ws, member);
		} catch (error) {
			console.log(error);
		}
	}
}

module.exports = Client;
