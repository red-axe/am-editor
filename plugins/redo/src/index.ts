import { isEngine, Plugin, PluginOptions } from '@aomao/engine';

export interface RedoOptions extends PluginOptions {
	hotkey?: string | Array<string>;
}
export default class<T extends RedoOptions = RedoOptions> extends Plugin<T> {
	static get pluginName() {
		return 'redo';
	}

	execute() {
		const editor = this.editor;
		if (!isEngine(editor)) return;
		if (!editor.readonly) editor.history.redo();
	}

	queryState() {
		const editor = this.editor;
		if (!isEngine(editor) || editor.readonly) return;
		return editor.history.hasRedo();
	}

	hotkey() {
		return this.options.hotkey || ['mod+y', 'shift+mod+y'];
	}
}
