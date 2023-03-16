import { Element, Node, Operation, Path, Text } from '@aomao/engine';
import {
	deepEquals,
	getProperties,
	pick,
	getEditorNodeYLength,
	getEditorPath,
	yOffsetToEditorOffsets,
	deltaXmlInsertToEditorNode,
} from '../transform';
import * as Y from 'yjs';
import { Delta } from '../types';

function applyDelta(node: Node, editorPath: Path, delta: Delta): Operation[] {
	const ops: Operation[] = [];

	let yOffset = delta.reduce((length, change) => {
		if ('retain' in change) {
			return length + change.retain;
		}

		if ('delete' in change) {
			return length + change.delete;
		}

		return length;
	}, 0);

	// Apply changes in reverse order to avoid path changes.
	const changes = delta.reverse();
	for (const change of changes) {
		if (
			'attributes' in change &&
			'retain' in change &&
			Element.isElement(node)
		) {
			const [startPathOffset] = yOffsetToEditorOffsets(
				node,
				yOffset - change.retain,
			);
			const [endPathOffset] = yOffsetToEditorOffsets(node, yOffset, {
				assoc: -1,
			});

			for (
				let pathOffset = endPathOffset;
				pathOffset >= startPathOffset;
				pathOffset--
			) {
				const childPath = [...editorPath, pathOffset];

				const newProperties = change.attributes;
				const properties = pick(
					node,
					...(Object.keys(change.attributes) as Array<keyof Element>),
				);

				ops.push({
					type: 'set_node',
					newProperties,
					path: childPath,
					properties,
				});
			}
		}

		if ('retain' in change) {
			yOffset -= change.retain;
		}

		if ('delete' in change) {
			const offset = yOffset - change.delete;
			if (Text.isText(node)) {
				ops.push({
					type: 'remove_text',
					offset: offset,
					text: node.text.slice(offset, yOffset),
					path: editorPath,
				});
			} else {
				for (let i = change.delete - 1; i >= 0; i--) {
					ops.push({
						type: 'remove_node',
						node: node.children[offset + i],
						path: editorPath.concat(offset + i),
					});
				}
			}

			yOffset -= change.delete;
			continue;
		}

		if ('insert' in change) {
			if (Text.isText(node)) {
				if (typeof change.insert === 'string') {
					ops.push({
						type: 'insert_text',
						offset: yOffset,
						text: change.insert,
						path: editorPath,
					});
				}
				continue;
			}
			const toInsert = deltaXmlInsertToEditorNode(change);
			toInsert.forEach((node, index) => {
				const path = [...editorPath, yOffset + index];
				ops.push({
					type: 'insert_node',
					path,
					node,
				});
			});
		}
	}

	return ops;
}

export function translateYElementEvent(
	sharedRoot: Y.XmlElement,
	root: Element,
	event: Y.YEvent<Y.XmlElement | Y.XmlText>,
): Operation[] {
	const { target, changes } = event;
	const delta = event.delta as Delta;

	const ops: Operation[] = [];
	const editorPath = getEditorPath(sharedRoot, target);
	const targetNode = Node.get(root, editorPath);

	const keyChanges = Array.from(changes.keys.entries());
	if (editorPath.length > 0 && keyChanges.length > 0) {
		const newProperties = Object.fromEntries(
			keyChanges.map(([key, info]) => [
				key,
				info.action === 'delete' ? null : target.getAttribute(key),
			]),
		);

		const properties = Object.fromEntries(
			keyChanges.map(([key]) => [key, (targetNode as any)[key]]),
		);

		ops.push({
			type: 'set_node',
			newProperties,
			properties,
			path: editorPath,
		});
	}

	if (delta.length > 0) {
		ops.push(...applyDelta(targetNode, editorPath, delta));
	}

	return ops;
}
