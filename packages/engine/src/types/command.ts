/**
 * 编辑器命令接口
 */
export interface CommandInterface {
	/**
	 * 查询一个插件是否启用
	 * @param name 插件名称
	 */
	queryEnabled(name: string): boolean;
	/**
	 * 查询插件的状态，需要插件实现这个方法
	 * @param name 插件名称
	 * @param args 查询参数
	 */
	queryState(name: string, ...args: any): any;
	/**
	 * 执行插件的命令，需要插件实现这个方法
	 * @param name 插件名称
	 * @param args 执行参数
	 */
	execute(name: string, ...args: any): any;
	/**
	 * 调用插件类中已经定义的一个方法
	 * @param name 插件名称
	 * @param method 插件中的方法
	 * @param args 执行参数
	 */
	executeMethod(name: string, method: string, ...args: any): any;
}
