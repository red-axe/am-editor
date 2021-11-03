/**
 * 快捷键接口
 */
export interface HotkeyInterface {
	/**
	 * 触发匹配
	 * @param e
	 */
	trigger(e: KeyboardEvent): void;
	/**
	 * 启用快捷键拦截
	 */
	enable(): void;
	/**
	 * 禁用快捷键拦截
	 */
	disable(): void;
	/**
	 * 销毁
	 */
	destroy(): void;
}
