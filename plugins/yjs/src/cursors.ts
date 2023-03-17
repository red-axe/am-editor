import {
	EngineInterface,
	CursorAttribute,
	EditorInterface,
} from '@aomao/engine';
import { Awareness } from '@aomao/plugin-yjs-protocols/awareness';
import { CursorState, CursorData } from './types';
import { YjsEditor } from './yjs';

export type CursorStateChangeEvent = {
	added: number[];
	updated: number[];
	removed: number[];
};

export type RemoteCursorChangeEventListener = (
	event: CursorStateChangeEvent,
) => void;

const CURSOR_CHANGE_EVENT_LISTENERS: WeakMap<
	EditorInterface,
	Set<RemoteCursorChangeEventListener>
> = new WeakMap();

export interface YCursorEditor<T extends CursorData = CursorData>
	extends YjsEditor {
	awareness: Awareness;
	cursorDataField: string;
	selectionStateField: string;

	sendCursorPosition: (cursorAttribute: CursorAttribute) => void;

	sendCursorData: (data: T) => void;
}

export const YCursorEditor = {
	isYCursorEditor(value: EditorInterface): value is YCursorEditor {
		return (
			'awareness' in value &&
			'cursorDataField' in value &&
			'selectionStateField' in value &&
			typeof (value as YCursorEditor).sendCursorPosition === 'function' &&
			typeof (value as YCursorEditor).sendCursorData === 'function'
		);
	},
	sendCursorPosition<T extends CursorData>(
		editor: YCursorEditor<T>,
		cursorAttribute: CursorAttribute,
	) {
		editor.sendCursorPosition(cursorAttribute);
	},

	sendCursorData<T extends CursorData>(editor: YCursorEditor<T>, data: T) {
		editor.sendCursorData(data);
	},

	on(
		editor: EngineInterface,
		event: 'change',
		handler: RemoteCursorChangeEventListener,
	) {
		if (event !== 'change') {
			return;
		}

		const listeners =
			CURSOR_CHANGE_EVENT_LISTENERS.get(editor) ?? new Set();
		listeners.add(handler);
		CURSOR_CHANGE_EVENT_LISTENERS.set(editor, listeners);
	},

	off(
		editor: EngineInterface,
		event: 'change',
		listener: RemoteCursorChangeEventListener,
	) {
		if (event !== 'change') {
			return;
		}

		const listeners = CURSOR_CHANGE_EVENT_LISTENERS.get(editor);
		if (listeners) {
			listeners.delete(listener);
		}
	},

	cursorState<T extends CursorData>(
		editor: EditorInterface,
		clientId: number,
	): CursorState<T> | null {
		if (
			!YCursorEditor.isYCursorEditor(editor) ||
			clientId === editor.awareness.clientID ||
			!YjsEditor.connected(editor)
		) {
			return null;
		}

		const state = editor.awareness.getStates().get(clientId);
		if (!state) {
			return null;
		}

		return {
			cursorAttribute: state[editor.selectionStateField] ?? null,
			data: state[editor.cursorDataField],
			clientId,
		};
	},

	cursorStates<T extends CursorData>(
		editor: EditorInterface,
	): Record<string, CursorState<T>> {
		if (
			!YCursorEditor.isYCursorEditor(editor) ||
			!YjsEditor.connected(editor)
		) {
			return {};
		}

		return Object.fromEntries(
			Array.from(
				editor.awareness.getStates().entries(),
				([id, state]) => {
					// Ignore own state
					if (id === editor.awareness.clientID || !state) {
						return null;
					}

					return [
						id,
						{
							relativeSelection:
								state[editor.selectionStateField],
							data: state[editor.cursorDataField],
						},
					];
				},
			).filter(Array.isArray),
		);
	},
};

export type WithCursorsOptions<T extends CursorData = CursorData> = {
	// Local state field used to store the user selection
	cursorStateField?: string;

	// Local state field used to store data attached to the local client
	cursorDataField?: string;

	data?: T;

	autoSend?: boolean;
};

