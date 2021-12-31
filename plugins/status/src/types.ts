import { PluginOptions } from '@aomao/engine';

export interface StatusOptions extends PluginOptions {
	hotkey?: string | Array<string>;
	colors?: {
		background: string;
		color: string;
	}[];
}
