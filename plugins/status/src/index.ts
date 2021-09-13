import {
	$,
	Plugin,
	NodeInterface,
	CARD_KEY,
	isEngine,
	PluginOptions,
	PluginEntry,
	SchemaInterface,
} from '@aomao/engine';
import StatusComponent from './components';
import locales from './locales';

export interface Options extends PluginOptions {
	hotkey?: string | Array<string>;
}
export default class extends Plugin<Options> {
	static get pluginName() {
		return 'status';
	}

	init() {
		this.editor.language.add(locales);
		if (!isEngine(this.editor)) return;
		this.editor.on('paser:html', (node) => this.parseHtml(node));
		this.editor.on('paste:each', (child) => this.pasteHtml(child));
		this.editor.on('paste:schema', (schema: SchemaInterface) =>
			this.pasteSchema(schema),
		);
	}

	execute() {
		if (!isEngine(this.editor)) return;
		const { card } = this.editor;
		const component = card.insert(
			StatusComponent.cardName,
		) as StatusComponent;
		component.activate(true);
		setTimeout(() => {
			component.focusEditor();
		}, 50);
	}

	hotkey() {
		return this.options.hotkey || '';
	}

	pasteSchema(schema: SchemaInterface) {
		schema.add({
			type: 'mark',
			name: 'span',
			attributes: {
				'data-type': {
					required: true,
					value: StatusComponent.cardName,
				},
				style: {
					background: {
						required: true,
						value: '@color',
					},
					color: {
						required: true,
						value: '@color',
					},
				},
			},
		});
	}

	pasteHtml(node: NodeInterface) {
		if (!isEngine(this.editor)) return;
		if (node.isElement()) {
			const type = node.attributes('data-type');
			if (type === StatusComponent.cardName) {
				this.editor.card.replaceNode(node, StatusComponent.cardName, {
					text: node.text(),
					color: {
						background: node.css('background'),
						color: node.css('color'),
					},
				});
				node.remove();
			}
		}
	}

	parseHtml(root: NodeInterface) {
		root.find(`[${CARD_KEY}=${StatusComponent.cardName}`).each(
			(statusNode) => {
				const node = $(statusNode);
				const container = node.find('span.data-label-container');
				container.css({
					'font-weight': 400,
					'font-size': '12px',
					overflow: 'hidden',
					'max-width': '200px',
					display: 'inline-block',
					'white-space': 'nowrap',
					'margin-bottom': '-4px',
					'border-radius': '4px',
					border: 'none',
					padding: '2px 5px',
					'text-overflow': 'ellipsis',
					'line-height': '14px',
					'margin-left': '1px',
					'margin-right': '1px',
				});
				container.attributes('data-type', StatusComponent.cardName);
				node.replaceWith(container);
			},
		);
	}
}
export { StatusComponent };
