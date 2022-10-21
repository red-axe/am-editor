const { NODE_ENV } = process.env;
const WebSocketJSONStream = require('@teamwork/websocket-json-stream');
const MongoClient = require('mongodb').MongoClient;

const { getConfigDB, getCollectionName } = require('./config');

const name = getCollectionName();
const { user, pwd, db, url } = getConfigDB();
const mongodb = require('sharedb-mongo')({
	mongo: function (callback) {
		let connectUrl = user
			? `mongodb://${user}:${pwd}@${url}`
			: `mongodb://${url}`;
		if (db) connectUrl += `/${db}`;
		MongoClient.connect(connectUrl, callback);
	},
});
const ShareDB = require('sharedb');
const { v3 } = require('uuid');
const Doc = require('./doc');

class Client {
	constructor(backend = new ShareDB({ db: mongodb })) {
		this.docs = [];
		this.timeouts = {};
		this.backend = backend;
		this.handleMessage();
	}

	handleMessage() {
		try {
			// 中间件处理 action 消息
			this.backend.use('receive', (context, next) => {
				const { action, data, op } = context.data || {};
				// 自定义消息
				if (!!action) {
					const { doc_id, uuid } = data;
					const doc = this.getDoc(doc_id);
					if (!doc) return;
					//广播消息
					if (action === 'broadcast') {
						if (data.type === 'select') {
							if ('remove' in data.body) {
								const index = doc.selection.findIndex(
									(selection) =>
										selection.uuid === data.body.uuid,
								);
								if (index > -1) {
									doc.selection.splice(index, 1, data.body);
								} else {
									doc.selection.push(data.body);
								}
							}
						}
						doc.broadcast(
							'broadcast',
							data,
							(m) => m.uuid !== uuid,
						);
					}
					//心跳检测
					else if (action === 'heartbeat') {
						const key = `${doc_id}-${uuid}`;
						const timeout = this.timeouts[key];
						if (timeout) clearTimeout(timeout);
						this.timeouts[key] = setTimeout(() => {
							doc.removeMember(uuid);
						}, 300000);
						doc.sendMessage(
							uuid,
							'heartbeat',
							new Date().getTime(),
						);
					}
					return;
				} else if (op && Array.isArray(op)) {
					const docKeys = Object.keys(
						context.agent.subscribedDocs[name] || {},
					);
					if (docKeys.length > 0) {
						const deleteKeys = [];
						const doc = this.getDoc(docKeys[0]);
						if (doc) {
							doc.getData().then((data) => {
								context.data.op = op.filter((o) => {
									if (
										'ld' in o &&
										Array.isArray(o.ld) &&
										o.ld.length > 1 &&
										!!o.ld[1]['data-id']
									) {
										const findChild = (childData) => {
											if (
												!Array.isArray(childData) ||
												childData.length < 1
											) {
												return;
											}
											for (
												let i = 1;
												i < childData.length;
												i++
											) {
												if (i === 1) {
													const attributes =
														childData[i];
													if (
														typeof attributes ===
															'object' &&
														attributes['data-id']
													) {
														deleteKeys.push(
															attributes[
																'data-id'
															],
														);
													}
												} else if (
													Array.isArray(childData[i])
												) {
													findChild(childData[i]);
												}
											}
										};
										findChild(o.ld);
									} else if (
										'li' in o &&
										Array.isArray(o.li) &&
										o.li.length > 1 &&
										!!o.li[1]['data-id']
									) {
										const id = o.li[1]['data-id'];
										// 这个节点已经存在了，就不能再次插入了
										if (!deleteKeys.includes(id)) {
											const node = doc.find(
												(attributes) =>
													attributes['data-id'] ===
													id,
												data,
											);
											if (
												node &&
												node.path.length ===
													o.p.length &&
												node.path.every(
													(p, i) => p === o.p[i],
												)
											)
												return false;
										}
									}
									return true;
								});
								// sharedb消息
								try {
									next();
								} catch (error) {
									console.error(error);
								}
							});
							return;
						}
					}
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

	static getUUID(docId, id) {
		return v3(docId.toString().concat('/' + id), v3.URL);
	}

	hasUUID(docId, uuid) {
		const doc = this.getDoc(docId);
		if (!doc) return false;
		return doc.hasMember(uuid);
	}

	listen(ws) {
		try {
			// 建立协作 socket 连接
			const stream = new WebSocketJSONStream(ws);
			stream.on('error', (error) => {
				console.log(error);
			});
			// 监听消息
			this.backend.listen(stream);
		} catch (error) {
			console.log(error);
		}
	}

	add(ws, docId, member) {
		const doc =
			this.getDoc(docId) ||
			new Doc(docId, () => {
				//注销
				const index = this.docs.findIndex((doc) => doc.id === docId);
				if (index > -1) {
					doc.doc.destroy();
					this.docs.splice(index, 1);
				}
			});
		if (!member.uuid) {
			// eslint-disable-next-line no-param-reassign
			member.uuid = Client.getUUID(
				docId,
				`${member.id}-${doc.indexCount}`,
			);
			// console.warn('ADD CLIENT', 'create uuid for member:', docId, member.uuid);
		}
		// 如果用户之前有连接到，那么就会移除之前的连接
		doc.removeMember(member.uuid);
		//创建获取文档实例
		const reuslt = doc.create(this.backend.connect(), name, () => {
			doc.addMember(ws, member);
			if (!this.getDoc(docId)) this.docs.push(doc);
		});

		if (!reuslt) {
			try {
				ws.close();
			} catch (error) {
				console.log(error);
			}
			return;
		}
	}
}

module.exports = Client;
