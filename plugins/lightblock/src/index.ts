import {
	$,
	Plugin,
	NodeInterface,
	CARD_KEY,
	isEngine,
	SchemaInterface,
	PluginOptions,
	decodeCardValue,
	encodeCardValue,
	READY_CARD_KEY,
} from '@aomao/engine';
import locales from './locale';
import LightblockComponent from './component';
import type { LightblockValue } from './component';

export interface LightblockOptions extends PluginOptions {}

export default class extends Plugin<LightblockOptions> {
	static get pluginName() {
		return 'lightblock';
	}
	init() {
		const editor = this.editor;

		editor.language.add(locales);
		editor.on('parse:html', this.parseHtml);
		editor.on('paste:schema', this.pasteSchema);
		editor.on('paste:each', this.pasteHtml);
	}

	execute() {
		const editor = this.editor;

		if (!isEngine(editor) || editor.readonly) return;
		const { card } = editor;

		card.insert<LightblockValue>(LightblockComponent.cardName, {
			borderColor: '#fed4a4',
			backgroundColor: '#fff5eb',
			text: 'light-block',
		});
	}

	pasteSchema = (schema: SchemaInterface) => {
		schema.add({
			type: 'block',
			name: 'div',
			attributes: {
				'data-type': {
					required: true,
					value: LightblockComponent.cardName,
				},
				'data-value': '*',
			},
		});
	};

	pasteHtml = (node: NodeInterface) => {
		const editor = this.editor;
		const cardName = LightblockComponent.cardName;

		if (!isEngine(editor) || editor.readonly) return;
		if (node.isElement()) {
			const type = node.attributes('data-type');
			if (type === cardName) {
				const value = node.attributes('data-value');
				const cardValue = decodeCardValue(value);
				editor.card.replaceNode(node, cardName, cardValue);
				node.remove();
				return false;
			}
		}
		return true;
	};

	parseHtml = (root: NodeInterface) => {
		const cardName = LightblockComponent.cardName;

		root.find(
			`[${CARD_KEY}="${cardName}"],[${READY_CARD_KEY}="${cardName}"]`,
		).each((cardNode) => {
			const node = $(cardNode);
			const card = this.editor.card.find<
				LightblockValue,
				LightblockComponent
			>(node);
			const value = card?.getValue();
			if (value) {
				node.empty();
				const div = this.renderHtml(value, cardName);
				node.replaceWith(div);
			} else node.remove();
		});
	};

	renderHtml = (value: LightblockValue, cardName: string) => {
		const htmlstring = value.text;
		return $(
			`<div data-type="${cardName}" data-value="${encodeCardValue(
				value,
			)}">${htmlstring}</div>`,
		);
	};

	destroy() {
		const editor = this.editor;

		editor.off('parse:html', this.parseHtml);
		editor.off('paste:schema', this.pasteSchema);
		editor.off('paste:each', this.pasteHtml);
	}
}
export { LightblockComponent };
export type { LightblockValue };
