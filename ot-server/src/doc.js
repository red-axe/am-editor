class Doc {
	constructor(id, destroy = function () {}) {
		this.id = id.toString();
		this.members = [];
		this.sockets = {};
		this.destroy = destroy;
		this.indexCount = 0;
		this.doc = undefined;
	}

	create(connection, collectionName = 'yanmao', callback = function () {}) {
		try {
			const doc = connection.get(collectionName, this.id);
			doc.fetch((err) => {
				if (err) {
					console.error(err);
					return;
				}
				if (!doc.type) {
					doc.create([], callback);
					return;
				}
				callback(true);
			});
			this.doc = doc;
			return doc;
		} catch (error) {
			console.error(error);
			return null;
		}
	}

	getMembers() {
		return this.members;
	}

	broadcast(action, message, callback) {
		this.members.forEach((member) => {
			if (!callback || callback(member) !== false)
				this.sendMessage(member.uuid, action, message);
		});
	}

	sendMessage(uuid, action, message, callback = function () {}) {
		const member = this.members.find((member) => member.uuid === uuid);
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

	hasMember(uuid) {
		const member = this.members.find((member) => member.uuid === uuid);
		return !!member && !!this.sockets[uuid];
	}

	removeMember(uuid) {
		try {
			if (this.hasMember(uuid)) {
				this.sockets[uuid].close();
				delete this.sockets[uuid];
			}
		} catch (error) {
			console.log(error);
		}
	}

	addMember(ws, member) {
		this.indexCount++;
		// 设置用户序号
		member.index = this.indexCount;
		this.members.push(member);
		this.sockets[member.uuid] = ws;
		//连接关闭
		try {
			ws.on('close', () => {
				const index = this.members.findIndex(
					(m) => m.uuid === member.uuid,
				);
				if (index > -1) {
					const leaveMember = this.members[index];
					this.members.splice(index, 1);
					this.broadcast('leave', leaveMember);
					delete this.sockets[member.uuid];
				}
				if (Object.keys(this.sockets).length === 0) this.destroy();
			});
		} catch (error) {
			console.error(error);
		}
		// 广播通知用户加入了
		this.broadcast('join', member, (m) => m.uuid !== member.uuid);
		// 通知用户当前文档的所有用户
		this.sendMessage(member.uuid, 'members', this.members);
		// 通知用户准备好了
		this.sendMessage(member.uuid, 'ready', member);
	}
}

module.exports = Doc;
