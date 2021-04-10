import { CommandInterface } from './types/command';
import { EngineInterface } from './types/engine';

class Command implements CommandInterface {
	private engine: EngineInterface;
	constructor(engine: EngineInterface) {
		this.engine = engine;
	}

	queryEnabled(name: string) {
		return !!this.engine.plugin.components[name];
	}

	queryState(name: string, ...args: any) {
		const plugin = this.engine.plugin.components[name];
		if (plugin && plugin.queryState) {
			try {
				return plugin.queryState(args);
			} catch (error) {
				console.log(error);
			}
		}
	}

	execute(name: string, ...args: any) {
		const plugin = this.engine.plugin.components[name];
		if (plugin && plugin.execute) {
			const { change } = this.engine;
			change.cacheRangeBeforeCommand();
			this.engine.trigger('beforeCommandExecute', name, ...args);
			try {
				const result = plugin.execute(...args);
				change.combinTextNode();
				change.onSelect();
				this.engine.trigger('afterCommandExecute', name, ...args);
				return result;
			} catch (error) {
				console.log(error);
			}
		}
	}
}

export default Command;
