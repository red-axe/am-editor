import { isEngine, Plugin } from '@aomao/engine';

export default class extends Plugin {
	static get pluginName() {
		return 'selectall';
	}

	init() {
		super.init();
		this.editor.on('keydown:all', event => this.onSelectAll(event));
	}

	execute() {
		if (!isEngine(this.editor)) return;
		const { change } = this.editor;
		const range = change.getRange();
		range.select(this.editor.container, true);
		change.select(range);
		this.editor.event.trigger('select');
	}

	onSelectAll(event: KeyboardEvent) {
		if (!isEngine(this.editor)) return;

		const { command } = this.editor;
		event.preventDefault();
		command.execute('selectall');
	}
}
