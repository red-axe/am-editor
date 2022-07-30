import cloneDeep from 'lodash/cloneDeep';
import isEqual from 'lodash/isEqual';
import merge from 'lodash/merge';
import {
	NodeInterface,
	SchemaAttributes,
	SchemaBlock,
	SchemaGlobal,
	SchemaInterface,
	SchemaRule,
	SchemaStyle,
	SchemaValue,
	SchemaValueObject,
} from './types';
import { getStyleMap, validUrl } from './utils';
import { getHashId } from './node';
import { DATA_ID } from './constants';
import { isNode } from './node/utils';

/**
 * 标签规则
 */
const SCHEMA_KEYS = ['blocks', 'inlines', 'marks', 'globals'];
class Schema implements SchemaInterface {
	private _all: Array<SchemaRule> = [];
	private _typeMap: {
		[key: string]: SchemaRule;
	} = {};
	private _invalidKeys: string[] = [];
	private _tagMap: Record<'blocks' | 'inlines' | 'marks', string[]> = {
		blocks: [],
		inlines: [],
		marks: [],
	};
	data: {
		blocks: Array<SchemaRule>;
		inlines: Array<SchemaRule>;
		marks: Array<SchemaRule>;
		globals: { [key: string]: SchemaAttributes | SchemaStyle };
	} = {
		blocks: [],
		inlines: [],
		marks: [],
		globals: {},
	};

	/**
	 * 增加规则
	 * 只有 type 和 attributes 时，将作为此类型全局属性，与其它所有同类型标签属性将合并
	 * @param rules 规则
	 */
	add(rules: SchemaRule | SchemaGlobal | Array<SchemaRule | SchemaGlobal>) {
		rules = cloneDeep(rules);
		if (!Array.isArray(rules)) {
			rules = [rules];
		}

		rules.forEach((rule) => {
			if (isSchemaRule(rule)) {
				//删除全局属性已有的规则
				if (rule.attributes) {
					Object.keys(rule.attributes).forEach((key) => {
						if (!this.data.globals[rule.type]) return;
						if (key === 'style') {
							Object.keys(rule.attributes!.style).forEach(
								(styleName) => {
									if (
										this.data.globals[rule.type][key] &&
										this.data.globals[rule.type][key][
											styleName
										] === rule.attributes!.style[styleName]
									) {
										delete rule.attributes!.style[
											styleName
										];
									}
								},
							);
						} else if (
							this.data.globals[rule.type][key] ===
							rule.attributes![key]
						) {
							delete rule.attributes![key];
						}
					});
				}
				if (rule.type === 'block') {
					this.data.blocks.push(rule);
				} else if (rule.type === 'inline') {
					this.data.inlines.push(rule);
				} else if (rule.type === 'mark') {
					this.data.marks.push(rule);
				}
			} else if (!!this.data[`${rule.type}s`]) {
				this.data.globals[rule.type] = merge(
					Object.assign({}, this.data.globals[rule.type]),
					rule.attributes,
				);
			}
		});
		this.updateTagMap();
		//按照必要属性个数排序
		const getCount = (rule: SchemaRule) => {
			const aAttributes = rule.attributes || {};
			const aStyles = aAttributes.style || {};
			let aCount = 0;
			let sCount = 0;
			Object.keys(aAttributes).forEach((attributesName) => {
				const attributesValue = aAttributes[attributesName];
				if (
					isSchemaValueObject(attributesValue) &&
					attributesValue.required
				)
					aCount++;
			});
			Object.keys(aStyles).forEach((stylesName) => {
				const stylesValue = aStyles[stylesName];
				if (isSchemaValueObject(stylesValue) && stylesValue.required)
					sCount++;
			});
			return [aCount, sCount];
		};
		const { blocks, marks, inlines } = this.data;
		this._all = [...blocks, ...marks, ...inlines].sort((a, b) => {
			const [aACount, aSCount] = getCount(a);
			const [bACount, bSCount] = getCount(b);

			if (aACount > bACount) return -1;
			if (aACount === bACount)
				return aSCount === bSCount ? 0 : aSCount > bSCount ? -1 : 1;
			return 1;
		});
	}

