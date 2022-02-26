import { RangeInterface } from './range';

export type ClipboardData = {
	html?: string;
	text?: string;
	files: Array<File>;
};
export interface ClipboardInterface {
	/**
	 * 获取剪贴板数据
	 * @param event 事件
	 */
	getData(event: DragEvent | ClipboardEvent): ClipboardData;
	/**
	 * 写入剪贴板
	 * @param event 事件
	 * @param range 光标，默认获取当前光标位置
	 * @param callback 回调
	 */
	write(
		event: ClipboardEvent,
		range?: RangeInterface,
	): Record<'html' | 'text', string> | undefined;
	/**
	 * 在当前光标位置执行剪贴操作
	 */
	cut(): void;
	/**
	 * 复制
	 * @param data 要复制的数据，可以是节点或者字符串
	 * @param trigger 是否触发剪贴事件，通知插件
	 * @returns 返回是否复制成功
	 */
	copy(data: Node | string, trigger?: boolean): boolean;
}
