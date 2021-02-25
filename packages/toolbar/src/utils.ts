import { EngineInterface } from '@aomao/engine';

export const autoGetHotkey = (
	engine: EngineInterface,
	name: string,
	itemKey?: string,
) => {
	const plugin = engine?.plugin.components[name];
	if (plugin && plugin.hotkey) {
		let key = plugin.hotkey();
		if (key) {
			if (Array.isArray(key)) {
				if (itemKey) {
					const index = key.findIndex(
						(k: any) => typeof k === 'object' && k.args === itemKey,
					);
					key = key[index > -1 ? index : 0];
				} else {
					key = key[0];
				}
			}
			if (typeof key === 'object') {
				key = key.key;
			}
			return key;
		}
	}
	return;
};
