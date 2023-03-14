import { EngineInterface, Operation } from '@aomao/engine';
import { translateYTextEvent } from './apply-text-event';
import * as Y from 'yjs';

export function translateYjsEvent(
	sharedRoot: Y.XmlText,
	editor: EngineInterface,
	event: Y.YEvent<Y.XmlText>,
): Operation[] {
	if (event instanceof Y.YTextEvent) {
		return translateYTextEvent(sharedRoot, editor, event);
	}

	throw new Error('Unexpected Y event type');
}

export const applyYjsEvents = (
	sharedRoot: Y.XmlText,
	editor: EngineInterface,
	events: Y.YEvent<Y.XmlText>[],
) => {
	const ops = events.reduceRight<Operation[]>((ops, event) => {
		return [...ops, ...translateYjsEvent(sharedRoot, editor, event)];
	}, []);
	editor.model.applyRemote(ops);
};
