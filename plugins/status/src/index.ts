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

export default class<
	T extends StatusOptions = StatusOptions,
> extends Plugin<T> {
	static get pluginName() {
		return 'status';
	}

	init() {
		this.editor.language.add(locales);
		this.editor.on('parse:html', this.parseHtml);
		this.editor.on('paste:each', this.pasteHtml);
		this.editor.on('paste:schema', this.pasteSchema);
	}

	execute() {
		if (!isEngine(this.editor)) return;
		const { card } = this.editor;
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
		if (!isEngine(this.editor)) return;
		if (node.isElement()) {
			const attributes = node.attributes();
			const type = attributes['data-type'];
			if (type === StatusComponent.cardName) {
				const value = attributes['data-value'];
				const cardValue = decodeCardValue<StatusValue>(value);
				this.editor.card.replaceNode(
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
		const results: NodeInterface[] = [];
		root.find(
			`[${CARD_KEY}="${StatusComponent.cardName}"],[${READY_CARD_KEY}="${StatusComponent.cardName}"]`,
		).each((statusNode) => {
			const node = $(statusNode);
			const card = this.editor.card.find<StatusValue>(node);
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
					wrapNode = this.editor.node.wrap(wrapNode, outerNode);
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
		this.editor.off('parse:html', this.parseHtml);
		this.editor.off('paste:each', this.pasteHtml);
		this.editor.off('paste:schema', this.pasteSchema);
	}
}
export { StatusComponent };
export type { StatusValue };
