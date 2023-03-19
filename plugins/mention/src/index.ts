import {
	$,
	DATA_TRANSIENT_ELEMENT,
	decodeCardValue,
	isEngine,
	NodeInterface,
	Plugin,
	unescape,
	SchemaInterface,
	CARD_KEY,
	encodeCardValue,
	READY_CARD_KEY,
	CARD_VALUE_KEY,
	Element,
	Node,
} from '@aomao/engine';
import MentionComponent, { MentionValue } from './component';
import locales from './locales';
import { MentionOptions } from './types';

const PARSER_VALUE = 'parse:value';
const PARSER_NODE = 'parse:node';
const PARSER_HTML = 'parse:html';
const PASTE_SCHEMA = 'paste:schema';
const PASTE_EACH = 'paste:each';
const KEYDOWN_AT = 'keydown:at';

class MentionPlugin<
	T extends MentionOptions = MentionOptions,
> extends Plugin<T> {
	static get pluginName() {
		return 'mention';
	}

	init() {
		const editor = this.editor;
		editor.on(PARSER_VALUE, this.paserValue);
		editor.on(PARSER_NODE, this.paserNode);
		editor.on(PARSER_HTML, this.parseHtml);
		editor.on(PASTE_EACH, this.pasteHtml);
		editor.on(PASTE_SCHEMA, this.pasteSchema);
		if (isEngine(editor)) {
			editor.on(KEYDOWN_AT, this.onAt);
		}
		editor.language.add(locales);
	}

	paserValue = (node: NodeInterface) => {
		if (
			node.isCard() &&
			node.attributes('name') === MentionComponent.cardName
		) {
			const value = node.attributes('value');
			const cardValue = decodeCardValue(value);
			if (!cardValue || !cardValue['name']) return false;
		}
		return true;
	};
	paserNode = (node: Node) => {
		if (
			Element.isElement(node) &&
			node[CARD_KEY] === MentionComponent.cardName
		) {
			const value = node[CARD_VALUE_KEY];
			const cardValue = decodeCardValue(value);
			if (!cardValue || !cardValue['name']) return false;
		}
		return true;
	};
	private renderTime = Date.now();
	onAt = (event: KeyboardEvent) => {
		const editor = this.editor;
		if (!isEngine(editor)) return;
		if (Date.now() - this.renderTime < 200) {
			return false;
		}
		const { change } = editor;
		let range = change.range.get();
		// 空格触发
		if (this.options.spaceTrigger) {
			const selection = range.createSelection();
			if (selection.anchor) {
				const prevNode = $(selection.anchor).prev();
				const prevText =
					prevNode && prevNode.isText() ? prevNode[0].nodeValue : '';
				selection.move();
				// 前面有非空格文本时，应该要输入普通 at 字符
				if (prevText && /[^\s@]$/.test(prevText)) {
					return;
				}
			}
		}

		event.preventDefault();
		// 插入 @，并弹出选择器
		if (range.collapsed) {
			event.preventDefault();
			const card = editor.card.insert(MentionComponent.cardName);
			card.root.attributes(DATA_TRANSIENT_ELEMENT, 'true');
			editor.card.activate(card.root);
			range = change.range.get();
			//选中关键词输入节点
			const keyword = card.find('.data-mention-component-keyword');
			range.select(keyword, true);
			range.collapse(false);
			change.range.select(range);
		}
		this.renderTime = Date.now();
		return false;
	};

	getList() {
		const values: Array<MentionValue> = [];
		this.editor.card.each((card) => {
			if (card.name === MentionComponent.cardName) {
				const { key, name, ...value } =
					(card as MentionComponent<MentionValue>).getValue() || {};
				if (name && key)
					values.push({
						key: unescape(key),
						name: unescape(name),
						...value,
					});
			}
		});
		return values;
	}

	pasteSchema = (schema: SchemaInterface) => {
		schema.add({
			type: 'inline',
			name: 'span',
			attributes: {
				'data-type': {
					required: true,
					value: MentionComponent.cardName,
				},
				'data-value': '*',
			},
		});
	};

	pasteHtml = (node: NodeInterface) => {
		const editor = this.editor;
		if (!isEngine(editor)) return;
		if (node.isElement()) {
			const attributes = node.attributes();
			const type = attributes['data-type'];
			if (type && type === MentionComponent.cardName) {
				const value = attributes['data-value'];
				const cardValue = decodeCardValue<MentionValue>(value);
				if (!cardValue.name) return;
				editor.card.replaceNode(
					node,
					MentionComponent.cardName,
					cardValue,
				);
				node.remove();
				return false;
			}
		}
		return true;
	};

	parseHtml = (
		root: NodeInterface,
		callback?: (node: NodeInterface, value: MentionValue) => NodeInterface,
	) => {
		const editor = this.editor;
		const results: NodeInterface[] = [];
		root.find(
			`[${CARD_KEY}="${MentionComponent.cardName}"],[${READY_CARD_KEY}="${MentionComponent.cardName}"]`,
		).each((cardNode) => {
			const node = $(cardNode);
			const card = editor.card.find<
				MentionValue,
				MentionComponent<MentionValue>
			>(node);
			const value =
				card?.getValue() ||
				decodeCardValue(node.attributes(CARD_VALUE_KEY));
			if (value?.id && value.name) {
				const html = `<span data-type="${
					MentionComponent.cardName
				}" data-value="${encodeCardValue(
					value,
				)}" style="color:#1890ff"></span>`;
				const marks = value.marks || [];
				const rootWrapNode = $(`<div>@${value.name}</div>`);
				let wrapNode = rootWrapNode.first()!;
				marks.forEach((mark) => {
					const outerNode = $(mark);
					wrapNode = editor.node.wrap(wrapNode, outerNode);
				});
				node.empty();
				let newNode = $(html);
				newNode.append(wrapNode);
				if (callback) {
					newNode = callback(newNode, value);
				}
				node.replaceWith(newNode);
				results.push(newNode);
			} else node.remove();
		});
		return results;
	};

	execute() {}

	destroy() {
		const editor = this.editor;
		editor.off(PARSER_VALUE, this.paserValue);
		editor.off(PARSER_NODE, this.paserNode);
		editor.off(PARSER_HTML, this.parseHtml);
		editor.off(PASTE_EACH, this.pasteHtml);
		editor.off(PASTE_SCHEMA, this.pasteSchema);
		if (isEngine(editor)) {
			editor.off(KEYDOWN_AT, this.onAt);
		}
	}
}
export { MentionComponent };
export type { MentionValue, MentionOptions };
export default MentionPlugin;
