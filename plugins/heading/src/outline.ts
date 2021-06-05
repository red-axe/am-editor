import { getTextNodes, CARD_KEY, getHashId } from '@aomao/engine';

export type OutlineData = {
	id: string;
	text: string;
	level: number;
	depth: number;
	domNode: Node;
};

class Outline {
	_invalidTags = {
		h1: true,
		h2: true,
		h3: true,
		h4: true,
		h5: true,
		h6: true,
	};

	_isHeadingNode(node: Element) {
		if (node.nodeType !== 1) return false;
		if (!node.tagName) return false;
		const tag = node.tagName.toLocaleLowerCase();
		return this._invalidTags[tag] === true;
	}

	/**
	 * 获取所有的 Heading 节点
	 * @param {Node} rootNode
	 * @private
	 */
	_findHeadingNodes(rootNode: Element): Array<Element> {
		// querySelectorAll 会保证返回的标题列表按文档里面的顺序排序，但由于文档中列表、表格等中有标题，故只取一级节点
		// Ref: https://www.w3.org/TR/selectors-api/#queryselectorall
		// return Array.from(rootNode.querySelectorAll('h1,h2,h3,h4'));
		const nodes = rootNode.childNodes;
		if (!nodes) return [];
		let headings: Array<Element> = [];

		for (let i = 0, l = nodes.length; i < l; i++) {
			const item = nodes[i];

			if (this._isHeadingNode(item as Element)) {
				headings.push(item as Element);
			}
		}
		return headings;
	}
	// 修订重复 id 的标题，借鉴 github 的模式：追加 -{出现顺序-1}
	_fixDuplicatedHeading(datas: Array<OutlineData>) {
		let map = {};
		datas.forEach(data => {
			const id = data.id;
			if (map.hasOwnProperty(id)) {
				const order = map[id];
				data.id += `-${order}`;
				// 修订 domId，保证能准确定位
				if (data.domNode) data.domNode['id'] = data.id;
				map[id] = order + 1;
			} else {
				map[id] = 1;
			}
		});
	}

	/**
	 * 根据标签名获取标题层级
	 *
	 * @param {string} tagName 标签名
	 * @return {number}
	 * @private
	 */
	_getLevel(tagName: string) {
		const map = {
			H1: 1,
			H2: 2,
			H3: 3,
			H4: 4,
			H5: 5,
			H6: 6,
		};
		return map[tagName] || -1;
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
	 * 将 heading 数据归一化为带深度层级的结构
	 * 归一化后，每个元素的结构为:
	 * {
	 *   id: string,       // id
	 *   title: string,    // 标题
	 *   level: number ,   // 标题层级
	 *   domNode: Node,    // dom 节点
	 *   depth: number     // 展示深度
	 * }
	 * depth 的算法和 Google Docs 的一致
	 * - 效果：h1 -> h4 分配固定的 depth，保证相同 level 的标题最终的层级深度是一样的
	 * - 算法：找出文档存在的标题层级；按层级由大到小依次分别分配缩进深度；
	 * @param {Element[]}headings heading 的标准 DOM 节点数组
	 *
	 * @return {Array} 节点数组
	 */
	normalize(headings: Array<Element>) {
		headings = headings || [];
		if (headings.length === 0) return [];
		let data: Array<OutlineData> = [];
		headings.forEach(node => {
			const text = (this.getText(node) || '').trim();
			// id 或文本为空，不纳入大纲
			if (!text) return;
			let id = node['id'];
			if (!id) {
				id = node['data-id'] || getHashId(node);
			}
			data.push({
				id,
				text,
				// 层级
				level: this._getLevel(node.tagName),
				// 深度
				depth: -1,
				// dom 节点，在后续处理中有可能用到，比如按需调整节点 id 等
				domNode: node,
			});
		});
		// 按 level 去重
		let numberList: Array<number> = [];
		data.forEach(heading => {
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
		data.forEach(item => {
			item.depth = map[item.level];
		});
		return data;
	}

	/**
	 * 从 DOM 节点提取大纲
	 * @param {Element} rootNode
	 * @return {Array}
	 */
	extractFromDom(rootNode: Element) {
		if (!rootNode) return [];
		try {
			const headings = this._findHeadingNodes(rootNode);
			const nodes = this.normalize(headings);
			// 修订重复标题
			this._fixDuplicatedHeading(nodes);
			return nodes;
		} catch (e) {
			return [];
		}
	}
}
export default Outline;
