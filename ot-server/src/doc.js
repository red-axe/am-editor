const WebSocketJSONStream = require('@teamwork/websocket-json-stream');

class Doc {
	constructor(id, backend, destroy = function() {}) {
		this.id = id.toString();
		this.members = [];
		this.sockets = {};
		this.destroy = destroy;
		this.backend = backend;
		this.indexCount = 0;
	}

	create(
		connection = this.backend.connect(),
		collectionName = 'aomao',
		callback = function() {},
	) {
		const doc = connection.get(collectionName, this.id);
		doc.fetch(function(err) {
			if (err) {
				console.error(err);
				return;
			}
			if (doc.type === null) {
				doc.create([], callback);
				return;
			}
			callback();
		});
		return doc;
	}

	getMembers() {
		return this.members;
	}

	broadcast(action, message, callback) {
		this.members.forEach(member => {
			if (!callback || callback(member) !== false)
				this.sendMessage(member.uuid, action, message);
		});
	}

	sendMessage(uuid, action, message, callback = function() {}) {
		const member = this.members.find(member => member.uuid === uuid);
		const socket = this.sockets[uuid];
		if (member && socket) {
			try {
				socket.send(
					JSON.stringify({
						action,
						data: message,
					}),
					callback,
				);
			} catch (error) {
				console.error(err);
			}
		}
	}

	removeMember(uuid) {
		const member = this.members.find(member => member.uuid === uuid);
		if (member && this.sockets[uuid]) this.sockets[uuid].close();
	}

	addMember(ws, member) {
		this.indexCount++;
		// 设置用户序号
		member.iid = this.indexCount;
		this.members.push(member);
		this.sockets[member.uuid] = ws;
		//连接关闭
		ws.on('close', () => {
			const index = this.members.findIndex(m => m.uuid === member.uuid);
			if (index > -1) {
				const leaveMember = this.members[index];
				this.members.splice(index, 1);
				delete this.sockets[member.uuid];
				this.broadcast('leave', leaveMember);
			}
			if (Object.keys(this.sockets).length === 0) this.destroy();
		});
		// 广播通知用户加入了
		this.broadcast('join', member, m => m.uuid !== member.uuid);
		// 通知用户当前文档的所有用户
		this.sendMessage(member.uuid, 'members', this.members);
		try {
			// 建立协作 socket 连接
			const stream = new WebSocketJSONStream(ws);
			// 监听消息
			this.backend.listen(stream);
			// 中间件处理 action 消息
			this.backend.use(
				Object.keys(this.backend.MIDDLEWARE_ACTIONS),
				(context, next) => {
					const { action, data } = context.data || {};
					// 自定义消息
					if (!!action) {
						//广播消息
						if (action === 'broadcast') {
							this.broadcast('broadcast', data.data);
						}
						//心跳检测
						else if (action === 'heartbeat') {
							this.sendMessage(
								member.uuid,
								'heartbeat',
								new Date().getTime(),
							);
						}
						return;
					}
					// sharedb消息
					next();
				},
			);
		} catch (error) {
			console.error(error);
		}
		// 通知用户准备好了
		this.sendMessage(member.uuid, 'ready', member);
	}
}

module.exports = Doc;
