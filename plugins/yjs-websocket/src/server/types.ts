import { WebSocket } from 'ws';
import awarenessProtocol from '@aomao/plugin-yjs-protocols/awareness';
import { Doc } from 'yjs';

export interface WSSharedDoc extends Doc {
	name: string;
	conns: Map<WebSocket, Set<number>>;
	awareness: awarenessProtocol.Awareness;
	sendCustomMessage: (conn: WebSocket, message: Record<string, any>) => void;
	broadcastCustomMessage: (
		message: Record<string, any>,
		conn?: WebSocket,
	) => void;
}

export type ContentType = 'Array' | 'Map' | 'Text' | 'XmlFragment';
