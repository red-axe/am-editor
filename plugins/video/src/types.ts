import { PluginOptions } from '@aomao/engine';

export interface VideoOptions extends PluginOptions {
	onBeforeRender?: (
		action: 'download' | 'query' | 'cover',
		url: string,
	) => string;
	/**
	 * 是否显示标题
	 */
	showTitle?: boolean;
	/**
	 * 填满编辑器宽度
	 */
	fullEditor?: boolean | number;
}
