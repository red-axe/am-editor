import {
	CardToolbarItemOptions,
	EditorInterface,
	PluginOptions,
	ToolbarItemOptions,
} from '@aomao/engine';

export interface VideoOptions extends PluginOptions {
	onBeforeRender?: (
		action: 'download' | 'query' | 'cover',
		url: string,
		editor: EditorInterface,
	) => string;
	/**
	 * 是否显示标题
	 */
	showTitle?: boolean;
	/**
	 * 填满编辑器宽度
	 */
	fullEditor?: boolean | number;

	cardToolbars?: (
		items: (ToolbarItemOptions | CardToolbarItemOptions)[],
		editor: EditorInterface,
	) => (ToolbarItemOptions | CardToolbarItemOptions)[];
}
