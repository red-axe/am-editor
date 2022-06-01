import { EventEmitter } from 'events';
import type { EngineInterface } from '@aomao/engine';
import ReconnectingWebSocket from 'reconnecting-websocket';
import type { Doc } from 'sharedb';
import sharedb from 'sharedb/lib/client';
import type { Socket } from 'sharedb/lib/sharedb';
import { Member, ERROR } from './types';

export const STATUS = {
	init: 'init',
	loaded: 'loaded',
	active: 'active',
	exit: 'exit',
	error: 'error',
};

export const EVENT = {
	inactive: 'inactive',
	error: 'error',
	membersChange: 'membersChange',
	statusChange: 'statusChange',
	message: 'message',
};

export const ERROR_CODE = {
	INIT_FAILED: 'INIT_FAILED',
	SAVE_FAILED: 'SAVE_FAILED',
	PUBLISH_FAILED: 'PUBLISH_FAILED',
	DISCONNECTED: 'DISCONNECTED',
	STATUS_CODE: {
		TIMEOUT: 4001,
		FORCE_DISCONNECTED: 4002,
	},
	CONNECTION_ERROR: 'CONNECTION_ERROR',
	COLLAB_DOC_ERROR: 'COLLAB_DOC_ERROR',
};

export const ERROR_LEVEL = {
	FATAL: 'FATAL',
	WARNING: 'WARNING',
	NOTICE: 'NOTICE',
};
/**
 * 协同客户端
 */
class OTClient extends EventEmitter {
	// 编辑器引擎
	protected engine: EngineInterface;
	// ws 连接实例
	protected socket?: WebSocket;
	// 当前协同的所有用户
	protected members: Array<Member> = [];
	// 当前用户
	protected current?: Member;
	// 当前状态
	protected status?: string;
	// 协作的文档对象
	protected doc?: Doc;
	// 当前 ws 是否关闭
	protected isClosed: boolean = true;
	// 心跳检测对象
	protected heartbeat?: {
		timeout: NodeJS.Timeout;
		datetime: Date;
	};

	constructor(engine: EngineInterface) {
		super();
		this.engine = engine;
	}
	/**
	 * 每隔指定毫秒发送心跳检测
	 * @param {number} millisecond 毫秒 默认 30000
	 * @return {void}
	 */
	checkHeartbeat(millisecond: number = 30000): void {
		if (!this.socket) return;
		if (this.heartbeat?.timeout) clearTimeout(this.heartbeat.timeout);
		const timeout = setTimeout(() => {
			const now = new Date();

			if (
				!this.isClosed &&
				(!this.heartbeat ||
					now.getTime() - this.heartbeat.datetime.getTime() >=
						millisecond)
			) {
				this.sendMessage('heartbeat', { time: now.getTime() });
				this.heartbeat = {
					timeout,
					datetime: now,
				};
			} else if (this.heartbeat) {
				this.heartbeat.timeout = timeout;
			}
			this.checkHeartbeat(millisecond);
		}, 1000);
	}

	/**
	 * 连接到协作文档
	 * @param url 协同服务地址
	 * @param docID 文档唯一ID
	 * @param defautlValue 如果协作服务端没有创建的文档，将作为协同文档的初始值
	 * @param collectionName 协作服务名称，与协同服务端相对应
	 */
	connect(
		url: string,
		docID: string,
		defautlValue?: string,
		collectionName: string = 'aomao',
	) {
		if (this.socket) this.socket.close();
		// 实例化一个可以自动重连的 ws
		const socket = new ReconnectingWebSocket(
			async () => {
				const token = await new Promise<string>((resolve) => {
					// 这里可以异步获取一个Token，如果有的话
					resolve('');
				});
				// 组合ws链接
				const uri = new URL(url);
				uri.searchParams.set('id', docID);
				uri.searchParams.set('token', token);
				return uri.toString();
			},
			[],
			{
				maxReconnectionDelay: 5000,
				minReconnectionDelay: 1000,
				reconnectionDelayGrowFactor: 10000,
				maxRetries: 99,
			},
		);
		const handleMessage = (event: MessageEvent) => {
			const { data, action } = JSON.parse(event.data);
			// 当前所有的协作用户
			if ('members' === action) {
				this.addMembers(data);
				this.engine.ot.setMembers(data);
				return;
			}
			// 有新的协作者加入了
			if ('join' === action) {
				this.addMembers([data]);
				this.engine.ot.addMember(data);
				return;
			}
			// 有协作者离开了
			if ('leave' === action) {
				this.engine.ot.removeMember(data);
				this.removeMember(data);
				return;
			}
			// 协作服务端准备好了，可以实例化编辑器内部的协同服务了
			if ('ready' === action) {
				// 当前协作者用户
				this.current = data.member as Member;
				this.engine.ot.setCurrentMember(this.current);
				this.engine.ot.renderSelection(data.selection);
				this.emit('ready', this.engine.ot.getCurrentMember());
				this.emit(EVENT.membersChange, this.normalizeMembers());
				this.transmit(STATUS.active);
			}
			// 广播信息，一个协作用户发送给全部协作者的广播
			if ('broadcast' === action) {
				const { uuid, body, type } = data;
				// 如果接收者和发送者不是同一人就触发一个message事件，外部可以监听这个事件并作出响应
				if (uuid !== this.current?.uuid) {
					switch (type) {
						case 'select':
							this.engine.ot.renderSelection(body);
							break;
						default:
							this.emit(EVENT.message, {
								type,
								body,
							});
					}
				}
			}
		};
		// ws 已链接
		socket.addEventListener('open', () => {
			this.socket = socket as WebSocket;
			// 加载编辑器内部的协同服务
			this.load(socket, docID, collectionName, defautlValue);
			// 标记关闭状态为false
			this.isClosed = false;
			// 监听协同服务端自定义消息
			this.socket.removeEventListener('message', handleMessage);
			this.socket.addEventListener('message', handleMessage);
			// 开始检测心跳
			this.checkHeartbeat();
		});
		// 监听ws关闭事件
		socket.addEventListener('close', () => {
			// 如果不是主动退出的关闭，就显示错误信息
			if (this.status !== STATUS.exit) {
				this.onError({
					code: ERROR_CODE.DISCONNECTED,
					level: ERROR_LEVEL.FATAL,
					message:
						'网络连接异常，无法继续编辑！正在为您重新连接中...',
				});
			}
		});
		// 监听ws错误消息
		socket.addEventListener('error', (error) => {
			this.onError({
				code: ERROR_CODE.CONNECTION_ERROR,
				level: ERROR_LEVEL.FATAL,
				message: '协作服务异常，无法继续编辑！正在为您重新连接中...',
				error: error as ErrorEvent,
			});
		});
	}

