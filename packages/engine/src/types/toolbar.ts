import { NodeInterface } from './node';

/**
 * 按钮
 */
export type ButtonOptions = {
	key?: string;
	/**
	 * 类型
	 */
	type: 'button';
	/**
	 * 是否禁用
	 */
	disabled?: boolean;
	/**
	 * 链接
	 */
	link?: string;
	/**
	 * 样式
	 */
	style?: string;
	/**
	 * 样式名称
	 */
	class?: string;
	/**
	 * 按钮内容
	 */
	content: string;
	/**
	 * 按钮提示内容
	 */
	title?: string | (() => string);
	/**
	 * 单击事件
	 */
	onClick?: (event: MouseEvent, node: NodeInterface) => void;
	/**
	 * 按钮渲染成功后的回调
	 */
	didMount?: (node: NodeInterface) => void;
};
export type SwitchOptions = {
	key?: string;
	/**
	 * 类型
	 */
	type: 'switch';
	/**
	 * 样式名称
	 */
	class?: string;
	/**
	 * 是否禁用
	 */
	disabled?: boolean;
	/**
	 * 按钮内容
	 */
	content: string;
	/**
	 * 是否选中
	 */
	checked?: boolean;
	/**
	 * 获取当前状态
	 */
	getState?: () => boolean;
	/**
	 * 单击事件
	 */
	onClick?: (event: MouseEvent, node: NodeInterface) => void;
	/**
	 * 按钮渲染成功后的回调
	 */
	didMount?: (node: NodeInterface) => void;
};
/**
 * 输入框
 */
export type InputOptions = {
	key?: string;
	/**
	 * 类型
	 */
	type: 'input';
	/**
	 * 输入框占位符
	 */
	placeholder: string;
	/**
	 * 输入框值
	 */
	value: string | number;
	/**
	 * 输入框前缀内容
	 */
	prefix?: string;
	/**
	 * 输入框后缀内容
	 */
	suffix?: string;
	/**
	 * 回车后的回调
	 */
	onEnter?: (value: string) => void;
	/**
	 * 输入后的回调
	 */
	onInput?: (value: string) => void;
	/**
	 * 值改变后回调
	 */
	onChange?: (value: string) => void;
	/**
	 * 渲染成功后回调
	 */
	didMount?: (node: NodeInterface) => void;
};
/**
 * 单选按钮
 */
export type DropdownSwitchOptions = {
	key?: string;
	/**
	 * 类型
	 */
	type: 'switch';
	/**
	 * 是否禁用
	 */
	disabled?: boolean;
	/**
	 * 按钮内容
	 */
	content: string;
	/**
	 * 是否选中
	 */
	checked?: boolean;
	/**
	 * 获取当前状态
	 */
	getState?: () => boolean;
	/**
	 * 单击事件
	 */
	onClick?: (event: MouseEvent, node: NodeInterface) => void;
};
/**
 * 下拉项按钮
 */
export type DropdownButtonOptions = {
	/**
	 * 类型
	 */
	type: 'button';
	/**
	 * 是否禁用
	 */
	disabled?: boolean;
	/**
	 * 按钮内容
	 */
	content: string;
	/**
	 * 单击回调
	 */
	onClick?: (event: MouseEvent, node: NodeInterface) => void;
};
/**
 * 下拉框
 */
export type DropdownOptions = {
	key?: string;
	/**
	 * 类型
	 */
	type: 'dropdown';
	/**
	 * 是否禁用
	 */
	disabled?: boolean;
	/**
	 * 内容
	 */
	content: string;
	/**
	 * 提示
	 */
	title?: string | (() => string);
	/**
	 * 下拉项
	 */
	items: Array<DropdownSwitchOptions | DropdownButtonOptions>;
	/**
	 * 渲染成功后的回调
	 */
	didMount?: (node: NodeInterface) => void;
};
/**
 * 自定义节点
 */
export type NodeOptions = {
	key?: string;
	/**
	 * 类型
	 */
	type: 'node';
	/**
	 * 节点
	 */
	node: NodeInterface;
	/**
	 * 提示
	 */
	title?: string | (() => string);
	/**
	 * 渲染成功后的回调
	 */
	didMount?: (node: NodeInterface) => void;
};
/**
 * 工具栏项
 */
export type ToolbarItemOptions =
	| ButtonOptions
	| InputOptions
	| DropdownOptions
	| NodeOptions
	| SwitchOptions;

/**
 * 工具栏
 */
export type ToolbarOptions = {
	/**
	 * 工具栏项
	 */
	items: Array<ToolbarItemOptions>;
};

export interface ButtonInterface {
	/**
	 * 渲染到容器
	 * @param container
	 */
	render(container: NodeInterface): void;
}

export interface InputInterface {
	/**
	 * 回车
	 */
	onEnter: (value: string) => void;
	/**
	 * 输入
	 */
	onInput: (value: string) => void;
	/**
	 * 值改变
	 */
	onChange: (value: string) => void;
	/**
	 * 查找节点
	 * @param role
	 */
	find(role: string): NodeInterface;
	/**
	 * 渲染到容器
	 * @param container
	 */
	render(container: NodeInterface): void;
}

export interface DropdownInterface {
	/**
	 * document 单击事件
	 * @param e
	 */
	documentMouseDown(e: MouseEvent): void;
	/**
	 * 初始化事件
	 */
	initToggleEvent(): void;
	/**
	 * 触发下拉框展开
	 */
	toggleDropdown(): void;
	/**
	 * 显示下拉框
	 */
	showDropdown(): void;
	/**
	 * 隐藏下拉框
	 */
	hideDropdown(): void;
	/**
	 * 渲染提示
	 */
	renderTooltip(): void;
	/**
	 * 渲染下拉框到容器
	 * @param container
	 */
	renderDropdown(container: NodeInterface): void;
	/**
	 * 渲染到容器
	 * @param container
	 */
	render(container: NodeInterface): void;
	/**
	 * 销毁
	 */
	destroy(): void;
}

export interface ToolbarInterface {
	/**
	 * 根节点
	 */
	root: NodeInterface;
	/**
	 * 增加工具栏项
	 * @param node
	 */
	addItems(node: NodeInterface): void;
	/**
	 * 查找节点
	 * @param role
	 */
	find(role: string): NodeInterface;
	/**
	 * 隐藏
	 */
	hide(): void;
	/**
	 * 展示
	 */
	show(): void;
	/**
	 * 渲染
	 * @param container
	 */
	render(container?: NodeInterface): NodeInterface;
	/**
	 * 更新数据
	 * @param options 可选项
	 */
	update(options: ToolbarOptions): void;
	/**
	 * 销毁
	 */
	destroy(): void;
}
