import { EngineInterface } from '../types';

export const pluginKeydownTrigger = (
	engine: EngineInterface,
	type:
		| 'enter'
		| 'backspace'
		| 'space'
		| 'tab'
		| 'shift-tab'
		| 'at'
		| 'slash'
		| 'selectall',
	e: KeyboardEvent,
) => {
	return Object.keys(engine.plugin.components).every(name => {
		const plugin = engine.plugin.components[name];
		if (plugin.onCustomizeKeydown) {
			const reuslt = plugin.onCustomizeKeydown(type, e);
			if (reuslt === false) {
				return false;
			}
		}
		return true;
	});
};

export const pluginKeyupTrigger = (
	engine: EngineInterface,
	type: 'enter' | 'backspace' | 'space' | 'tab',
	event: KeyboardEvent,
) => {
	return Object.keys(engine.plugin.components).every(name => {
		const plugin = engine.plugin.components[name];
		if (plugin.onCustomizeKeyup) {
			const reuslt = plugin.onCustomizeKeyup(type, event);
			if (reuslt === false) {
				return false;
			}
		}
		return true;
	});
};
