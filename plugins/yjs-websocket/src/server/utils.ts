/* eslint-disable turbo/no-undeclared-env-vars */
import WebSocket from 'ws';
import http from 'http';
import * as Y from 'yjs';
import * as syncProtocol from '@aomao/plugin-yjs-protocols/sync';
import * as awarenessProtocol from '@aomao/plugin-yjs-protocols/awareness';

import * as encoding from 'lib0/encoding';
import * as decoding from 'lib0/decoding';
import * as map from 'lib0/map';

import debounce from 'lodash.debounce';
import { WSSharedDoc as WSSharedDocInterface } from './types';

import { callbackHandler, CallbackOptions } from './callback';
import { getPersistence } from './persistence';
import { messageAwareness, messageCustom, messageSync } from '../message';

const wsReadyStateConnecting = 0;
const wsReadyStateOpen = 1;
const wsReadyStateClosing = 2; // eslint-disable-line
const wsReadyStateClosed = 3; // eslint-disable-line

// disable gc when using snapshots!
const gcEnabled = process.env.GC !== 'false' && process.env.GC !== '0';

export const docs: Map<string, WSSharedDoc> = new Map();

// const messageAuth = 2

const updateHandler = (
	update: Uint8Array,
	origin: string,
	doc: WSSharedDocInterface,
) => {
	const encoder = encoding.createEncoder();
	encoding.writeVarUint(encoder, messageSync);
	encoding.writeAny(encoder, origin ?? {});
	syncProtocol.writeUpdate(encoder, update);
	const message = encoding.toUint8Array(encoder);
	doc.conns.forEach((_, conn) => send(doc, conn, message));
};

interface AwarenessChangeHandlerOptions {
	added: number[];
	updated: number[];
	removed: number[];
}

export type UpdateCallback = CallbackOptions & {
	// 默认 2000
	debounceWait?: number;
	// 默认 10000
	debounceMaxWait?: number;
};

class WSSharedDoc extends Y.Doc implements WSSharedDocInterface {
	name: string;
	conns: Map<WebSocket.WebSocket, Set<number>>;
	awareness: awarenessProtocol.Awareness;
	/**
	 * @param {string} name
	 */
	constructor(name: string, callback?: UpdateCallback) {
		super({ gc: gcEnabled });
		this.name = name;

		this.conns = new Map();

		this.awareness = new awarenessProtocol.Awareness(this);
		this.awareness.setLocalState(null);

		const awarenessChangeHandler = (
			{ added, updated, removed }: AwarenessChangeHandlerOptions,
			conn: WebSocket.WebSocket | null,
		) => {
			const changedClients = added.concat(updated, removed);
			if (conn !== null) {
				const connControlledIDs = this.conns.get(conn);
				if (connControlledIDs !== undefined) {
					added.forEach((clientID) => {
						connControlledIDs.add(clientID);
					});
					removed.forEach((clientID) => {
						connControlledIDs.delete(clientID);
					});
				}
			}
			// broadcast awareness update
			const encoder = encoding.createEncoder();
			encoding.writeVarUint(encoder, messageAwareness);
			encoding.writeVarUint8Array(
				encoder,
				awarenessProtocol.encodeAwarenessUpdate(
					this.awareness,
					changedClients,
				),
			);
			const buff = encoding.toUint8Array(encoder);
			this.conns.forEach((_, c) => {
				send(this, c, buff);
			});
		};
		this.awareness.on('update', awarenessChangeHandler);
		this.on('updateV2', updateHandler);

		if (callback) {
			const { debounceWait = 2000, debounceMaxWait = 10000 } = callback;
			this.on(
				'updateV2',
				debounce(
					(
						update: Uint8Array,
						origin: string,
						doc: WSSharedDocInterface,
					) => callbackHandler(doc, callback),
					debounceWait,
					{ maxWait: debounceMaxWait },
				),
			);
		}
	}

	sendCustomMessage(conn: WebSocket.WebSocket, message: Record<string, any>) {
		const encoder = encoding.createEncoder();
		encoding.writeVarUint(encoder, messageCustom);
		encoding.writeAny(encoder, message);
		send(this, conn, encoding.toUint8Array(encoder));
	}

	broadcastCustomMessage(
		message: Record<string, any>,
		conn?: WebSocket.WebSocket,
	) {
		const encoder = encoding.createEncoder();
		encoding.writeVarUint(encoder, messageCustom);
		encoding.writeAny(encoder, message);
		const buff = encoding.toUint8Array(encoder);
		this.conns.forEach((_, _conn) => {
			if (conn !== _conn) send(this, _conn, buff);
		});
	}

	destroy(): void {
		super.destroy();
	}
}

/**
 * Gets a Y.Doc by name, whether in memory or on disk
 */
export const getYDoc = (
	docname: string,
	gc: boolean = true,
	onInitialValue?: (doc: WSSharedDocInterface) => Promise<void> | void,
	callback?: UpdateCallback,
): WSSharedDocInterface =>
	map.setIfUndefined(docs, docname, () => {
		const doc = new WSSharedDoc(docname, callback);
		doc.gc = gc;
		const persistence = getPersistence();
		if (persistence !== null) {
			persistence.bindState(docname, doc, onInitialValue);
		}
		docs.set(docname, doc);
		return doc;
	});