	/**
	 * 加载编辑器内部协同服务
	 * @param docId 文档唯一ID
	 * @param collectionName 协作服务名称
	 * @param defaultValue 如果服务端没有对应docId的文档，就用这个值初始化
	 */
	load(
		socket: ReconnectingWebSocket,
		docId: string,
		collectionName: string,
		defaultValue?: string,
	) {
		// 实例化一个协同客户端的连接
		const connection = new sharedb.Connection(socket as Socket);
		// 获取文档对象
		const doc = connection.get(collectionName, docId);
		this.doc = doc;
		// 订阅
		doc.subscribe((error) => {
			console.log('subscribe');
			if (error) {
				console.log('collab doc subscribe error', error);
			} else {
				try {
					// 实例化编辑器内部协同服务
					this.engine.ot.initRemote(
						doc,
						defaultValue,
						(paths: any) => {
							this.broadcast('select', paths);
						},
					);
					// 聚焦到编辑器
					this.engine.focus();
				} catch (err) {
					console.log('am-engine init failed:', err);
				}
			}
		});

		doc.on('create', () => {
			console.log('collab doc create');
		});

		doc.on('load', () => {
			console.log('collab doc loaded');
			this.sendMessage('ready');
		});

		doc.on('op', (op, type) => {
			console.log('op', op, type ? 'local' : 'server');
		});

		doc.on('del', (t, n) => {
			console.log('collab doc deleted', t, n);
		});

		doc.on('error', (error) => {
			console.error(error);
		});
	}

	/**
	 * 广播一个消息
	 * @param type 消息类型
	 * @param body 消息内容
	 */
	broadcast(type: string, body: any = {}) {
		this.sendMessage('broadcast', { type, body });
	}

	/**
	 * 给服务端发送一个消息
	 * @param action 消息类型
	 * @param data 消息数据
	 */
	sendMessage(action: string, data?: any) {
		this.socket?.send(
			JSON.stringify({
				action,
				data: {
					...data,
					doc_id: this.doc?.id,
					uuid: this.current?.uuid,
				},
			}),
		);
	}

	addMembers(memberList: Array<Member>) {
		memberList.forEach((member) => {
			if (!this.members.find((m) => member.uuid === m.uuid)) {
				this.members.push(member);
			}
		});
		setTimeout(() => {
			this.emit(EVENT.membersChange, this.normalizeMembers());
		}, 1000);
	}

	removeMember(member: Member) {
		this.members = this.members.filter((user) => {
			return user.uuid !== member.uuid;
		});
		this.emit(EVENT.membersChange, this.normalizeMembers());
	}

	normalizeMembers() {
		const members = [];
		const colorMap: any = {};
		const users = this.engine.ot.getMembers();
		users.forEach((user: Member) => {
			colorMap[user.uuid] = user.color;
		});
		const memberMap: any = {};
		for (let i = this.members.length; i > 0; i--) {
			const member = this.members[i - 1];
			if (!memberMap[member.uuid]) {
				const cloneMember = { ...member };
				cloneMember.color = colorMap[member.uuid];
				memberMap[member.uuid] = member;
				members.push(cloneMember);
			}
		}
		return members;
	}

	transmit(status: string) {
		const prevStatus = this.status;
		this.status = status;
		this.emit(EVENT.statusChange, {
			form: prevStatus,
			to: status,
		});
	}

	onError(error: ERROR) {
		this.emit(EVENT.error, error);
		this.status = STATUS.error;
	}

	isActive() {
		return this.status === STATUS.active;
	}

	exit() {
		if (this.status !== STATUS.exit) {
			this.transmit(STATUS.exit);
			this.disconnect();
		}
	}

	disconnect() {
		if (this.socket) {
			try {
				this.socket.close(
					ERROR_CODE.STATUS_CODE.FORCE_DISCONNECTED,
					'FORCE_DISCONNECTED',
				);
				if (this.heartbeat?.timeout) {
					clearTimeout(this.heartbeat!.timeout);
				}
			} catch (e) {
				console.log(e);
			}
		}
	}

	bindEvents() {
		window.addEventListener('beforeunload', () => this.exit());
		window.addEventListener('visibilitychange', () => {
			if ('hidden' === document.visibilityState) {
				this.emit(EVENT.inactive);
			}
		});
		window.addEventListener('pagehide', () => this.exit());
	}

	unbindEvents() {
		window.removeEventListener('beforeunload', () => this.exit());
		window.removeEventListener('visibilitychange', () => {
			if ('hidden' === document.visibilityState) {
				this.emit(EVENT.inactive);
			}
		});
		window.removeEventListener('pagehide', () => this.exit());
	}
}

export default OTClient;
