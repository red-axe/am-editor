import hashId from './hash';
import {
	EditorInterface,
	NodeIdInterface,
	NodeInterface,
	SchemaInterface,
	SchemaRule,
} from '../types';
import $ from './query';
import {
	CARD_SELECTOR,
	DATA_ELEMENT,
	DATA_ID,
	UI,
	UI_SELECTOR,
} from '../constants';
import { getParentInRoot } from '../utils';
import { isNode, isNodeEntry } from './utils';

class NodeId implements NodeIdInterface {
	schema: SchemaInterface;
	#rules: { [key: string]: SchemaRule[] } = {};
	constructor(editor: SchemaInterface) {
		this.schema = editor;
	}

	init() {
		this.#rules = this.getRules();
	}

	/**
	 * 根据规则获取需要为节点创建 data-id 的标签名称集合
	 * @returns
	 */
	getRules() {
		const rules: { [key: string]: SchemaRule[] } = {};
		// const { blocks, inlines, marks } = this.editor.schema.data;
		this.schema.data.blocks.forEach((schema) => {
			if (!rules[schema.name]) {
				rules[schema.name] = [];
			}
			rules[schema.name].push(schema);
		});
		return rules;
	}

	/**
	 * 给节点创建data-id
	 * @param node 节点
	 * @returns
	 */
	create(node: Node | NodeInterface) {
		if (isNode(node)) node = $(node);
		const id = hashId(node);
		node.attributes(DATA_ID, id);
		return id;
	}

	/**
	 * 在根节点内为需要创建data-id的子节点创建data-id
	 * @param root 根节点
	 */
	generateAll(
		root: Element | NodeInterface | DocumentFragment,
		force: boolean = false,
	) {
		const rules = this.#rules;
		const tagNames = Object.keys(rules).join(',');
		if (isNodeEntry(root) && root.fragment) {
			root = root.fragment;
		}
		const node = isNode(root) ? root : root.get<Node>();
		if (!node || node.nodeType === Node.TEXT_NODE) return;
		const rootElement = isNode(root) ? root : root.get<HTMLElement>();
		const nodes = rootElement?.querySelectorAll(tagNames);
		const generate = (element: Element) => {
			// 有ID不再生成
			if (!force && element.getAttribute(DATA_ID)) return;

			this.generate(element, force);
		};
		if (
			rootElement instanceof Element &&
			tagNames.includes(rootElement.nodeName.toLowerCase())
		) {
			generate(rootElement);
		}
		nodes?.forEach(generate);
	}
	/**
	 * 为节点创建一个随机data-id
	 * @param node 节点
	 * @param isCreate 如果有，是否需要重新创建
	 * @returns
	 */
	generate(node: Node | NodeInterface, force: boolean = false) {
		if (isNode(node)) node = $(node);
		if (node.isText()) return;
		const rules = this.#rules;
		// 不符合规则
		const nodeRules = rules[node.name];
		if (
			!nodeRules ||
			nodeRules.length === 0 ||
			!nodeRules.some((rule) =>
				this.schema.checkNode(node as NodeInterface, rule.attributes),
			)
		) {
			return;
		}
		// 检测节点是否再ui或者不可编辑卡片内
		const closestNode = node.closest(
			`${CARD_SELECTOR},${UI_SELECTOR}`,
			getParentInRoot,
		);
		// ui 节点内
		if (
			closestNode.length > 0 &&
			closestNode.attributes(DATA_ELEMENT) === UI
		) {
			return;
		}
		// 卡片内
		if (
			!node.isCard() &&
			closestNode.length > 0 &&
			closestNode.isCard() &&
			!closestNode.isEditableCard()
		) {
			return;
		}
		if (!force) {
			const id = node.attributes(DATA_ID);
			if (id) return id;
		}
		return this.create(node);
	}
	/**
	 * 判断一个节点是否需要创建data-id
	 * @param name 节点名称
	 * @returns
	 */
	isNeed(node: NodeInterface) {
		const rules = this.#rules;
		// 不符合规则
		const nodeRules = rules[node.name];
		if (
			!nodeRules ||
			nodeRules.length === 0 ||
			!nodeRules.some((rule) =>
				this.schema.checkNode(node as NodeInterface, rule.attributes),
			)
		) {
			return false;
		}
		return true;
	}
}
export default NodeId;