const readSyncMetaMessage = (
	decoder: decoding.Decoder,
	encoder: encoding.Encoder,
	doc: Y.Doc,
	transactionOrigin: any,
) => {
	const meta = decoding.readAny(decoder);
	if (!transactionOrigin) {
		transactionOrigin = meta;
	}
	return syncProtocol.readSyncMessage(
		decoder,
		encoder,
		doc,
		transactionOrigin,
		() => {
			encoding.writeAny(encoder, meta);
		},
	);
};

const messageListener = (
	conn: WebSocket.WebSocket,
	doc: WSSharedDocInterface,
	message: Uint8Array,
) => {
	try {
		const encoder = encoding.createEncoder();
		const decoder = decoding.createDecoder(message);
		const messageType = decoding.readVarUint(decoder);
		switch (messageType) {
			case messageSync:
				encoding.writeVarUint(encoder, messageSync);
				readSyncMetaMessage(decoder, encoder, doc, null);
				// If the `encoder` only contains the type of reply message and no
				// message, there is no need to send the message. When `encoder` only
				// contains the type of reply, its length is 1.
				if (encoding.length(encoder) > 1) {
					send(doc, conn, encoding.toUint8Array(encoder));
				}
				break;
			case messageAwareness: {
				awarenessProtocol.applyAwarenessUpdate(
					doc.awareness,
					decoding.readVarUint8Array(decoder),
					conn,
				);
				break;
			}
			case messageCustom: {
				const message = decoding.readAny(decoder);
				doc.broadcastCustomMessage(message, conn);
			}
		}
	} catch (err) {
		console.error(err);
		doc.emit('error', [err]);
	}
};

const closeConn = (doc: WSSharedDocInterface, conn: WebSocket.WebSocket) => {
	if (doc.conns.has(conn)) {
		const controlledIds: Set<number> = doc.conns.get(conn)!;
		doc.conns.delete(conn);
		awarenessProtocol.removeAwarenessStates(
			doc.awareness,
			Array.from(controlledIds),
			null,
		);
		const persistence = getPersistence();
		if (doc.conns.size === 0 && persistence !== null) {
			// if persisted, we store state and destroy ydocument
			persistence.writeState(doc.name, doc).then(() => {
				doc.destroy();
			});
			docs.delete(doc.name);
		}
	}
	conn.close();
};

const send = (
	doc: WSSharedDocInterface,
	conn: WebSocket.WebSocket,
	m: Uint8Array,
) => {
	if (
		conn.readyState !== wsReadyStateConnecting &&
		conn.readyState !== wsReadyStateOpen
	) {
		closeConn(doc, conn);
	}
	try {
		conn.send(m, (err: any) => {
			err != null && closeConn(doc, conn);
		});
	} catch (e) {
		closeConn(doc, conn);
	}
};

interface SetupWSConnectionOptions {
	docname: string;
	gc?: boolean;
	pingTimeout?: number;
	callback?: UpdateCallback;
}

const INIT_VALUE_WAS_SENT = new WeakSet<Y.Doc>();

export const setupWSConnection = (
	conn: WebSocket.WebSocket,
	req: http.IncomingMessage,
	options?: SetupWSConnectionOptions,
) => {
	const {
		docname,
		gc = true,
		pingTimeout = 30000,
		callback,
	} = options ?? { docname: 'default' };
	conn.binaryType = 'arraybuffer';
	// get doc, initialize if it does not exist yet
	const doc = getYDoc(
		docname,
		gc,
		(doc) => {
			if (!INIT_VALUE_WAS_SENT.has(doc)) {
				INIT_VALUE_WAS_SENT.add(doc);
				doc.sendCustomMessage(conn, {
					action: 'initValue',
				});
			}
		},
		callback,
	);
	doc.conns.set(conn, new Set());
	// listen and reply to events
	conn.on('message', (message: ArrayBuffer) =>
		messageListener(conn, doc, new Uint8Array(message)),
	);

	// Check if connection is still alive
	let pongReceived = true;
	const pingInterval = setInterval(() => {
		if (!pongReceived) {
			if (doc.conns.has(conn)) {
				closeConn(doc, conn);
			}
			clearInterval(pingInterval);
		} else if (doc.conns.has(conn)) {
			pongReceived = false;
			try {
				conn.ping();
			} catch (e) {
				closeConn(doc, conn);
				clearInterval(pingInterval);
			}
		}
	}, pingTimeout);
	conn.on('close', () => {
		closeConn(doc, conn);
		clearInterval(pingInterval);
	});
	conn.on('pong', () => {
		pongReceived = true;
	});
	// put the following in a variables in a block so the interval handlers don't keep in in
	// scope
	{
		// send sync step 1
		const encoder = encoding.createEncoder();
		encoding.writeVarUint(encoder, messageSync);
		encoding.writeAny(encoder, {});
		syncProtocol.writeSyncStep1(encoder, doc);
		send(doc, conn, encoding.toUint8Array(encoder));
		const awarenessStates = doc.awareness.getStates();
		if (awarenessStates.size > 0) {
			const encoder = encoding.createEncoder();
			encoding.writeVarUint(encoder, messageAwareness);
			encoding.writeVarUint8Array(
				encoder,
				awarenessProtocol.encodeAwarenessUpdate(
					doc.awareness,
					Array.from(awarenessStates.keys()),
				),
			);
			send(doc, conn, encoding.toUint8Array(encoder));
		}
	}
};
