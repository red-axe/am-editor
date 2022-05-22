import {
	$,
	Plugin,
	NodeInterface,
	CARD_KEY,
	isEngine,
	SchemaInterface,
	CARD_VALUE_KEY,
	decodeCardValue,
} from '@aomao/engine';
import type MarkdownIt from 'markdown-it';
import HrComponent, { HrValue } from './component';
import { HrOptions } from './types';

export default class<T extends HrOptions = HrOptions> extends Plugin<T> {
	static get pluginName() {
		return 'hr';
	}

	init() {
		this.editor.on('parse:html', this.parseHtml);
		this.editor.on('paste:schema', this.pasteSchema);
		this.editor.on('paste:each', this.pasteHtml);
		if (isEngine(this.editor)) {
			this.editor.on('markdown-it', this.markdownIt);
		}
	}

	execute() {
		if (!isEngine(this.editor)) return;
		const { card } = this.editor;
		card.insert(HrComponent.cardName);
	}

	hotkey() {
		return this.options.hotkey || 'mod+shift+e';
	}

	markdownIt = (mardown: MarkdownIt) => {
		if (this.options.markdown !== false) {
			mardown.enable('hr');
		}
	};

	pasteSchema = (schema: SchemaInterface) => {
		schema.add([
			{
				type: 'block',
				name: 'hr',
				isVoid: true,
			},
		]);
	};

	pasteHtml = (node: NodeInterface) => {
		if (!isEngine(this.editor)) return;
		if (node.name === 'hr') {
			this.editor.card.replaceNode(node, HrComponent.cardName);
			return false;
		}
		return true;
	};

	parseHtml = (
		root: NodeInterface,
		callback?: (node: NodeInterface, value: HrValue) => NodeInterface,
	) => {
		const results: NodeInterface[] = [];
		root.find(`[${CARD_KEY}=${HrComponent.cardName}]`).each((hrNode) => {
			const node = $(hrNode);
			let hr = node.find('hr');
			hr.css({
				'background-color': '#e8e8e8',
				border: '1px solid transparent',
				margin: '18px 0',
			});
			if (callback) {
				const card = this.editor.card.find(
					node,
				) as HrComponent<HrValue>;
				const value =
					card?.getValue() ||
					decodeCardValue(node.attributes(CARD_VALUE_KEY));
				hr = callback(hr, value);
			}
			node.replaceWith(hr);
			results.push(hr);
		});
		return results;
	};

	destroy() {
		this.editor.off('parse:html', this.parseHtml);
		this.editor.off('paste:schema', this.pasteSchema);
		this.editor.off('paste:each', this.pasteHtml);
		if (isEngine(this.editor)) {
			this.editor.off('markdown-it', this.markdownIt);
		}
	}
}
export { HrComponent };
export type { HrValue };
