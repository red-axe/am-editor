import { Mark } from '@aomao/engine';

export type Options = {
	hotkey?: { key: string; args: Array<string> };
};
export default class extends Mark<Options> {
	static get pluginName() {
		return 'fontcolor';
	}

	tagName = 'span';

	style = {
		color: '@var0',
	};

	variable = {
		'@var0': '@color',
	};

	isTrigger(color: string, defaultColor?: string) {
		return defaultColor === undefined || color !== defaultColor;
	}

	hotkey() {
		return this.options.hotkey || [];
	}
}
