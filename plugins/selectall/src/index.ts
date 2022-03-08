import {
	isEngine,
	Plugin,
	EDITABLE_SELECTOR,
	PluginOptions,
} from '@aomao/engine';

export interface SelectAllOptions extends PluginOptions {}

export default class<
	T extends SelectAllOptions = SelectAllOptions,
> extends Plugin<T> {
	static get pluginName() {
		return 'selectall';
	}

	init() {
		this.editor.on('keydown:all', this.onSelectAll);
	}

	execute() {
		if (!isEngine(this.editor)) return;
		const { change } = this.editor;
		const range = change.range.get();
		const editableElement = range.startNode.closest(EDITABLE_SELECTOR);
		if (editableElement.length > 0) {
			range.select(editableElement, true);
		} else {
			range.select(this.editor.container, true);
		}
		change.range.select(range);
		this.editor.trigger('select');
	}

	onSelectAll = (event: KeyboardEvent) => {
		const { command } = this.editor;
		event.preventDefault();
		command.execute('selectall');
	};

	destroy() {
		this.editor.off('keydown:all', this.onSelectAll);
	}
}
