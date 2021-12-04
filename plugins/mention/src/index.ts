import {
	$,
	DATA_TRANSIENT_ELEMENT,
	decodeCardValue,
	isEngine,
	isSafari,
	NodeInterface,
	Plugin,
	CardEntry,
	unescape,
	PluginOptions,
	SchemaInterface,
	CARD_KEY,
	encodeCardValue,
	CardInterface,
	AjaxInterface,
	READY_CARD_KEY,
	CARD_VALUE_KEY,
} from '@aomao/engine';
import MentionComponent from './component';
import locales from './locales';
import { MentionItem } from './types';

export interface Options extends PluginOptions {
	defaultData?: Array<MentionItem>;
	onSearch?: (keyword: string) => Promise<Array<MentionItem>>;
	onSelect?: (data: {
		[key: string]: string;
	}) => void | { [key: string]: string };
	onInsert?: (card: CardInterface) => void;
	onClick?: (node: NodeInterface, data: { [key: string]: string }) => void;
	onMouseEnter?: (
		node: NodeInterface,
		data: { [key: string]: string },
	) => void;
	onRender?: (
		root: NodeInterface,
		data: MentionItem[],
		bindItem: (
			node: NodeInterface,
			data: { [key: string]: string },
		) => NodeInterface,
	) => Promise<string | NodeInterface | void>;
	onRenderItem?: (
		item: MentionItem,
		root: NodeInterface,
	) => string | NodeInterface | void;
	onLoading?: (root: NodeInterface) => string | NodeInterface | void;
	onEmpty?: (root: NodeInterface) => string | NodeInterface | void;
	spaceTrigger?: boolean;
	/**
	 * 查询地址
	 */
	action?: string;
	/**
	 * 数据返回类型，默认 json
	 */
	type?: '*' | 'json' | 'xml' | 'html' | 'text' | 'js';
	/**
	 * 额外携带数据上传
	 */
	data?: {};
	/**
	 * 请求类型，默认 multipart/form-data;
	 */
	contentType?: string;
	/**
	 * 解析上传后的Respone，返回 result:是否成功，data:成功：文件地址，失败：错误信息
	 */
	parse?: (response: any) => {
		result: boolean;
		data: Array<MentionItem>;
	};
}

class MentionPlugin extends Plugin<Options> {
	#request?: AjaxInterface;
	static get pluginName() {
		return 'mention';
	}

	init() {
		const {
			defaultData,
			onSearch,
			onSelect,
			onInsert,
			onClick,
			onMouseEnter,
			onRender,
			onRenderItem,
			onLoading,
			onEmpty,
			action,
			contentType,
			type,
			parse,
		} = this.options;
		const { request } = this.editor;
		if (defaultData) MentionComponent.defaultData = defaultData;
		if (onClick) MentionComponent.itemClick = onClick;
		if (onMouseEnter) MentionComponent.mouseEnter = onMouseEnter;
		if (onRender) MentionComponent.render = onRender;
		if (onRenderItem) MentionComponent.renderItem = onRenderItem;
		if (onLoading) MentionComponent.renderLoading = onLoading;
		if (onEmpty) MentionComponent.renderEmpty = onEmpty;
		if (onSelect) MentionComponent.onSelect = onSelect;
		if (onInsert) MentionComponent.onInsert = onInsert;
		MentionComponent.search = (keyword: string) => {
			if (onSearch) return onSearch(keyword);
			return new Promise((resolve) => {
				if (action) {
					this.#request?.abort();
					this.#request = request.ajax({
						url: action,
						contentType: contentType || '',
						type: type === undefined ? 'json' : type,
						data: {
							keyword,
						},
						success: (response: any) => {
							const { result, data } = parse
								? parse(response)
								: response;
							if (!result) return;
							resolve(data);
						},
						method: 'GET',
					});
				} else resolve([]);
			});
		};
		if (isEngine(this.editor)) {
			this.editor.on('keydown:at', (event) => this.onAt(event));
			this.editor.on('parse:value', (node) => this.paserValue(node));
			this.editor.on('parse:html', (node) => this.parseHtml(node));
			this.editor.on('paste:each', (child) => this.pasteHtml(child));
			this.editor.on('paste:schema', (schema: SchemaInterface) =>
				this.pasteSchema(schema),
			);
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

	onAt(event: KeyboardEvent) {
		if (!isEngine(this.editor)) return;
		const { change } = this.editor;
		let range = change.range.get();
		const block = this.editor.block.closest(range.startNode);
		const text = block.text().trim();
		if (text === '@' && isSafari) {
			block.empty();
		}

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

		event.preventDefault(); // 插入 @，并弹出选择器

		range = change.range.get();
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
	}

	getList() {
		const values: Array<{ [key: string]: string }> = [];
		this.editor.card.each((card) => {
			const Component = card.constructor as CardEntry;
			if (Component.cardName === MentionComponent.cardName) {
				const { key, name, ...value } =
					(card as MentionComponent).getValue() || {};
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
				const cardValue = decodeCardValue(value);
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

	parseHtml(root: NodeInterface) {
		root.find(
			`[${CARD_KEY}="${MentionComponent.cardName}"],[${READY_CARD_KEY}="${MentionComponent.cardName}"]`,
		).each((cardNode) => {
			const node = $(cardNode);
			const card = this.editor.card.find(node) as MentionComponent;
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
				node.replaceWith($(html));
			} else node.remove();
		});
	}

	execute() {}
}
export { MentionComponent };
export default MentionPlugin;
