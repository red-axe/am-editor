import { $, Plugin, NodeInterface, CARD_KEY, isEngine } from '@aomao/engine';
import StatusComponent from './components';
import locales from './locales';

export type Options = {
	hotkey?: string | Array<string>;
};
export default class extends Plugin<Options> {
	static get pluginName() {
		return 'status';
	}

	init() {
		this.editor.language.add(locales);
		this.editor.on('paser:html', (node) => this.parseHtml(node));
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
				node.replaceWith(container);
			},
		);
	}
}
export { StatusComponent };
