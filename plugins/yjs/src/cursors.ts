import { EngineInterface, CursorAttribute } from '@aomao/engine';
import { Awareness } from '@aomao/plugin-yjs-protocols/awareness';
import { CursorState, CursorData } from './types';
import { YjsEditor } from './yjs';

export interface YCursorEditor<T extends CursorData = CursorData>
	extends YjsEditor {
	awareness: Awareness;
	cursorDataField: string;
	selectionStateField: string;

	sendCursorPosition: (cursorAttribute: CursorAttribute) => void;

	sendCursorData: (data: T) => void;
}

export const YCursorEditor = {
	sendCursorPosition<T extends CursorData>(
		editor: YCursorEditor<T>,
		cursorAttribute: CursorAttribute,
	) {
		editor.sendCursorPosition(cursorAttribute);
	},

	sendCursorData<T extends CursorData>(editor: YCursorEditor<T>, data: T) {
		editor.sendCursorData(data);
	},

	cursorState<T extends CursorData>(
		editor: YCursorEditor<T>,
		clientId: number,
	): CursorState<T> | null {
		if (
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
		editor: YCursorEditor<T>,
	): Record<string, CursorState<T>> {
		if (!YjsEditor.connected(editor)) {
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

export interface RemoteCursorChangeState {
	added: number[];
	removed: number[];
	updated: number[];
}

export type RemoteCursorChangeEventListener = (
	event: RemoteCursorChangeState,
) => void;

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
			e.model.drawCursor(attributes);
		}
		if (clientIds.removed.length > 0) {
			for (const id of clientIds.removed) {
				const uuid = String(id);
				e.model.selection.removeAttirbute(uuid);
				e.model.member.remove(uuid);
			}
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
			e.model.drawCursor(attributes);
		}
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

	e.model.selection.on('change', (cursorAttribute) => {
		if (e.connected() && !e.change.isComposing()) {
			YCursorEditor.sendCursorPosition(e, cursorAttribute);
		}
	});

	return e;
}
