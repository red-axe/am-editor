import { EventEmitter } from 'events';
import { EngineInterface } from 'packages/engine/src';
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

	constructor(engine: EngineInterface) {
		super();
		this.engine = engine;
	}

	connect(url: string, documentID: string, collectionName: string = 'aomao') {
		const socket = new ReconnectingWebSocket(url);
		socket.addEventListener('open', () => {
			console.log('collab server connected');
			this.socket = socket as WebSocket;
			this.socket.addEventListener('message', event => {
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
					const { body, type } = data;
					if (body.user.uuid !== this.current?.uuid) {
						this.emit(EVENT.message, {
							type,
							body,
						});
					}
				}
			});
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
		socket.addEventListener('error', error => {
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

		doc.subscribe(error => {
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

		doc.on('error', error => {
			console.log('collab doc error', {
				error,
				origin_code: error.code,
			});
		});
	}

	initOt(doc: Doc) {
		this.engine.ot.init(doc);
		this.engine.focus();
		this.emit('ready');
	}

	reset() {
		this.members = [];
		this.current = undefined;
		this.disconnect();
		this.transmit(STATUS.init);
	}

	addMembers(member: Array<Member>) {
		this.members.concat(member);
		setTimeout(() => {
			this.emit(EVENT.membersChange, this.normalizeMembers());
		}, 1000);
	}

	removeMember(member: Member) {
		this.members = this.members.filter(user => {
			return user.uuid !== member.uuid;
		});
		this.emit(EVENT.membersChange, this.normalizeMembers());
	}

	normalizeMembers() {
		const members = [];
		const colorMap = {};
		const users = this.engine.ot.getMembers();
		users.forEach(user => {
			colorMap[user.uuid] = user.color;
		});
		const memberMap = {};
		for (let i = this.members.length; i > 0; i--) {
			const member = this.members[i - 1];
			if (!memberMap[member.id]) {
				const cloneMember = { ...member };
				cloneMember.color = colorMap[member.uuid];
				memberMap[member.id] = member;
				if (member.id !== this.current?.id) {
					members.push(cloneMember);
				}
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
