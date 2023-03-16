import * as Y from 'yjs';
import { Element, Node, Text } from '@aomao/engine';
import { DeltaInsert, InsertDelta } from './types';
import { getProperties } from './editable';

export function yTextToEditorText<T extends Text>(yText: Y.XmlText): T {
	return { text: yText.toString() } as T;
}

export function yElementToEditorElement<T extends Element>(
	yElement: Y.XmlElement,
): T {
	const attributes = yElement.getAttributes();
	const yChildrenToEditorChildren = (yElement: Y.XmlElement) => {
		const children: Node[] = [];
		for (let i = 0; i < yElement.length; i++) {
			const child = yElement.get(i);
			if (child instanceof Y.XmlText) {
				children.push(yTextToEditorText(child));
			} else {
				children.push(yElementToEditorElement(child));
			}
		}
		return children;
	};
	const type = yElement.nodeName;
	return {
		type,
		...attributes,
		children: yChildrenToEditorChildren(yElement),
	} as T;
}

export function deltaInsertToEditorNode<T extends Node>(
	insert: Omit<DeltaInsert, 'insert'> & {
		insert: Y.XmlText | Y.XmlElement | string;
	},
): T {
	if (typeof insert.insert === 'string') {
		return { ...insert.attributes, text: insert.insert } as T;
	} else if (insert.insert instanceof Y.XmlText) {
		return yTextToEditorText(insert.insert) as T;
	}
	return yElementToEditorElement(insert.insert) as T;
}

export function deltaXmlInsertToEditorNode<T extends Node>(
	insert: DeltaInsert,
): T[] {
	const datas = Array.isArray(insert.insert)
		? insert.insert
		: [insert.insert];
	return datas.map((node) =>
		deltaInsertToEditorNode({ ...insert, insert: node }),
	);
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

export function editorNodeToYNode(node: Node) {
	if (Text.isText(node)) {
		return editorTextToYText(node);
	}

	return editorElementToYElement(node);
}

export * from './editable';

export * from './delta';

export * from './yjs';

export * from './object';

export * from './types';

export * from './clone';

export * from './location';
