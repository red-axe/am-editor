import { PluginOptions } from '@aomao/engine';

export interface VideoOptions extends PluginOptions {
	onBeforeRender?: (
		action: 'download' | 'query' | 'cover',
		url: string,
	) => string;
	showTitle?: boolean;
}
