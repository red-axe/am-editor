import { EventEmitter } from 'events';
import { EngineInterface } from '@aomao/engine';
import ReconnectingWebSocket, { ErrorEvent } from 'reconnecting-websocket';
import { Doc } from 'sharedb';
import sharedb from 'sharedb/lib/client';
import { Socket } from 'sharedb/lib/sharedb';

export type Member = {
	id: number;
	name: string;
	iid: number;
	uuid: string;
	color?: string;
};
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

export type ERROR = {
	code: string;
	level: string;
	message: string;
	error?: ErrorEvent;
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

class OTClient extends EventEmitter {
	protected engine: EngineInterface;
	protected socket?: WebSocket;
	protected members: Array<Member> = [];
	protected current?: Member;
	protected status?: string;
	protected doc?: Doc;
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
	 * @param millisecond 毫秒 默认 30000
	 * @returns
	 */
	checkHeartbeat(millisecond: number = 30000) {
		if (!this.socket) return;
		const timeout = setTimeout(() => {
			const now = new Date();
			if (
				!this.heartbeat ||
				now.getTime() - this.heartbeat.datetime.getTime() >= millisecond
			) {
				this.socket?.send(
					JSON.stringify({
						action: 'heartbeat',
						data: now.getTime(),
					}),
				);
			}
			this.heartbeat = {
				timeout,
				datetime: now,
			};
			this.checkHeartbeat(millisecond);
		}, 1000);
	}

	connect(url: string, documentID: string, collectionName: string = 'aomao') {
		const socket = new ReconnectingWebSocket(url, [], {
			maxReconnectionDelay: 30000,
			minReconnectionDelay: 10000,
			reconnectionDelayGrowFactor: 10000,
			maxRetries: 10,
		});
		socket.addEventListener('open', () => {
			console.log('collab server connected');
			this.socket = socket as WebSocket;
			this.socket.addEventListener('message', (event) => {
				const { data, action } = JSON.parse(event.data);
				if ('members' === action) {
					this.addMembers(data);
					this.engine.ot.setMembers(data);
					return;
				}
				if ('join' === action) {
					this.addMembers([data]);
					this.engine.ot.addMember(data);
					return;
				}
				if ('leave' === action) {
					this.engine.ot.removeMember(data);
					this.removeMember(data);
					return;
				}
				if ('ready' === action) {
					this.current = data;
					this.engine.ot.setCurrentMember(data);
					this.load(documentID, collectionName);
				}
				if ('broadcast' === action) {
					const { sender, body, type } = data;
					if (sender.uuid !== this.current?.uuid) {
						this.emit(EVENT.message, {
							type,
							body,
						});
					}
				}
			});
			this.checkHeartbeat();
		});
		socket.addEventListener('close', () => {
			console.log(
				'collab server connection close, current status: ',
				this.status,
			);
			if (this.status !== STATUS.exit) {
				console.log('connect closed');
				this.onError({
					code: ERROR_CODE.DISCONNECTED,
					level: ERROR_LEVEL.FATAL,
					message: '网络连接异常，无法继续编辑',
				});
			}
		});
		socket.addEventListener('error', (error) => {
			console.log('collab server connection error');
			this.onError({
				code: ERROR_CODE.CONNECTION_ERROR,
				level: ERROR_LEVEL.FATAL,
				message: '网络连接异常，无法继续编辑',
				error,
			});
		});
	}

	load(documentID: string, collectionName: string) {
		const connection = new sharedb.Connection(this.socket as Socket);
		const doc = connection.get(collectionName, documentID);

		doc.subscribe((error) => {
			if (error) {
				console.log('collab doc subscribe error', error);
			} else {
				try {
					this.initOt(doc);
					this.emit(EVENT.membersChange, this.normalizeMembers());
					this.transmit(STATUS.active);
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

	initOt(doc: Doc) {
		this.engine.ot.init(doc);
		this.engine.focus();
		this.emit('ready', this.engine.ot.getCurrentMember());
	}

	reset() {
		this.members = [];
		this.current = undefined;
		this.disconnect();
		this.transmit(STATUS.init);
	}

	broadcast(type: string, body: any = {}) {
		this.socket?.send(
			JSON.stringify({
				action: 'broadcast',
				data: {
					type,
					body,
					sender: this.current,
				},
			}),
		);
	}

	addMembers(member: Array<Member>) {
		member.forEach((member) => {
			if (!this.members.find((m) => member.id === m.id))
				this.members.push(member);
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
		const colorMap = {};
		const users = this.engine.ot.getMembers();
		users.forEach((user) => {
			colorMap[user.uuid] = user.color;
		});
		const memberMap = {};
		for (let i = this.members.length; i > 0; i--) {
			const member = this.members[i - 1];
			if (!memberMap[member.id]) {
				const cloneMember = { ...member };
				cloneMember.color = colorMap[member.uuid];
				memberMap[member.id] = member;
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
				if (this.heartbeat?.timeout)
					clearTimeout(this.heartbeat!.timeout);
			} catch (e) {
				console.log(e);
			}
		}
	}

	onPageClose = () => {
		this.exit();
	};

	onVisibilityChange = () => {
		if ('hidden' === document.visibilityState) {
			this.emit(EVENT.inactive);
		}
	};

	bindEvents() {
		window.addEventListener('beforeunload', this.onPageClose);
		window.addEventListener('visibilitychange', this.onVisibilityChange);
		window.addEventListener('pagehide', this.onPageClose);
	}

	unbindEvents() {
		window.removeEventListener('beforeunload', this.onPageClose);
		window.removeEventListener('visibilitychange', this.onVisibilityChange);
		window.removeEventListener('pagehide', this.onPageClose);
	}
}

export default OTClient;
