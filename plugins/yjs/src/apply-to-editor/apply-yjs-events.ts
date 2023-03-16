import { Element, EngineInterface, Operation } from '@aomao/engine';
import * as Y from 'yjs';
import { translateYElementEvent } from './apply-element-event';

export function translateYjsEvent(
	sharedRoot: Y.XmlElement,
	root: Element,
	event: Y.YEvent<Y.XmlElement | Y.XmlText>,
): Operation[] {
	return translateYElementEvent(sharedRoot, root, event);
}

export const applyYjsEvents = (
	sharedRoot: Y.XmlElement,
	editor: EngineInterface,
	events: Y.YEvent<Y.XmlElement>[],
) => {
	const ops = events.reduceRight<Operation[]>((ops, event) => {
		return [
			...ops,
			...translateYjsEvent(sharedRoot, editor.model.root, event),
		];
	}, []);
	editor.model.applyRemote(ops);
};
