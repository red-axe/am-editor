import {
	CardToolbarItemOptions,
	CardValue,
	EditorInterface,
	PluginOptions,
	ToolbarItemOptions,
} from '@aomao/engine';

export interface FileValue extends CardValue {
	/**
	 *  文件名称
	 */
	name: string;
	/**
	 * 文件大小
	 */
	size?: number;
	/**
	 * 状态
	 * uploading 上传中
	 * done 上传成功
	 */
	status?: 'uploading' | 'done' | 'error';
	/**
	 * 文件地址
	 */
	url?: string;
	/**
	 * 预览地址
	 */
	preview?: string;
	/**
	 * 下载地址
	 */
	download?: string;
	/**
	 * 上传进度
	 */
	percent?: number;
	/**
	 * 错误状态下的错误信息
	 */
	message?: string;
}

export interface FileOptions extends PluginOptions {
	onBeforeRender?: (
		action: 'preview' | 'download',
		url: string,
		editor: EditorInterface,
	) => string;
	onDownload?: (url: string, value: FileValue) => void;
	onPreview?: (url: string, value: FileValue) => void;
	cardToolbars?: (
		items: (ToolbarItemOptions | CardToolbarItemOptions)[],
		editor: EditorInterface,
	) => (ToolbarItemOptions | CardToolbarItemOptions)[];
}
