import { ChangeInterface } from './types';
import { CommandInterface } from './types/command';
import { EditorInterface, isEngine } from './types/engine';

class Command implements CommandInterface {
	private editor: EditorInterface;
	constructor(editor: EditorInterface) {
		this.editor = editor;
	}

	queryEnabled(name: string) {
		return !!this.editor.plugin.components[name];
	}

	queryState(name: string, ...args: any) {
		const plugin = this.editor.plugin.components[name];
		if (plugin && plugin.queryState) {
			try {
				return plugin.queryState(args);
			} catch (error) {
				console.log(error);
			}
		}
	}

	execute(name: string, ...args: any) {
		const plugin = this.editor.plugin.components[name];
		if (plugin && plugin.execute) {
			let change: ChangeInterface | undefined;
			if (isEngine(this.editor)) {
				change = this.editor.change;
				change.cacheRangeBeforeCommand();
			}
			this.editor.trigger('beforeCommandExecute', name, ...args);
			try {
				const result = plugin.execute(...args);
				change?.combinTextNode();
				change?.onSelect();
				this.editor.trigger('afterCommandExecute', name, ...args);
				return result;
			} catch (error) {
				console.log(error);
			}
		}
	}
}

export default Command;
