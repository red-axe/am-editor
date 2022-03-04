import { EngineInterface } from './engine';

export interface TypingHandle {
	prototype: TypingHandleInterface;
	new (engine: EngineInterface): TypingHandleInterface;
}
export type TypingEventListener = (event: KeyboardEvent) => boolean | void;
/**
 * 按键处理接口
 */
export interface TypingHandleInterface {
	/**
	 * 事件集合
	 */
	listeners: Array<TypingEventListener>;
	/**
	 * 按键类型 键盘按下 | 键盘弹起
	 */
	type: 'keydown' | 'keyup';
	/**
	 * 处理的热键
	 */
	hotkey: Array<string> | string | ((event: KeyboardEvent) => boolean);
	/**
	 * 绑定事件
	 * @param listener 事件方法
	 */
	on(listener: TypingEventListener): void;
	/**
	 * 绑定到第一个事件
	 * @param listener 事件方法
	 */
	unshiftOn(listener: TypingEventListener): void;
	/**
	 * 移除事件
	 * @param listener 事件方法
	 */
	off(listener: TypingEventListener): void;
	/**
	 * 触发事件
	 * @param event 键盘事件
	 */
	trigger(event: KeyboardEvent): void;
	/**
	 * 销毁
	 */
	destroy(): void;
}

/**
 * 按键接口
 */
export interface TypingInterface {
	/**
	 * 增加一个按键监听处理
	 * @param name 监听名称
	 * @param handle 监听处理类
	 * @param triggerName 触发名称
	 */
	addHandleListener(
		name: string,
		handle: TypingHandle,
		triggerName?: string,
	): void;
	/**
	 * 移除一个按键监听处理
	 * @param handle 监听处理实例
	 */
	removeHandleListener(name: string, type: 'keydown' | 'keyup'): void;
	/**
	 * 获取一个事件监听
	 * @param name 监听名称
	 */
	getHandleListener(
		name: string,
		type: 'keydown' | 'keyup',
	): TypingHandleInterface | undefined;
	/**
	 * 绑定键盘按下事件
	 * @param type 按键类型
	 * @param listener 监听方法
	 */
	bindKeydown(event: KeyboardEvent): void;
	/**
	 * 绑定键盘弹起事件
	 * @param type 按键类型
	 * @param listener 监听方法
	 */
	bindKeyup(event: KeyboardEvent): void;
	/**
	 * 触发事件
	 * @param type 类型
	 * @param event 键盘事件
	 */
	trigger(type: 'keydown' | 'keyup', event: KeyboardEvent): void;
	/**
	 * 销毁
	 */
	destroy(): void;
}
