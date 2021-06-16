const ShareDB = require('sharedb');
const { v3 } = require('uuid');
const Doc = require('./doc');

class Client {
	constructor(backend = new ShareDB()) {
		this.docs = [];
		this.backend = backend;
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
		let doc = this.docs.find((doc) => doc.id === docId);
		if (!doc) {
			doc = new Doc(docId, this.backend, () => {
				//注销
				const index = this.docs.findIndex((doc) => doc.id === docId);
				if (index > -1) {
					doc.doc.destroy();
					this.docs.splice(index, 1);
				}
			});
			this.docs.push(doc);
			//创建
			doc.create();
		} else {
			// 如果用户之前有连接到，那么就会移除之前的连接
			doc.removeMember(member.uuid);
		}
		// 增加用户到文档中
		doc.addMember(ws, member);
	}
}

module.exports = Client;
