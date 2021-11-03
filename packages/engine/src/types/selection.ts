import { NodeInterface } from './node';

export interface SelectionInterface {
	/**
	 * 开始标记
	 */
	anchor: NodeInterface | null;
	/**
	 * 结束标记
	 */
	focus: NodeInterface | null;
	/**
	 * 是否有创建好标记
	 */
	has(): boolean;
	/**
	 * 创建标记
	 */
	create(): void;
	/**
	 * 让Range选择标记位置，并删除标记
	 */
	move(): void;
	/**
	 * 获取节点相对于标记位置的节点，获取后会移除标记
	 * @param node 节点
	 * @param position 位置
	 * @param isClone 是否复制一个副本
	 * @param callback 删除节点时回调，返回一个 boolean 来表示当前节点是否删除
	 */
	getNode(
		node: NodeInterface,
		position?: 'left' | 'center' | 'right',
		isClone?: boolean,
		callback?: (node: NodeInterface) => boolean,
	): NodeInterface;
}
