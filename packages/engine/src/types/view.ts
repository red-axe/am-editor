import { EditorInterface, EditorOptions } from './editor';
import { NodeInterface } from './node';

export interface ViewOptions extends EditorOptions {}
/**
 * 阅读器接口
 */
export interface ViewInterface<T extends ViewOptions = ViewOptions>
	extends EditorInterface<T> {
	options: T;
	/**
	 * 渲染内容
	 * @param content 渲染的内容
	 * @param trigger 是否触发渲染完成事件，用来展示插件的特俗效果。例如在heading插件中，展示锚点显示功能。默认为 true
	 */
	render(content: string, trigger?: boolean): void;
	/**
	 * 触发事件
	 * @param eventType 事件名称
	 * @param args 参数
	 */
	trigger<R = any>(eventType: string, ...args: any): R;
	/**
	 * 触发render事件
	 * @param eventType render
	 * @param value 渲染根节点
	 */
	trigger(eventType: 'render', value: NodeInterface): void;
}
