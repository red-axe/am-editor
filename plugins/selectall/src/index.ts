import { Plugin } from '@aomao/engine';

export default class extends Plugin {
	execute() {
		if (!this.engine) return;
		const { change } = this.engine;
		const range = change.getRange();
		range.select(this.engine.container, true);
		change.select(range);
		this.engine.event.trigger('select');
	}

	onCustomizeKeydown(
		type:
			| 'enter'
			| 'backspace'
			| 'space'
			| 'tab'
			| 'shift-tab'
			| 'at'
			| 'slash'
			| 'selectall',
		event: KeyboardEvent,
	) {
		if (!this.engine || type !== 'selectall') return;

		const { command } = this.engine;
		event.preventDefault();
		command.execute(this.name);
	}
}
