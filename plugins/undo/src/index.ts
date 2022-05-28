import { isEngine, Plugin, PluginOptions } from '@aomao/engine';

export interface UndoOptions extends PluginOptions {
	hotkey?: string | Array<string>;
}
export default class<T extends UndoOptions = UndoOptions> extends Plugin<T> {
	static get pluginName() {
		return 'undo';
	}

	execute() {
		const editor = this.editor;
		if (!isEngine(editor)) return;
		if (!editor.readonly) editor.history.undo();
	}

	queryState() {
		const editor = this.editor;
		if (!isEngine(editor) || editor.readonly) return;
		return editor.history.hasUndo();
	}

	hotkey() {
		return this.options.hotkey || ['mod+z', 'shift+mod+z'];
	}
}
