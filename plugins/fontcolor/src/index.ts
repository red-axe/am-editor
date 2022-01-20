import { MarkPlugin, PluginOptions } from '@aomao/engine';

export interface FontcolorOptions extends PluginOptions {
	hotkey?: { key: string; args: Array<string> };
}
export default class<
	T extends FontcolorOptions = FontcolorOptions,
> extends MarkPlugin<T> {
	static get pluginName() {
		return 'fontcolor';
	}
	readonly mergeLeval = 3;
	tagName = 'span';

	style = {
		color: '@var0',
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
