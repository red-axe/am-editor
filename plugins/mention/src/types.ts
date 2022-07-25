import {
	CardInterface,
	CardToolbarItemOptions,
	EditorInterface,
	NodeInterface,
	PluginOptions,
	ToolbarItemOptions,
} from '@aomao/engine';
import type { RequestData, RequestHeaders } from '@aomao/engine';

export type MentionItem = { key?: string; name: string; avatar?: string };
export interface MentionOptions extends PluginOptions {
	defaultData?: Array<MentionItem>;
	onSearch?: (keyword: string) => Promise<Array<MentionItem>>;
	onSelect?: (data: {
		[key: string]: string;
	}) => void | { [key: string]: string };
	onInsert?: (card: CardInterface) => void;
	onClick?: (node: NodeInterface, data: { [key: string]: string }) => void;
	onMouseEnter?: (
		node: NodeInterface,
		data: { [key: string]: string },
	) => void;
	onRender?: (
		root: NodeInterface,
		data: MentionItem[],
		bindItem: (
			node: NodeInterface,
			data: { [key: string]: string },
		) => NodeInterface,
	) => Promise<string | NodeInterface | void>;
	onRenderItem?: (
		item: MentionItem,
		root: NodeInterface,
	) => string | NodeInterface | void;
	onLoading?: (root: NodeInterface) => string | NodeInterface | void;
	onEmpty?: (root: NodeInterface) => string | NodeInterface | void;
	spaceTrigger?: boolean;
	/**
	 * 查询地址
	 */
	action?: string;
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
	 * 请求类型，默认 multipart/form-data;
	 */
	contentType?: string;
	/**
	 * 解析上传后的Respone，返回 result:是否成功，data:成功：文件地址，失败：错误信息
	 */
	parse?: (response: any) => {
		result: boolean;
		data: Array<MentionItem>;
	};

	cardToolbars?: (
		items: (ToolbarItemOptions | CardToolbarItemOptions)[],
		editor: EditorInterface,
	) => (ToolbarItemOptions | CardToolbarItemOptions)[];
}
