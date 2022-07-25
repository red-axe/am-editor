import {
	CardToolbarItemOptions,
	EditorInterface,
	PluginOptions,
	RequestData,
	RequestHeaders,
	ToolbarItemOptions,
} from '@aomao/engine';

export interface MathOptions extends PluginOptions {
	/**
	 * 请求生成公式svg地址
	 */
	action: string;
	/**
	 * 数据返回类型，默认 json
	 */
	type?: '*' | 'json' | 'xml' | 'html' | 'text' | 'js';
	/**
	 * 额外携带数据上传
	 */
	data?: RequestData;
	/**
	 * 请求头
	 */
	headers?: RequestHeaders;
	/**
	 * 请求类型，默认 application/json;
	 */
	contentType?: string;
	/**
	 * 解析上传后的Respone，返回 result:是否成功，data:成功：公式数据，失败：错误信息
	 */
	parse?: (response: any) => {
		result: boolean;
		data: string;
	};

	cardToolbars?: (
		items: (ToolbarItemOptions | CardToolbarItemOptions)[],
		editor: EditorInterface,
	) => (ToolbarItemOptions | CardToolbarItemOptions)[];
}
