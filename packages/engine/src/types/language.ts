/**
 * 语言管理器
 */
export interface LanguageInterface {
	/**
	 * 增加本地化语言
	 * @param data
	 */
	add(data: {}): void;
	/**
	 * 根据key获取语言的值
	 * @param keys
	 */
	get<T extends string | {}>(...keys: Array<string>): T;
}
