import { isEngine, Plugin, EDITABLE_SELECTOR } from '@aomao/engine';

export default class extends Plugin {
	static get pluginName() {
		return 'selectall';
	}

	init() {
		this.editor.on('keydown:all', event => this.onSelectAll(event));
	}

	execute() {
		if (!isEngine(this.editor)) return;
		const { change } = this.editor;
		const range = change.getRange();
		const editableElement = range.startNode.closest(EDITABLE_SELECTOR);
		if (editableElement.length > 0) {
			range.select(editableElement, true);
		} else {
			range.select(this.editor.container, true);
		}
		change.select(range);
		this.editor.trigger('select');
	}

	onSelectAll(event: KeyboardEvent) {
		if (!isEngine(this.editor)) return;

		const { command } = this.editor;
		event.preventDefault();
		command.execute('selectall');
	}
}
