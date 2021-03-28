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
			const { change, event } = this.engine;
			change.cacheRangeBeforeCommand();
			event.trigger('beforeCommandExecute', name, ...args);
			try {
				const result = plugin.execute(...args);
				change.combinTextNode();
				change.onSelect();
				event.trigger('afterCommandExecute', name, ...args);
				return result;
			} catch (error) {
				console.log(error);
			}
		}
	}
}

export default Command;
