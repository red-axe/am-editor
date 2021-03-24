import { CardEntry } from './card';
import { EditorInterface } from './engine';
import { PluginEntry } from './plugin';

/**
 * 阅读器接口
 */
export interface ViewInterface extends EditorInterface {
	/**
	 * 渲染内容
	 * @param content 渲染的内容
	 * @param trigger 是否触发渲染完成事件，用来展示插件的特俗效果。例如在heading插件中，展示锚点显示功能。默认为 true
	 */
	render(content: string, trigger?: boolean): void;
}

export type ContentViewOptions = {
	//语言，默认中文
	lang?: string;
	plugins?: Array<PluginEntry>;
	cards?: Array<CardEntry>;
	//插件选项，每个插件具体选项请在插件查看
	config?: { [k: string]: {} };
	//阅读器根节点，默认为阅读器所在节点的父节点
	root?: Node;
};
