import { isPlainObject, omit } from './object';
import * as Y from 'yjs';

export interface Element {
	type: string;
	children: Node[];
}

export interface Text {
	text: string;
}

export const Text = {
	isText(value: any): value is Text {
		return isPlainObject(value) && typeof value.text === 'string';
	},
};

export type Node = Text | Element;

export type DeltaInsert = {
	insert: string | Y.XmlText;
	attributes?: Record<string, unknown>;
};

export type InsertDelta = Array<DeltaInsert>;

export function getProperties<TNode extends Node>(
	node: TNode,
): Omit<TNode, TNode extends Text ? 'text' : 'children'> {
	return omit(
		node,
		(Text.isText(node) ? 'text' : 'children') as keyof TNode,
	) as Omit<TNode, TNode extends Text ? 'text' : 'children'>;
}

export function editorNodesToInsertDelta<T extends Node>(
	nodes: T[],
): InsertDelta {
	return nodes.map((node) => {
		if (Text.isText(node)) {
			return { insert: node.text, attributes: getProperties(node) };
		}

		return { insert: editorElementToYText(node) };
	});
}

export function editorElementToYText<T extends Element>({
	children,
	...attributes
}: T): Y.XmlText {
	const yElement = new Y.XmlText();

	Object.entries(attributes).forEach(([key, value]) => {
		yElement.setAttribute(key, value);
	});

	yElement.applyDelta(editorNodesToInsertDelta(children), {
		sanitize: false,
	});
	return yElement;
}

export function editorTextToYText<T extends Text>({
	text,
	...attributes
}: T): Y.XmlText {
	const yText = new Y.XmlText();

	Object.entries(attributes).forEach(([key, value]) => {
		yText.setAttribute(key, value);
	});

	yText.insert(0, text);
	return yText;
}

const childrenToYElementChildren = (children: Node[]) => {
	const yElementChildren: (Y.XmlElement | Y.XmlText)[] = [];
	for (let i = 0; i < children.length; i++) {
		const child = children[i];
		if (Text.isText(child)) {
			yElementChildren.push(editorTextToYText(child));
		} else {
			yElementChildren.push(editorElementToYElement(child));
		}
	}
	return yElementChildren;
};

export function editorElementToYElement<T extends Element>({
	children,
	type,
	...attributes
}: T): Y.XmlElement {
	const yElement = new Y.XmlElement(type);

	Object.entries(attributes).forEach(([key, value]) => {
		yElement.setAttribute(key, String(value));
	});

	yElement.insert(0, childrenToYElementChildren(children));
	return yElement;
}
