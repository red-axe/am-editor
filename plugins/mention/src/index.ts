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
	static get pluginName() {
		return 'mention';
	}

	init() {
		const {
			defaultData,
			onSearch,
			onSelect,
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
		MentionComponent.search = (keyword: string) => {
			if (onSearch) return onSearch(keyword);
			return new Promise((resolve) => {
				if (action) {
					request.ajax({
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
			this.editor.on('paser:value', (node) => this.paserValue(node));
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
		let range = change.getRange();
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

		range = change.getRange();
		if (range.collapsed) {
			event.preventDefault();
			const card = this.editor.card.insert(MentionComponent.cardName);
			card.root.attributes(DATA_TRANSIENT_ELEMENT, 'true');
			this.editor.card.activate(card.root);
			range = change.getRange();
			//选中关键词输入节点
			const keyword = card.find('.data-mention-component-keyword');
			range.select(keyword, true);
			range.collapse(false);
			change.select(range);
		}
	}

	execute(action: string) {
		switch (action) {
			case 'getList':
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
		return;
	}
}
export { MentionComponent };
export default MentionPlugin;
