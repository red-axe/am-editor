import { Plugin, isEngine, PluginEntry } from '@aomao/engine';
import CodeBlockComponent from './component';

export type Options = {
	hotkey?: string | Array<string>;
	markdown?: boolean;
};

// 缩写替换
const MODE_ALIAS = {
	text: 'plain',
	sh: 'bash',
	ts: 'typescript',
	js: 'javascript',
	py: 'python',
	puml: 'plantuml',
	uml: 'plantuml',
	vb: 'basic',
	md: 'markdown',
	'c++': 'cpp',
};

export default class extends Plugin<Options> {
	static get pluginName() {
		return 'codeblock';
	}

	init() {
		super.init();
		this.editor.on('keydown:enter', event => this.markdown(event));
	}

	execute(mode: string, value: string) {
		if (!isEngine(this.editor)) return;
		const { card } = this.editor;
		const component = card.insert(CodeBlockComponent.cardName, {
			mode,
			code: value,
		});
		card.focus(component);
	}

	hotkey() {
		return this.options.hotkey || '';
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
		const match = /^```(.*){0,10}$/.exec(chars);

		if (match) {
			const modeText = (undefined === match[1]
				? ''
				: match[1]
			).toLowerCase();
			const mode = MODE_ALIAS[modeText] || modeText;

			if (mode || mode === '') {
				event.preventDefault();
				this.editor.block.removeLeftText(block);
				this.editor.command.execute(
					(this.constructor as PluginEntry).pluginName,
					mode,
				);
				block.remove();
				return false;
			}
		}
		return;
	}
}
export { CodeBlockComponent };
