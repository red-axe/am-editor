import {
	Plugin,
	NodeInterface,
	CARD_KEY,
	CARD_VALUE_KEY,
	isEngine,
	PluginEntry,
} from '@aomao/engine';
import HrComponent from './component';

export type Options = {
	hotkey?: string | Array<string>;
	markdown?: boolean;
};
export default class extends Plugin<Options> {
	static get pluginName() {
		return 'hr';
	}

	init() {
		super.init();
		this.editor.on('keydown:enter', event => this.markdown(event));
	}

	execute() {
		if (!isEngine(this.editor)) return;
		const { card } = this.editor;
		card.insert(HrComponent.cardName);
	}

	hotkey() {
		return this.options.hotkey || 'mod+shift+e';
	}

	markdown(event: KeyboardEvent) {
		if (!isEngine(this.editor) || this.options.markdown === false) return;
		const { change } = this.editor;
		const range = change.getRange();

		if (!range.collapsed || change.isComposing() || !this.markdown) return;

		const block = this.editor.block.closest(range.startNode);

		if (!this.editor.node.isRootBlock(block)) {
			return;
		}

		const chars = this.editor.block.getLeftText(block);
		const match = /^---$/.exec(chars);

		if (match) {
			event.preventDefault();
			this.editor.block.removeLeftText(block);
			this.editor.command.execute(
				(this.constructor as PluginEntry).pluginName,
			);
			return false;
		}
		return;
	}

	parseHtml(root: NodeInterface) {
		const { $ } = this.editor;
		root.find(`[${CARD_KEY}=${HrComponent.cardName}`).each(hrNode => {
			const node = $(hrNode);
			const hr = node.find('hr');
			hr.css({
				'background-color': '#e8e8e8',
				border: '1px solid transparent',
				margin: '18px 0',
			});
			node.removeAttributes(CARD_VALUE_KEY);
			node.empty();
			node.append(hr);
		});
	}
}
export { HrComponent };
