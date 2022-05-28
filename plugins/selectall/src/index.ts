import {
	isEngine,
	Plugin,
	EDITABLE_SELECTOR,
	PluginOptions,
} from '@aomao/engine';

export interface SelectAllOptions extends PluginOptions {}

const KEYDOWN_ALL = 'keydown:all';
export default class<
	T extends SelectAllOptions = SelectAllOptions,
> extends Plugin<T> {
	static get pluginName() {
		return 'selectall';
	}

	init() {
		this.editor.on(KEYDOWN_ALL, this.onSelectAll);
	}

	execute() {
		const editor = this.editor;
		if (!isEngine(editor)) return;
		const { change } = editor;
		const range = change.range.get();
		const editableElement = range.startNode.closest(EDITABLE_SELECTOR);
		if (editableElement.length > 0) {
			range.select(editableElement, true);
		} else {
			range.select(editor.container, true);
		}
		change.range.select(range);
		editor.trigger('select');
	}

	onSelectAll = (event: KeyboardEvent) => {
		const { command } = this.editor;
		event.preventDefault();
		command.execute('selectall');
	};

	destroy() {
		this.editor.off(KEYDOWN_ALL, this.onSelectAll);
	}
}
