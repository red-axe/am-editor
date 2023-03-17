import * as Y from 'yjs';
import { InsertDelta } from './types';
import { yTextToInsertDelta } from './delta';

export function cloneInsertDeltaDeep(delta: InsertDelta): InsertDelta {
	return delta.map((element) => {
		if (typeof element.insert === 'string') {
			return element;
		}
		if (!(element.insert instanceof Y.XmlText))
			throw new Error('Not implemented');
		return { ...element, insert: cloneDeep(element.insert) };
	});
}

export function cloneDeep(yText: Y.XmlText): Y.XmlText {
	const clone = new Y.XmlText();

	const attributes = yText.getAttributes();
	Object.entries(attributes).forEach(([key, value]) => {
		clone.setAttribute(key, value);
	});

	clone.applyDelta(cloneInsertDeltaDeep(yTextToInsertDelta(yText)), {
		sanitize: false,
	});

	return clone;
}