	updateTagMap() {
		this._tagMap.marks = [];
		this.data.marks.forEach((mark) => {
			if (!this._tagMap.marks.includes(mark.name)) {
				this._tagMap.marks.push(mark.name);
			}
		});
		this._tagMap.blocks = [];
		this.data.blocks.forEach((block) => {
			if (!this._tagMap.blocks.includes(block.name)) {
				this._tagMap.blocks.push(block.name);
			}
		});
		this._tagMap.inlines = [];
		this.data.inlines.forEach((inline) => {
			if (!this._tagMap.inlines.includes(inline.name)) {
				this._tagMap.inlines.push(inline.name);
			}
		});
	}

	getTags(type: 'blocks' | 'inlines' | 'marks') {
		return this._tagMap[type];
	}

	// 移除一个规则
	remove(rule: SchemaRule) {
		let index = this._all.findIndex((r) => isEqual(r, rule));
		if (index > -1) this._all.splice(index, 1);
		const rules = this.data[`${rule.type}s`];
		if (rules) {
			index = rules.findIndex((r) => isEqual(r, rule));
			if (index > -1) rules.splice(index, 1);
		}
		this._typeMap = {};
		this.updateTagMap();
	}
	/**
	 * 克隆当前schema对象
	 */
	clone() {
		const schema = new Schema();
		schema._all = cloneDeep(this._all);
		schema._typeMap = cloneDeep(this._typeMap);
		schema._tagMap = cloneDeep(this._tagMap);
		schema.data = cloneDeep(this.data);
		return schema;
	}

	/**
	 * 查找规则
	 * @param callback 查找条件
	 */
	find(callback: (rule: SchemaRule) => boolean): Array<SchemaRule> {
		const schemas: Array<SchemaRule> = [];
		SCHEMA_KEYS.forEach((key) => {
			if (key !== 'globals') {
				const rules = (this.data[key] as Array<SchemaRule>).filter(
					callback,
				);
				schemas.push(...rules);
			}
		});
		return schemas;
	}

	getType(
		node: NodeInterface | Node,
		filter?: (rule: SchemaRule) => boolean,
	) {
		const element = (isNode(node) ? node : node[0]) as Element;
		if (!element || element.nodeType !== Node.ELEMENT_NODE)
			return undefined;
		let id = element.getAttribute(DATA_ID);
		if (!id) id = getHashId(element, false);
		else id = id.split('-')[0];
		if (this._invalidKeys.includes(id)) return undefined;
		if (!!this._typeMap[id] && (!filter || filter(this._typeMap[id]!)))
			return this._typeMap[id].type;
		const reuslt = this.getRule(element, filter);
		if (reuslt) this._typeMap[id] = reuslt;
		else this._invalidKeys.push(id);
		return reuslt?.type;
	}

	/**
	 * 根据节点获取符合的规则
	 * @param node 节点
	 * @param filter 过滤
	 * @returns
	 */
	getRule(
		node: NodeInterface | Node,
		filter?: (rule: SchemaRule) => boolean,
	) {
		const element = (isNode(node) ? node : node[0]) as Element;
		filter = filter || ((rule) => rule.name === element.localName);
		return this._all.find(
			(rule) => filter!(rule) && this.checkNode(element, rule.attributes),
		);
	}

