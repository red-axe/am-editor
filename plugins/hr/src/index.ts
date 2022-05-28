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

const PARSE_HTML = 'parse:html';
const PASTE_SCHEMA = 'paste:schema';
const PASTE_EACH = 'paste:each';
const MARKDOWN_IT = 'markdown-it';
export default class<T extends HrOptions = HrOptions> extends Plugin<T> {
	static get pluginName() {
		return 'hr';
	}

	init() {
		const editor = this.editor;
		editor.on(PARSE_HTML, this.parseHtml);
		editor.on(PASTE_SCHEMA, this.pasteSchema);
		editor.on(PASTE_EACH, this.pasteHtml);
		if (isEngine(editor)) {
			editor.on(MARKDOWN_IT, this.markdownIt);
		}
	}

	execute() {
		const editor = this.editor;
		if (!isEngine(editor)) return;
		const { card } = editor;
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
		const editor = this.editor;
		if (!isEngine(editor)) return;
		if (node.name === 'hr') {
			editor.card.replaceNode(node, HrComponent.cardName);
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
		const editor = this.editor;
		editor.off(PARSE_HTML, this.parseHtml);
		editor.off(PASTE_SCHEMA, this.pasteSchema);
		editor.off(PASTE_EACH, this.pasteHtml);
		if (isEngine(editor)) {
			editor.off(MARKDOWN_IT, this.markdownIt);
		}
	}
}
export { HrComponent };
export type { HrValue };
