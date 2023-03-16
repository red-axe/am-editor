import { Element, Node, Path, Text } from '@aomao/engine';
import * as Y from 'yjs';
import { sliceInsertDelta, yTextToInsertDelta } from './delta';
import { YTarget } from './types';

export function getEditorNodeYLength(node: Node | undefined): number {
	if (!node) {
		return 0;
	}

	return Text.isText(node) ? node.text.length : 1;
}

export function editorPathOffsetToYOffset(
	element: Element,
	pathOffset: number,
) {
	return element.children
		.slice(0, pathOffset)
		.reduce((yOffset, node) => yOffset + getEditorNodeYLength(node), 0);
}

export function getYTarget(
	yRoot: Y.XmlElement,
	editorRoot: Node,
	path: Path,
): YTarget {
	if (path.length === 0) {
		throw new Error('Path has to a have a length >= 1');
	}

	if (Text.isText(editorRoot)) {
		throw new Error('Cannot descent into editor text');
	}

	const [pathOffset, ...childPath] = path;

	const targetNode = editorRoot.children[pathOffset];

	const yTarget = yRoot.get(pathOffset);
	if (childPath.length > 0) {
		if (yTarget instanceof Y.XmlText) {
			throw new Error('Cannot descent into Yjs text');
		}
		return getYTarget(yTarget, targetNode, childPath);
	}

	return {
		yParent: yRoot,
		yTarget:
			yTarget instanceof Y.XmlText || yTarget instanceof Y.XmlElement
				? yTarget
				: undefined,
		yOffset: pathOffset,
		editorParent: editorRoot,
		editorTarget: targetNode,
	};
}

export function yOffsetToEditorOffsets(
	parent: Element,
	yOffset: number,
	opts: { assoc?: number; insert?: boolean } = {},
): [number, number] {
	const { assoc = 0, insert = false } = opts;

	let currentOffset = 0;
	let lastNonEmptyPathOffset = 0;
	for (
		let pathOffset = 0;
		pathOffset < parent.children.length;
		pathOffset++
	) {
		const child = parent.children[pathOffset];
		const nodeLength = Text.isText(child) ? child.text.length : 1;

		if (nodeLength > 0) {
			lastNonEmptyPathOffset = pathOffset;
		}

		const endOffset = currentOffset + nodeLength;
		if (
			nodeLength > 0 &&
			(assoc >= 0 ? endOffset > yOffset : endOffset >= yOffset)
		) {
			return [pathOffset, yOffset - currentOffset];
		}

		currentOffset += nodeLength;
	}

	if (yOffset > currentOffset + (insert ? 1 : 0)) {
		throw new Error('yOffset out of bounds');
	}

	if (insert) {
		return [parent.children.length, 0];
	}

	const child = parent.children[lastNonEmptyPathOffset];
	const textOffset = Text.isText(child) ? child.text.length : 1;
	return [lastNonEmptyPathOffset, textOffset];
}

export function getEditorPath(
	sharedRoot: Y.XmlElement,
	yTarget: Y.XmlText | Y.XmlElement,
): Path {
	const yNodePath = [yTarget];
	while (yNodePath[0] !== sharedRoot) {
		const { parent: yParent } = yNodePath[0];

		if (!yParent) {
			throw new Error("yText isn't a descendant of root element");
		}

		if (!(yParent instanceof Y.XmlElement)) {
			throw new Error('Unexpected y parent type');
		}

		yNodePath.unshift(yParent);
	}

	if (yNodePath.length < 2) {
		return [];
	}

	return yNodePath.reduce<Path>((path, yParent, idx) => {
		const yChild = yNodePath[idx + 1];
		if (!yChild) {
			return path;
		}
		if (yParent instanceof Y.XmlElement) {
			for (let i = 0; i < yParent.length; i++) {
				if (yParent.get(i) === yChild) {
					return path.concat(i);
				}
			}
		}
		return path;
	}, []);
}
