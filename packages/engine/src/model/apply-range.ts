import { DATA_ID } from '../constants';
import Range from '../range';
import { EngineInterface, NodeInterface } from '../types';

const getSideText = (
	engine: EngineInterface,
	node: NodeInterface,
	offset: number,
) => {
	const idNode = engine.block.closest(node);
	if (idNode.length > 0) {
		const id = idNode.attributes(DATA_ID);
		const leftRange = Range.create(engine);
		const rightRange = Range.create(engine);
		leftRange.setStart(idNode[0], 0);
		leftRange.setEnd(node[0], offset);
		rightRange.setStart(node[0], offset);
		rightRange.setEnd(idNode[0], idNode[0].childNodes.length);
		return {
			id,
			leftText: leftRange.toString(),
			rightText: rightRange.toString(),
		};
	}
	return;
};

export const getRangeRemotePath = (engine: EngineInterface) => {
	try {
		if (window.getSelection()?.rangeCount === 0) return;
		const range = Range.from(engine);
		if (!range || range.inCard()) return;
		if (range.startNode.isRoot()) range.shrinkToElementNode();
		const { startNode, startOffset, endNode, endOffset } = range;
		return {
			start: getSideText(engine, startNode, startOffset),
			end: getSideText(engine, endNode, endOffset),
		};
	} catch (error: any) {
		engine.messageError('apply-remote-path', error);
		return;
	}
};

type RemoteAttr = {
	id: string;
	leftText: string;
	rightText: string;
};

type RemotePath = {
	start?: RemoteAttr;
	end?: RemoteAttr;
};

const fromRemoteAttr = (engine: EngineInterface, attr: RemoteAttr) => {
	if (!attr) return;
	const { id, leftText, rightText } = attr;
	const node = engine.container
		.get<Element>()
		?.querySelector(`[${DATA_ID}="${id}"]`);
	if (!node) return;
	const text = node.textContent || '';
	if (text === '')
		return {
			container: node,
			offset: 0,
		};
	if (text?.startsWith(leftText)) {
		let nextChild: Node | null | undefined = node.firstChild;
		let offset = leftText.length;
		while (
			nextChild &&
			(nextChild.nodeType !== 3 ||
				(nextChild.textContent?.length || 0) < offset)
		) {
			if ((nextChild.textContent?.length || 0) < offset) {
				offset -= nextChild.textContent?.length || 0;
				nextChild = nextChild.nextSibling;
			} else {
				nextChild = nextChild.firstChild;
			}
		}
		return {
			container: nextChild,
			offset,
		};
	}
	if (text?.endsWith(rightText)) {
		let offset = rightText.length;
		let prevChild: Node | null | undefined = node.lastChild;
		while (
			prevChild &&
			(prevChild.nodeType !== 3 ||
				(prevChild.textContent?.length || 0) < offset)
		) {
			if (prevChild.textContent?.length || 0 < offset) {
				offset -= prevChild?.textContent?.length || 0;
				prevChild = prevChild.previousSibling;
			} else {
				prevChild = prevChild.lastChild;
			}
		}
		return {
			container: prevChild,
			offset: prevChild?.textContent?.length || 0 - offset,
		};
	}
	let offset = 0;
	while (text[offset] === leftText[offset]) {
		offset++;
	}
	let nextChild: Node | null | undefined = node.firstChild;
	while (
		nextChild &&
		(nextChild.nodeType !== 3 ||
			(nextChild.textContent?.length || 0) < offset)
	) {
		if (nextChild.textContent?.length || 0 < offset) {
			offset -= nextChild.textContent?.length || 0;
			nextChild = nextChild.nextSibling;
		} else {
			nextChild = nextChild.firstChild;
		}
	}
	return {
		container: nextChild,
		offset,
	};
};

export const applyRangeByRemotePath = (
	engine: EngineInterface,
	path: RemotePath,
	callback?: () => void,
) => {
	try {
		const selection = window.getSelection();
		const range = selection
			? Range.from(engine, selection)?.cloneRange()
			: undefined;
		if (!range) return;
		const { start, end } = path;

		let startInfo;
		let endInfo;
		if (start) startInfo = fromRemoteAttr(engine, start);
		if (end) endInfo = fromRemoteAttr(engine, end);

		if (startInfo && startInfo.container) {
			range.setStart(startInfo.container, startInfo.offset);
		}
		if (endInfo && endInfo.container) {
			range.setEnd(endInfo.container, endInfo.offset);
		}
		engine.change.range.select(range, false);
		callback?.();
	} catch (error: any) {
		engine.messageError('apply-remote-path', error);
	}
};
