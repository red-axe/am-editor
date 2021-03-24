import { isEngine, Plugin } from '@aomao/engine';

export type Options = {
	hotkey?: string | Array<string>;
};
export default class extends Plugin<Options> {
	static get pluginName() {
		return 'undo';
	}

	execute() {
		if (!isEngine(this.editor)) return;
		this.editor.readonly = false;
		this.editor.history.undo();
	}

	queryState() {
		if (!isEngine(this.editor)) return;
		return this.editor.history.hasUndo();
	}

	hotkey() {
		return this.options.hotkey || ['mod+z', 'shift+mod+z'];
	}
}