export function withYCursors<
	TCursorData extends CursorData,
	T extends EngineInterface,
>(
	editor: T,
	awareness: Awareness,
	{
		cursorStateField: selectionStateField = 'selection',
		cursorDataField = 'data',
		autoSend = true,
		data,
	}: WithCursorsOptions<TCursorData> = {},
): T & YCursorEditor<TCursorData> {
	const e = editor as T & YCursorEditor<TCursorData>;

	e.awareness = awareness;
	e.cursorDataField = cursorDataField;
	e.selectionStateField = selectionStateField;

	e.sendCursorData = (cursorData: TCursorData) => {
		e.awareness.setLocalStateField(e.cursorDataField, cursorData);
	};

	e.sendCursorPosition = (cursorAttribute: CursorAttribute) => {
		const localState = e.awareness.getLocalState();
		const currentRange = localState?.[selectionStateField];

		if (!cursorAttribute) {
			if (currentRange) {
				e.awareness.setLocalStateField(e.selectionStateField, null);
			}

			return;
		}

		e.awareness.setLocalStateField(e.selectionStateField, cursorAttribute);
	};

	const awarenessChangeListener: RemoteCursorChangeEventListener = (
		yEvent,
	) => {
		const localId = e.awareness.clientID;
		const clientIds = {
			added: yEvent.added.filter((id) => id !== localId),
			removed: yEvent.removed.filter((id) => id !== localId),
			updated: yEvent.updated.filter((id) => id !== localId),
		};
		let hasChanged = false;
		if (clientIds.added.length > 0) {
			const attributes: CursorAttribute[] = [];
			for (const id of clientIds.added) {
				const attribute = YCursorEditor.cursorState(e, id);
				if (attribute?.data)
					e.model.member.add({
						...attribute.data,
						uuid: String(attribute.clientId),
					});
				if (attribute?.cursorAttribute)
					attributes.push({
						...attribute.cursorAttribute,
						uuid: String(attribute.clientId),
					});
			}
			hasChanged = true;
			e.model.drawCursor(attributes);
		}
		if (clientIds.removed.length > 0) {
			for (const id of clientIds.removed) {
				const uuid = String(id);
				e.model.selection.removeAttirbute(uuid);
				e.model.member.remove(uuid);
			}
			hasChanged = true;
		}
		if (clientIds.updated.length > 0) {
			const attributes: CursorAttribute[] = [];
			for (const id of clientIds.updated) {
				const attribute = YCursorEditor.cursorState(e, id);
				if (attribute?.cursorAttribute)
					attributes.push({
						...attribute.cursorAttribute,
						uuid: String(attribute.clientId),
					});
			}
			hasChanged = true;
			e.model.drawCursor(attributes);
		}
		const listeners = CURSOR_CHANGE_EVENT_LISTENERS.get(e);
		if (!listeners || !hasChanged) {
			return;
		}
		listeners.forEach((listener) => listener(clientIds));
	};

	const { connect, disconnect } = e;
	e.connect = () => {
		connect();
		e.awareness.on('change', awarenessChangeListener);
		const uuid = String(e.awareness.clientID);
		if (data) {
			e.model.member.add({
				...data,
				uuid,
			});
		}

		e.model.member.setCurrent(uuid);
		awarenessChangeListener({
			removed: [],
			added: Array.from(e.awareness.getStates().keys()),
			updated: [],
		});
		if (autoSend) {
			if (data) {
				YCursorEditor.sendCursorData(e, data);
			}
		}
	};

	e.disconnect = () => {
		e.awareness.off('change', awarenessChangeListener);

		awarenessChangeListener({
			removed: Array.from(e.awareness.getStates().keys()),
			added: [],
			updated: [],
		});
		disconnect();
		e.model.member.remove(String(e.awareness.clientID));
	};

	e.model.onSelectionChange((cursorAttribute) => {
		if (e.connected() && !e.change.isComposing()) {
			YCursorEditor.sendCursorPosition(e, cursorAttribute);
		}
	});

	return e;
}
