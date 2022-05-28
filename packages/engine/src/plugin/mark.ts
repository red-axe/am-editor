import ElementPluginEntry from './element';
import type {
	MarkInterface,
	SchemaMark,
	PluginInterface,
	PluginOptions,
} from '../types';
import { isEngine } from '../utils';

abstract class MarkEntry<T extends PluginOptions = PluginOptions>
	extends ElementPluginEntry<T>
	implements MarkInterface<T>
{
	readonly kind: string = 'mark';
	/**
	 * 标签名称
	 */
	abstract readonly tagName: string;
	/**
	 * 回车后是否复制mark效果，默认为 true，允许
	 * <p><strong>abc<cursor /></strong></p>
	 * 在光标处回车后，第二行默认会继续 strong 样式，如果为 false，将不在加 strong 样式
	 */
	readonly copyOnEnter?: boolean;
	/**
	 * 是否跟随样式，开启后在此标签后输入将不在有mark标签效果，光标重合状态下也无非执行此mark命令。默认 true 跟随
	 * <strong>abc<cursor /></strong> 或者 <strong><cursor />abc</strong>
	 * 在此处输入，如果 followStyle 为 true，那么就会在 strong 节点后输入 或者 strong 节点前输入
	 * <strong>ab<cursor />c</strong> 如果光标在中间为值，还是会继续跟随样式效果
	 * <strong>abc<cursor /></strong><em><strong>123</strong></em> 如果 followStyle 为 true，后方还是有 strong 节点效果，那么还是会继续跟随样式，在 strong abc 后面完成输入
	 */
	readonly followStyle: boolean = true;
	/**
	 * 在包裹相通节点并且属性名称一致，值不一致的mark节点的时候，是合并前者的值到新的节点还是移除前者mark节点，默认 false 移除
	 * 节点样式(style)的值将始终覆盖掉
	 * <span a="1">abc</span>
	 * 在使用 <span a="2"></span> 包裹上方节点时
	 * 如果合并值，就是 <span a="1,2">abc</span> 否则就是 <span a="2">abc</span>
	 */
	readonly combineValueByWrap: boolean = false;
	/**
	 * 合并级别，值越大就合并在越外围
	 */
	readonly mergeLeval: number = 1;

	execute(...args: any) {
		const editor = this.editor;
		if (!isEngine(editor)) return;
		const { change, mark } = editor;
		const markNode = this.createElement(...args);
		const trigger = this.isTrigger
			? this.isTrigger(...args)
			: !this.queryState();
		if (trigger) {
			if (!this.followStyle && change.range.get().collapsed) {
				return;
			}
			mark.wrap(markNode);
		} else {
			mark.unwrap(markNode);
		}
	}

	queryState() {
		const editor = this.editor;
		if (!isEngine(editor)) return;
		const { change } = editor;
		//如果没有属性和样式限制，直接查询是否包含当前标签名称
		if (!this.style && !this.attributes)
			return change.marks.some((node) => node.name === this.tagName);
		//获取属性和样式限制内的值集合
		const values: Array<string> = [];
		change.marks.forEach((node) => {
			values.push(...Object.values(this.getStyle(node)));
			values.push(...Object.values(this.getAttributes(node)));
		});
		return values.length === 0 ? undefined : values;
	}

	schema(): SchemaMark | Array<SchemaMark> {
		const schema = super.schema();
		if (Array.isArray(schema)) {
			return schema.map((schema) => {
				return {
					...schema,
				} as SchemaMark;
			});
		}
		return {
			...schema,
		} as SchemaMark;
	}
	/**
	 * 是否触发执行增加当前mark标签包裹，否则将移除当前mark标签的包裹
	 * @param args 在调用 command.execute 执行插件传入时的参数
	 */
	isTrigger?(...args: any): boolean;
}

export default MarkEntry;

export const isMarkPlugin = (
	plugin: PluginInterface,
): plugin is MarkInterface => {
	return plugin.kind === 'mark';
};