	/**
	 * 检测节点是否符合某一属性规则
	 * @param node 节点
	 * @param attributes 属性规则
	 */
	checkNode(
		node: NodeInterface | Node,
		attributes: SchemaAttributes | SchemaStyle = {},
	): boolean {
		const element = (isNode(node) ? node : node[0]) as Element;
		//需要属性每一项都能效验通过
		for (const attributesName in attributes) {
			if (attributesName === 'style') continue;
			const schema = attributes as SchemaAttributes;
			if (!schema[attributesName]) return false;
			if (
				!this.checkValue(
					schema,
					attributesName,
					element.getAttribute(attributesName) ?? undefined,
				)
			)
				return false;
		}

		const nodeStyles = getStyleMap(element.getAttribute('style') || '');
		const styles = (attributes.style || {}) as SchemaAttributes;
		for (const styleName in styles) {
			if (!styles[styleName]) return false;
			if (!this.checkValue(styles, styleName, nodeStyles[styleName]))
				return false;
		}
		return true;
	}
	/**
	 * 检测值是否符合规则
	 * @param rule 规则
	 * @param attributesName 属性名称
	 * @param attributesValue 属性值
	 */
	checkValue(
		schema: SchemaAttributes,
		attributesName: string,
		attributesValue?: string,
		force?: boolean,
	): boolean {
		if (!schema[attributesName]) return false;
		let rule = schema[attributesName];
		if (isSchemaValueObject(rule)) {
			//如果没有值，强制状态就返回 false，非强制就返回 true
			if (attributesValue === undefined) return !rule.required;
			rule = rule.value;
		}
		//默认都不为强制的
		else if (!force || attributesValue === undefined) return true;
		/**
		 * 自定义规则解析
		 */
		if (typeof rule === 'string' && rule.charAt(0) === '@') {
			switch (rule) {
				case '@number':
					rule = /^-?\d+(\.\d+)?$/;
					break;

				case '@length':
					rule = /^-?\d+(\.\d+)?(\w*|%)$/;
					break;

				case '@color':
					rule = /^(rgb(.+?)|#\w{3,6}|\w+)$/i;
					break;

				case '@url':
					rule = validUrl;
					break;
				default:
					break;
			}
		}
		/**
		 * 字符串解析
		 */
		if (typeof rule === 'string') {
			if (rule === '*') {
				return true;
			}

			if (attributesName === 'class') {
				return (attributesValue || '')
					.split(/\s+/)
					.some((value) => value.trim() === rule);
			}

			return rule === attributesValue;
		}
		/**
		 * 数组解析
		 */
		if (Array.isArray(rule)) {
			if (attributesName === 'class') {
				if (!attributesValue) attributesValue = '*';
				return attributesValue
					.split(/\s+/)
					.every((value) =>
						value.trim() === ''
							? true
							: (rule as Array<string>).indexOf(value.trim()) >
							  -1,
					);
			}
			return rule.indexOf(attributesValue) > -1;
		}
		/**
		 * 解析正则表达式
		 */
		if (typeof rule === 'object' && typeof rule.test === 'function') {
			if (attributesName === 'class') {
				return (attributesValue || '')
					.split(/\s+/)
					.every((value) =>
						value.trim() === ''
							? true
							: (rule as RegExp).test(value.trim()),
					);
			}
			return rule.test(attributesValue || '');
		}
		/**
		 * 自定义函数解析
		 */
		if (typeof rule === 'function') {
			return rule(attributesValue);
		}
		return true;
	}
	/**
	 * 过滤节点样式
	 * @param styles 样式
	 * @param rule 规则
	 */
	filterStyles(
		styles: { [k: string]: string },
		rule: SchemaRule,
		callback?: (name: string, value: string) => void,
	) {
		Object.keys(styles).forEach((styleName) => {
			if (
				!rule.attributes?.style ||
				!this.checkValue(
					rule.attributes!.style as SchemaAttributes,
					styleName,
					styles[styleName],
					true,
				)
			) {
				if (callback) callback(styleName, styles[styleName]);
				delete styles[styleName];
			}
		});
	}
	/**
	 * 过滤节点属性
	 * @param attributes 属性
	 * @param rule 规则
	 */
	filterAttributes(
		attributes: { [k: string]: string },
		rule: SchemaRule,
		callback?: (name: string, value: string) => void,
	) {
		Object.keys(attributes).forEach((attributesName) => {
			if (
				!rule.attributes ||
				!this.checkValue(
					rule.attributes as SchemaAttributes,
					attributesName,
					attributes[attributesName],
					true,
				)
			) {
				if (callback)
					callback(attributesName, attributes[attributesName]);
				delete attributes[attributesName];
			}
		});
	}

	/**
	 * 过滤满足node节点规则的属性和样式
	 * @param node 节点，用于获取规则
	 * @param attributes 属性
	 * @param styles 样式
	 * @param apply 是否把过滤的属性和样式应用到节点上
	 * @returns
	 */
	filter(
		node: NodeInterface,
		attributes: { [k: string]: string },
		styles: { [k: string]: string },
		apply: boolean = false,
	) {
		const rule = this.getRule(node);
		if (!rule) return;
		const { globals } = this.data;
		const globalRule = globals[rule.type] ? rule.type : undefined;
		const allRule = Object.assign({}, rule, {
			attributes: merge(
				{},
				rule.attributes,
				globalRule ? globals[globalRule] : {},
			),
		});
		this.filterAttributes(
			attributes,
			allRule,
			apply ? (name) => node.removeAttributes(name) : undefined,
		);
		this.filterStyles(
			styles,
			allRule,
			apply ? (name) => node.css(name, '') : undefined,
		);
	}

	/**
	 * 查找节点符合规则的最顶层的节点名称
	 * @param name 节点名称
	 * @param callback 回调函数，判断是否继续向上查找，返回false继续查找
	 * @returns 最顶级的block节点名称
	 */
	closest(name: string) {
		let topName = name;
		this.data.blocks.forEach((block) => {
			if (block.name !== name) return;
			const schema = block as SchemaBlock;
			if (schema.allowIn) {
				schema.allowIn.forEach((parentName) => {
					if (this.isAllowIn(parentName, topName)) {
						topName = parentName;
					}
				});
				topName = this.closest(topName);
			}
		});
		return topName;
	}
	/**
	 * 判断子节点名称是否允许放入指定的父节点中
	 * @param source 父节点名称
	 * @param target 子节点名称
	 * @returns true | false
	 */
	isAllowIn(source: string, target: string) {
		//p节点下不允许放其它block节点
		if (source === 'p') return false;
		return this.data.blocks.some((block) => {
			if (block.name !== target) return;
			const schema = block as SchemaBlock;
			if (schema.allowIn && schema.allowIn.indexOf(source) > -1) {
				return true;
			}
			return;
		});
	}
	addAllowIn(parent: string, child: string = 'p') {
		const rule = this.data.blocks.find(
			(rule) => rule.name === child,
		) as SchemaBlock;
		if (!rule.allowIn) {
			rule.allowIn = [];
		}
		if (!rule.allowIn.includes(parent)) {
			rule.allowIn.push(parent);
		}
	}
	/**
	 * 获取允许有子block节点的标签集合
	 * @returns
	 */
	getAllowInTags() {
		const tags: Array<string> = [];
		this.data.blocks.forEach((rule) => {
			const schema = rule as SchemaBlock;
			if (schema.allowIn) {
				schema.allowIn.forEach((name) => {
					if (tags.indexOf(name) < 0) tags.push(name);
				});
			}
		});
		return tags;
	}
	/**
	 * 获取能够合并的block节点的标签集合
	 * @returns
	 */
	getCanMergeTags() {
		const tags: Array<string> = [];
		this.data.blocks.forEach((rule) => {
			const schema = rule as SchemaBlock;
			if (schema.canMerge === true) {
				if (tags.indexOf(schema.name) < 0) tags.push(schema.name);
			}
		});
		return tags;
	}
}
export default Schema;

export const isSchemaValueObject = (
	value: SchemaValue,
): value is SchemaValueObject => {
	return (value as SchemaValueObject).required !== undefined;
};

export const isSchemaRule = (
	rule: SchemaRule | SchemaGlobal,
): rule is SchemaRule => {
	return !!rule['name'];
};
