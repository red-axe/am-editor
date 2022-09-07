import {
	$,
	CARD_KEY,
	READY_CARD_KEY,
	isEngine,
	Plugin,
	SchemaInterface,
	NodeInterface,
	PluginOptions,
	decodeCardValue,
	encodeCardValue,
} from '@aomao/engine';
import locales from './local';
import { TagValue } from './component/type';
import TagComponent from './component/index';
import { defaultValue } from './component/tag';
import './component/style.css';

export interface Options extends PluginOptions {
	hotkey?: string | Array<string>;
}

export default class extends Plugin<Options> {
	static get pluginName() {
		return 'tag';
	}

	init() {
		const { editor } = this;
		editor.language.add(locales);
		editor.on('parse:html', this.parseHtml);
		editor.on('paste:schema', this.pasteSchema);
		editor.on('paste:each', this.pasteHtml);
	}

	execute() {
		const { editor } = this;
		if (!isEngine(editor) || editor.readonly) {
			return;
		}
		const { card } = editor;
		card.insert<TagValue>(
			TagComponent.cardName,
			{
				tagType: '',
				tagValue: '',
				isCustom: false,
			},
			true,
		);
	}

	hotkey() {
		return this.options.hotkey || '';
	}

	pasteSchema = (schema: SchemaInterface) => {
		schema.add({
			type: 'inline',
			name: 'span',
			attributes: {
				'data-type': {
					required: true,
					value: TagComponent.cardName,
				},
				'data-value': '*',
			},
		});
	};
	pasteHtml = (node: NodeInterface) => {
		const { editor } = this;

		if (!isEngine(editor) || editor.readonly) {
			return;
		}

		if (node.isElement()) {
			const type = node.attributes('data-type');
			if (type === TagComponent.cardName) {
				const value = node.attributes('data-value');
				const cardValue = decodeCardValue(value);
				editor.card.replaceNode(node, TagComponent.cardName, cardValue);
				node.remove();
				return false;
			}
		}
		return true;
	};
	parseHtml = (root: NodeInterface) => {
		const name = TagComponent.cardName;

		root.find(`[${CARD_KEY}="${name}"],[${READY_CARD_KEY}="${name}"]`).each(
			(cardNode) => {
				const node = $(cardNode);
				const card = this.editor.card.find<TagValue, TagComponent>(
					node,
				);
				const value = card?.getValue();
				if (value) {
					node.empty();

					const hideClass = value.tagValue ? '' : 'qz-tag-hide';
					const data =
						defaultValue.find(
							(item) => item.type === value.tagType,
						) || defaultValue[0];

					const span = $(
						`<span data-type="${name}"` +
							`data-value="${encodeCardValue(value)}"` +
							`class="${hideClass} qz-tag-view qz-tag-type-${value.tagType}" ` +
							`style="color:${data.color};background:${data.background};"` +
							`>${
								value.isCustom
									? value.tagValue || '请添加标签'
									: data.text
							}</div>`,
					);
					node.replaceWith(span);
				} else {
					node.remove();
				}
			},
		);
	};

	destroy() {
		const { editor } = this;
		editor.off('parse:html', this.parseHtml);
		editor.off('paste:schema', this.pasteSchema);
		editor.off('paste:each', this.pasteHtml);
	}
}

export { TagComponent };
export type { TagValue };
