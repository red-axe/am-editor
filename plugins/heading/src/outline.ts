import {
	getTextNodes,
	CARD_KEY,
	DATA_ID,
	NodeInterface,
	$,
	isNodeEntry,
} from '@aomao/engine';

export type OutlineData = {
	id: string;
	text: string;
	level: number;
	depth: number;
	node: Node;
};

class Outline {
	headingTags = {
		h1: true,
		h2: true,
		h3: true,
		h4: true,
		h5: true,
		h6: true,
	};

	/**
	 * 获取所有的一级 Heading 节点
	 * @param {Node} root 根节点
	 * @private
	 */
	getHeadings(
		root: Element | NodeInterface,
		filter: { [key: string]: boolean } = this.headingTags,
	): Array<Element> {
		if (!isNodeEntry(root)) root = $(root);
		const children = root.children();
		if (!children) return [];
		let headings: Array<Element> = [];
		children.each((child) => {
			if (!filter[child.nodeName.toLowerCase()]) return;
			headings.push(child as Element);
		});
		return headings;
	}

	getText(element: Node) {
		const nodes = getTextNodes(element, (node: Node) => {
			return !!!(node as Element).getAttribute(CARD_KEY);
		});
		let text = '';
		nodes.forEach((node: Node) => {
			text += node.textContent;
		});
		return text;
	}
	/**
	 * 按照标题深度整理大纲
	 * @param headings 标题节点集合
	 * @returns
	 */
	normalize(headings: Array<Element>): Array<any> {
		headings = headings || [];
		if (headings.length === 0) return [];
		let data: Array<OutlineData> = [];
		headings.forEach((node) => {
			const text = (this.getText(node) || '').trim();
			const id = node['id'] || node[DATA_ID];
			// id 或文本为空，不纳入大纲
			if (!text || !id) return;

			data.push({
				id,
				text,
				// 层级
				level: parseInt(node.tagName.substr(1)),
				// 深度
				depth: -1,
				// dom 节点，在后续处理中有可能用到，比如按需调整节点 id 等
				node,
			});
		});
		// 按 level 去重
		let numberList: Array<number> = [];
		data.forEach((heading) => {
			if (numberList.indexOf(heading.level) < 0) {
				numberList.push(heading.level);
			}
		});
		// 对出现的 level 进行排序
		numberList.sort();
		// 构造 level -> depth 的 map
		let map = {};
		numberList.forEach((item, index) => {
			map[item] = index + 1;
		});
		// 追加 depth
		data.forEach((item) => {
			item.depth = map[item.level];
		});
		return data;
	}

	/**
	 * 从 DOM 节点提取大纲
	 * @param {Element} root
	 * @return {Array}
	 */
	getFromDom(
		root: Element | NodeInterface,
		filter: { [key: string]: boolean } = this.headingTags,
	): Array<any> {
		try {
			const headings = this.getHeadings(root, filter);
			const nodes = this.normalize(headings);
			return nodes;
		} catch (e) {
			return [];
		}
	}
}
export default Outline;
