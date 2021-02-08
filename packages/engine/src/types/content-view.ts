import { CardModelInterface } from './card';
import { ClipboardInterface } from './clipboard';
import { ConversionInterface } from './conversion';
import { LanguageInterface } from './language';
import { EventInterface, NodeInterface, EventListener } from './node';
import { PluginModelInterface } from './plugin';
import { SchemaInterface } from './schema';

/**
 * 阅读器接口
 */
export interface ContentViewInterface {
	/**
	 * 阅读器根节点，默认为阅读器父节点
	 */
	root: NodeInterface;
	/**
	 * 语言处理实例
	 */
	language: LanguageInterface;
	/**
	 * 阅读器节点
	 */
	container: NodeInterface;
	/**
	 * 卡片处理实例
	 */
	card: CardModelInterface;
	/**
	 * 插件处理实例
	 */
	plugin: PluginModelInterface;
	/**
	 * 剪贴板处理实例
	 */
	clipboard: ClipboardInterface;
	/**
	 * 事件
	 */
	event: EventInterface;
	/**
	 * 绑定事件
	 * @param eventType 事件类型
	 * @param listener 事件回调
	 * @param rewrite 是否重写
	 */
	on(eventType: string, listener: EventListener, rewrite?: boolean): void;
	/**
	 * 移除绑定事件
	 * @param eventType 事件类型
	 * @param listener 事件回调
	 */
	off(eventType: string, listener: EventListener): void;
	/**
	 * 标签规则实例
	 */
	schema: SchemaInterface;
	/**
	 * 标签转换器实例
	 */
	conversion: ConversionInterface;
	/**
	 * 显示成功信息
	 * @param message 信息
	 */
	messageSuccess(message: string): void;
	/**
	 * 显示错误信息
	 * @param error 错误信息
	 */
	messageError(error: string): void;
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
	//卡片模型实例，可以将引擎的模型实例传递过来。主要用来读取add后的卡片
	card?: CardModelInterface;
	//插件模型实例，可以将引擎的模型实例传递过来。主要用来读取add后的插件
	plugin?: PluginModelInterface;
	//插件选项，每个插件具体选项请在插件查看
	pluginOptions?: { [k: string]: {} };
	//阅读器根节点，默认为阅读器所在节点的父节点
	root?: Node;
};
