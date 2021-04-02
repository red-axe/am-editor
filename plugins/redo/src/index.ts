import { isEngine, Plugin } from '@aomao/engine';

export type Options = {
	hotkey?: string | Array<string>;
};
export default class extends Plugin<Options> {
	static get pluginName() {
		return 'redo';
	}

	execute() {
		if (!isEngine(this.editor)) return;
		this.editor.readonly = false;
		this.editor.history.redo();
	}

	queryState() {
		if (!isEngine(this.editor)) return;
		return this.editor.history.hasRedo();
	}

	hotkey() {
		return this.options.hotkey || ['mod+y', 'shift+mod+y'];
	}
}
