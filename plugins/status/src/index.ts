import {
	$,
	Plugin,
	NodeInterface,
	CARD_KEY,
	isEngine,
	PluginOptions,
	SchemaInterface,
	encodeCardValue,
	decodeCardValue,
	CARD_VALUE_KEY,
	READY_CARD_KEY,
} from '@aomao/engine';
import StatusComponent, { StatusValue } from './components';
import locales from './locales';
import { StatusOptions } from './types';

const PARSE_HTML = 'parse:html';
const PASTE_EACH = 'paste:each';
const PASTE_SCHEMA = 'paste:schema';

export default class<
	T extends StatusOptions = StatusOptions,
> extends Plugin<T> {
	static get pluginName() {
		return 'status';
	}

	init() {
		const editor = this.editor;
		editor.language.add(locales);
		editor.on(PARSE_HTML, this.parseHtml);
		editor.on(PASTE_EACH, this.pasteHtml);
		editor.on(PASTE_SCHEMA, this.pasteSchema);
	}

	execute() {
		const editor = this.editor;
		if (!isEngine(editor)) return;
		const { card } = editor;
		const component = card.insert<
			StatusValue,
			StatusComponent<StatusValue>
		>(StatusComponent.cardName);
		card.activate(component.root);
		setTimeout(() => {
			component.focusEditor();
		}, 50);
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
					value: StatusComponent.cardName,
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
			if (type && type === StatusComponent.cardName) {
				const value = attributes['data-value'];
				const cardValue = decodeCardValue<StatusValue>(value);
				editor.card.replaceNode(
					node,
					StatusComponent.cardName,
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
		callback?: (node: NodeInterface, value: StatusValue) => NodeInterface,
	) => {
		const editor = this.editor;
		const results: NodeInterface[] = [];
		root.find(
			`[${CARD_KEY}="${StatusComponent.cardName}"],[${READY_CARD_KEY}="${StatusComponent.cardName}"]`,
		).each((statusNode) => {
			const node = $(statusNode);
			const card = editor.card.find<StatusValue>(node);
			const value =
				card?.getValue() ||
				decodeCardValue(node.attributes(CARD_VALUE_KEY));
			if (value?.text) {
				const html = `<span data-type="${
					StatusComponent.cardName
				}" data-value="${encodeCardValue(value)}"></span>`;
				const marks = value.marks || [];
				const rootWrapNode = $(`<div>${value.text}</div>`);
				let wrapNode = rootWrapNode.first()!;
				marks.forEach((mark) => {
					const outerNode = $(mark);
					wrapNode = editor.node.wrap(wrapNode, outerNode);
				});
				node.empty();
				let newNode = $(html);
				newNode.append(wrapNode);
				newNode.css({
					'font-weight': 400,
					overflow: 'hidden',
					'max-width': '200px',
					'white-space': 'nowrap',
					'border-radius': '4px',
					border: '2px solid transparent',
					padding: '0 3px',
					'text-overflow': 'ellipsis',
				});
				if (callback) {
					newNode = callback(newNode, value);
				}
				node.replaceWith(newNode);
				results.push(newNode);
			} else node.remove();
		});
		return results;
	};

	destroy() {
		const editor = this.editor;
		editor.off(PARSE_HTML, this.parseHtml);
		editor.off(PASTE_EACH, this.pasteHtml);
		editor.off(PASTE_SCHEMA, this.pasteSchema);
	}
}
export { StatusComponent };
export type { StatusValue };
