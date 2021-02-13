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
	let customResult = Object.keys(engine.plugin.components).every(name => {
		const plugin = engine.plugin.components[name];
		if (plugin.onCustomizeKeydown) {
			const reuslt = plugin.onCustomizeKeydown(type, e);
			if (reuslt === false) {
				return false;
			}
		}
		return true;
	});
	if (customResult !== false && type === 'space') {
		const { change } = engine;
		const range = change.getRange();
		if (!range.collapsed || change.isComposing()) return customResult;
		const { startNode, startOffset } = range;
		const leftText =
			startNode.type === Node.TEXT_NODE
				? startNode.text().substr(0, startOffset)
				: startNode[0].childNodes[startOffset - 1].textContent;

		customResult = Object.keys(engine.plugin.components).every(name => {
			const plugin = engine.plugin.components[name];
			if (plugin.onKeydownSpace) {
				const reuslt = plugin.onKeydownSpace(e, leftText || '');
				if (reuslt === false) {
					return false;
				}
			}
			return true;
		});
	}
	return customResult;
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
