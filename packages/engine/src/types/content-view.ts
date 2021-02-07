import { CardModelInterface } from './card';
import { ClipboardInterface } from './clipboard';
import { ConversionInterface } from './conversion';
import { LanguageInterface } from './language';
import { EventInterface, NodeInterface, EventListener } from './node';
import { PluginModelInterface } from './plugin';
import { SchemaInterface } from './schema';

export interface ContentViewInterface {
	/**
	 * 阅读器根节点，默认为阅读器父节点
	 */
	root: NodeInterface;
	language: LanguageInterface;
	container: NodeInterface;
	card: CardModelInterface;
	plugin: PluginModelInterface;
	clipboard: ClipboardInterface;
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
	schema: SchemaInterface;
	conversion: ConversionInterface;
	messageSuccess(message: string): void;
	messageError(error: string): void;
	render(content: string): void;
}

export type ContentViewOptions = {
	lang?: string;
	card?: CardModelInterface;
	plugin?: PluginModelInterface;
	root?: Node;
};
