import PluginEntry from '../plugin/entry';
import { SchemaBlock, BlockInterface, NodeInterface } from '../types';

abstract class BlockEntry<T extends {} = {}> extends PluginEntry<T>
	implements BlockInterface {
	readonly kind: string = 'block';
	/**
	 * 标签名称
	 */
	abstract readonly tagName: string | Array<string>;

	/**
	 * 该节点允许可以放入的block节点
	 */
	readonly allowIn?: Array<string>;
	/**
	 * 禁用的mark插件样式
	 */
	readonly disableMark?: Array<string>;

	schema(): SchemaBlock | Array<SchemaBlock> {
		const schema = super.schema();
		if (Array.isArray(schema)) {
			return schema.map(schema => {
				return {
					...schema,
					allowIn: this.allowIn,
					disableMark: this.disableMark,
				} as SchemaBlock;
			});
		}
		return {
			...schema,
			allowIn: this.allowIn,
			disableMark: this.disableMark,
		} as SchemaBlock;
	}
	/**
	 * Markdown 处理
	 */
	markdown?(
		event: KeyboardEvent,
		text: string,
		block: NodeInterface,
		node: NodeInterface,
	): boolean | void;
}

export default BlockEntry;
