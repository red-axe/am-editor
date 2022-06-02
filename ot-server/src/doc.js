const { getCollectionName } = require('./config');

const name = getCollectionName();
class Doc {
	constructor(id, destroy = function () {}) {
		this.id = id.toString();
		this.members = [];
		this.sockets = {};
		this.selection = [];
		this.destroy = destroy;
		this.indexCount = 0;
		this.doc = undefined;
	}

	create(connection, collectionName = name, callback = function () {}) {
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

	getData() {
		return new Promise((resolve) => {
			if (!this.doc) return [];
			this.doc.fetch((err) => {
				if (err) return resolve([]);
				resolve(this.doc.data);
			});
		});
	}

	find(callback, data = this.doc ? this.doc.data : []) {
		if (!data || !Array.isArray(data) || data.length < 1) {
			return null;
		}
		for (let i = 1; i < data.length; i++) {
			if (i === 1) {
				const attributes = data[i];
				if (
					typeof attributes === 'object' &&
					callback &&
					callback(attributes)
				) {
					return {
						path: [],
						name: data[0],
						attributes,
						children: data.slice(i + 1),
					};
				}
			} else if (Array.isArray(data[i])) {
				const result = this.find(callback, data[i]);
				if (result) {
					result.path.unshift(i);
					return result;
				}
			}
		}
		return null;
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
					const sIndex = this.selection.findIndex(
						(selection) => selection.uuid === leaveMember.uuid,
					);
					if (sIndex > -1) {
						this.selection.splice(sIndex, 1);
					}
					// 可能存在一个用户多个 socket 的情况，这里需要判断一下
					if (!this.members.find((m) => m.id === leaveMember.id)) {
						this.broadcast('leave', leaveMember);
					}
					this.broadcast('broadcast', {
						type: 'select',
						body: this.selection,
						doc_id: this.id,
						uuid: leaveMember.uuid,
					});
					delete this.sockets[member.uuid];
				}
				if (Object.keys(this.sockets).length === 0) this.destroy();
			});
		} catch (error) {
			console.error(error);
		}
		// 广播通知用户加入了，如果已经有用户存在了（一个用户多个socket的情况），则不需要广播
		if (
			!this.members.find(
				(m) => m.id === member.id && m.uuid !== member.uuid,
			)
		) {
			this.broadcast('join', member, (m) => m.uuid !== member.uuid);
		}
		// 通知用户当前文档的所有用户
		this.sendMessage(member.uuid, 'members', this.members);
		// 通知用户准备好了
		this.sendMessage(member.uuid, 'ready', {
			member,
			selection: this.selection,
		});
	}
}

module.exports = Doc;
