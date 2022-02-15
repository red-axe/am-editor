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
} from '@aomao/engine';
import MentionComponent, { MentionValue } from './component';
import locales from './locales';
import { MentionOptions } from './types';

class MentionPlugin<
	T extends MentionOptions = MentionOptions,
> extends Plugin<T> {
	static get pluginName() {
		return 'mention';
	}

	init() {
		this.editor.on('parse:value', (node) => this.paserValue(node));
		this.editor.on('parse:html', (node) => this.parseHtml(node));
		this.editor.on('paste:each', (child) => this.pasteHtml(child));
		this.editor.on('paste:schema', (schema: SchemaInterface) =>
			this.pasteSchema(schema),
		);
		if (isEngine(this.editor)) {
			this.editor.on('keydown:at', (event) => this.onAt(event));
		}
		this.editor.language.add(locales);
	}

	paserValue(node: NodeInterface) {
		if (
			node.isCard() &&
			node.attributes('name') === MentionComponent.cardName
		) {
			const value = node.attributes('value');
			const cardValue = decodeCardValue(value);
			if (!cardValue || !cardValue['name']) return false;
		}
		return true;
	}
	private renderTime = Date.now();
	onAt(event: KeyboardEvent) {
		if (!isEngine(this.editor)) return;
		if (Date.now() - this.renderTime < 200) {
			return false;
		}
		const { change } = this.editor;
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
			const card = this.editor.card.insert(MentionComponent.cardName);
			card.root.attributes(DATA_TRANSIENT_ELEMENT, 'true');
			this.editor.card.activate(card.root);
			range = change.range.get();
			//选中关键词输入节点
			const keyword = card.find('.data-mention-component-keyword');
			range.select(keyword, true);
			range.collapse(false);
			change.range.select(range);
		}
		this.renderTime = Date.now();
		return false;
	}

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

	pasteSchema(schema: SchemaInterface) {
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
	}

	pasteHtml(node: NodeInterface) {
		if (!isEngine(this.editor)) return;
		if (node.isElement()) {
			const attributes = node.attributes();
			const type = attributes['data-type'];
			if (type === MentionComponent.cardName) {
				const value = attributes['data-value'];
				const cardValue = decodeCardValue<MentionValue>(value);
				if (!cardValue.name) return;
				this.editor.card.replaceNode(
					node,
					MentionComponent.cardName,
					cardValue,
				);
				node.remove();
				return false;
			}
		}
		return true;
	}

	parseHtml(
		root: NodeInterface,
		callback?: (node: NodeInterface, value: MentionValue) => NodeInterface,
	) {
		root.find(
			`[${CARD_KEY}="${MentionComponent.cardName}"],[${READY_CARD_KEY}="${MentionComponent.cardName}"]`,
		).each((cardNode) => {
			const node = $(cardNode);
			const card = this.editor.card.find<
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
				)}" style="color:#1890ff">@${value.name}</span>`;
				node.empty();
				let newNode = $(html);
				if (callback) {
					newNode = callback(newNode, value);
				}
				node.replaceWith(newNode);
			} else node.remove();
		});
	}

	execute() {}
}
export { MentionComponent };
export type { MentionValue };
export default MentionPlugin;
