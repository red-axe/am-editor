import { MarkPlugin, PluginOptions } from '@aomao/engine';

export interface BackcolorOptions extends PluginOptions {
	hotkey?: { key: string; args: Array<string> };
}
export default class<T extends BackcolorOptions> extends MarkPlugin<T> {
	static get pluginName() {
		return 'backcolor';
	}

	tagName = 'span';

	style = {
		'background-color': '@var0',
	};

	variable = {
		'@var0': {
			required: true,
			value: '@color',
		},
	};

	isTrigger(color: string, defaultColor?: string) {
		return defaultColor === undefined || color !== defaultColor;
	}

	hotkey() {
		return this.options.hotkey || [];
	}
}
