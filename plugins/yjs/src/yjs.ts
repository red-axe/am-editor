import {
	EditorInterface,
	Operation,
	Element,
	EngineInterface,
} from '@aomao/engine';
import * as Y from 'yjs';
import { applyYjsEvents } from './apply-to-editor/apply-yjs-events';
import { applyEditorOp } from './apply-to-yjs';
import { assertDocumentAttachment, yTextToEditorElement } from './transform';

type LocalChange = {
	op: Operation;
	doc: Element;
	origin: unknown;
};

const DEFAULT_LOCAL_ORIGIN = Symbol('am-yjs-operation');
const DEFAULT_POSITION_STORAGE_ORIGIN = Symbol('am-yjs-position-storage');

const ORIGIN: WeakMap<EditorInterface, unknown> = new WeakMap();
const LOCAL_CHANGES: WeakMap<EditorInterface, LocalChange[]> = new WeakMap();

export type YjsEditor = EditorInterface & {
	sharedRoot: Y.XmlText;
	undoManager: Y.UndoManager;
	localOrigin: unknown;
	positionStorageOrigin: unknown;

	applyRemoteEvents: (events: Y.YEvent<Y.XmlText>[], origin: unknown) => void;

	storeLocalChange: (op: Operation) => void;
	flushLocalChanges: () => void;

	isLocalOrigin: (origin: unknown) => boolean;
	connect: () => void;
	disconnect: () => void;
	connected: () => boolean;
};

const CONNECTED: WeakSet<EditorInterface> = new WeakSet();

export const YjsEditor = {
	localChanges(editor: YjsEditor): LocalChange[] {
		return LOCAL_CHANGES.get(editor) ?? [];
	},

	applyRemoteEvents(
		editor: YjsEditor,
		events: Y.YEvent<Y.XmlText>[],
		origin: unknown,
	): void {
		editor.applyRemoteEvents(events, origin);
	},

	storeLocalChange(editor: YjsEditor, op: Operation): void {
		editor.storeLocalChange(op);
	},

	flushLocalChanges(editor: YjsEditor): void {
		editor.flushLocalChanges();
	},

	connected(editor: YjsEditor): boolean {
		return CONNECTED.has(editor);
	},

	connect(editor: YjsEditor): void {
		CONNECTED.add(editor);
	},

	disconnect(editor: YjsEditor): void {
		CONNECTED.delete(editor);
	},

	isLocal(editor: YjsEditor): boolean {
		return editor.isLocalOrigin(YjsEditor.origin(editor));
	},

	origin(editor: YjsEditor): unknown {
		const origin = ORIGIN.get(editor);
		return origin !== undefined ? origin : editor.localOrigin;
	},

	withOrigin(editor: YjsEditor, origin: unknown, fn: () => void): void {
		const prev = YjsEditor.origin(editor);
		ORIGIN.set(editor, origin);
		fn();
		ORIGIN.set(editor, prev);
	},
};

export type WithYjsOptions = {
	autoConnect?: boolean;

	// Origin used when applying local editor operations to yjs
	localOrigin?: unknown;

	// Origin used when storing positions
	positionStorageOrigin?: unknown;
};

export const withYjs = <T extends EngineInterface>(
	editor: EngineInterface,
	sharedRoot: Y.XmlText,
	{
		localOrigin,
		positionStorageOrigin,
		autoConnect = false,
	}: WithYjsOptions = {},
) => {
	const e = editor as T & YjsEditor;

	e.sharedRoot = sharedRoot;

	e.localOrigin = localOrigin ?? DEFAULT_LOCAL_ORIGIN;
	e.positionStorageOrigin =
		positionStorageOrigin ?? DEFAULT_POSITION_STORAGE_ORIGIN;

	e.applyRemoteEvents = (events, origin) => {
		YjsEditor.flushLocalChanges(e);

		YjsEditor.withOrigin(e, origin, () => {
			applyYjsEvents(e.sharedRoot, e, events);
		});
	};

	e.isLocalOrigin = (origin) => origin === e.localOrigin;

	const handleYEvents = (
		events: Y.YEvent<Y.XmlText>[],
		transaction: Y.Transaction,
	) => {
		if (e.isLocalOrigin(transaction.origin)) {
			return;
		}

		YjsEditor.applyRemoteEvents(e, events, transaction.origin);
	};

	let autoConnectTimeoutId: ReturnType<typeof setTimeout> | null = null;
	if (autoConnect) {
		autoConnectTimeoutId = setTimeout(() => {
			autoConnectTimeoutId = null;
			YjsEditor.connect(e);
		});
	}

	e.connect = () => {
		e.sharedRoot.observeDeep(handleYEvents);
		const content = yTextToEditorElement(e.sharedRoot);

		editor.setJsonValue(content);
	};

	e.disconnect = () => {
		if (autoConnectTimeoutId) {
			clearTimeout(autoConnectTimeoutId);
		}

		YjsEditor.flushLocalChanges(e);
		if (e.connected()) e.sharedRoot.unobserveDeep(handleYEvents);
	};

	e.storeLocalChange = (op) => {
		LOCAL_CHANGES.set(e, [
			...YjsEditor.localChanges(e),
			{ op, doc: editor.model.root, origin: YjsEditor.origin(e) },
		]);
	};

	e.flushLocalChanges = () => {
		assertDocumentAttachment(e.sharedRoot);
		const localChanges = YjsEditor.localChanges(e);
		LOCAL_CHANGES.delete(e);

		// Group local changes by origin so we can apply them in the correct order
		// with the correct origin with a minimal amount of transactions.
		const txGroups: LocalChange[][] = [];
		localChanges.forEach((change) => {
			const currentGroup = txGroups[txGroups.length - 1];
			if (currentGroup && currentGroup[0].origin === change.origin) {
				return currentGroup.push(change);
			}

			txGroups.push([change]);
			return;
		});

		txGroups.forEach((txGroup) => {
			assertDocumentAttachment(e.sharedRoot);

			e.sharedRoot.doc.transact((t) => {
				txGroup.forEach((change) => {
					assertDocumentAttachment(e.sharedRoot);
					// 设置 origin ops 到 meta 中，在 applyRemoteEvents 中，可以使用 origin.meta.ops 来获取操作。前提需要使用 @editablejs/yjs-websocket 插件
					const ops = t.meta.get('ops');
					if (!ops) {
						t.meta.set('ops', [{ ...change.op }]);
					} else {
						ops.push({ ...change.op });
					}
					applyEditorOp(e.sharedRoot, change.doc, change.op);
				});
			}, txGroup[0].origin);
		});
	};

	e.model.onChange((ops) => {
		if (
			YjsEditor.connected(e) &&
			YjsEditor.isLocal(e) &&
			!e.change.isComposing()
		) {
			ops.forEach((op) => YjsEditor.storeLocalChange(e, op));
		}
		if (YjsEditor.connected(e) && !e.change.isComposing()) {
			YjsEditor.flushLocalChanges(e);
		}
	});

	return editor;
};
