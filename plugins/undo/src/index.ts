import { isEngine, Plugin, PluginOptions } from '@aomao/engine';

export interface UndoOptions extends PluginOptions {
	hotkey?: string | Array<string>;
}
export default class<T extends UndoOptions = UndoOptions> extends Plugin<T> {
	static get pluginName() {
		return 'undo';
	}

	execute() {
		if (!isEngine(this.editor)) return;
		if (!this.editor.readonly) this.editor.history.undo();
	}

	queryState() {
		if (!isEngine(this.editor) || this.editor.readonly) return;
		return this.editor.history.hasUndo();
	}

	hotkey() {
		return this.options.hotkey || ['mod+z', 'shift+mod+z'];
	}
}
