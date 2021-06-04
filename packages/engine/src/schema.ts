import { cloneDeep, merge, omit } from 'lodash-es';
import {
	isSchemaRule,
	NodeInterface,
	SchemaAttributes,
	SchemaBlock,
	SchemaGlobal,
	SchemaInterface,
	SchemaMap,
	SchemaRule,
	SchemaStyle,
	SchemaValue,
	SchemaValueObject,
} from './types';
import { validUrl } from './utils';

/**
 * 标签规则
 */
class Schema implements SchemaInterface {
	private _map: { [key: string]: SchemaMap } = {};
	private _all: Array<SchemaRule> = [];

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

		rules.forEach(rule => {
			if (isSchemaRule(rule)) {
				//删除全局属性已有的规则
				if (rule.attributes) {
					Object.keys(rule.attributes).forEach(key => {
						if (!this.data.globals[rule.type]) return;
						if (key === 'style') {
							Object.keys(rule.attributes!.style).forEach(
								styleName => {
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
					{ ...this.data.globals[rule.type] },
					rule.attributes,
				);
			}
		});

		//按照必要属性个数排序
		const getCount = (rule: SchemaRule) => {
			const aAttributes = rule.attributes || {};
			const aStyles = aAttributes.style || {};
			let aCount = 0;
			let sCount = 0;
			Object.keys(aAttributes).forEach(attributesName => {
				const attributesValue = aAttributes[attributesName];
				if (
					isSchemaValueObject(attributesValue) &&
					attributesValue.required
				)
					aCount++;
			});
			Object.keys(aStyles).forEach(stylesName => {
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
		this._map = {};
	}
	/**
	 * 克隆当前schema对象
	 */
	clone() {
		const schema = new Schema();
		schema.data = cloneDeep(this.data);
		return schema;
	}

	/**
	 * 查找规则
	 * @param callback 查找条件
	 */
	find(callback: (rule: SchemaRule) => boolean): Array<SchemaRule> {
		let schemas: Array<SchemaRule> = [];
		Object.keys(this.data).some(key => {
			if (key !== 'globals') {
				const rules = (this.data[key] as Array<
					SchemaRule
				>).filter(rule => callback(rule));
				if (rules && rules.length > 0) {
					schemas = schemas.concat(rules);
				}
			}
			return;
		});
		return schemas;
	}

	getType(node: NodeInterface) {
		return this._all.find(
			rule =>
				rule.name === node.name &&
				this.checkNode(node, rule.attributes),
		)?.type;
	}

	/**
	 * 检测节点是否符合某一属性规则
	 * @param node 节点
	 * @param attributes 属性规则
	 */
	checkNode(
		node: NodeInterface,
		attributes?: SchemaAttributes | SchemaStyle,
	): boolean {
		//获取节点属性
		const nodeAttributes = node.attributes();
		const nodeStyles = node.css();
		delete nodeAttributes['style'];
		const styles = (attributes || {}).style as SchemaAttributes;
		attributes = omit({ ...attributes }, 'style');
		//需要属性每一项都能效验通过
		const attrResult = Object.keys(attributes).every(attributesName => {
			return this.checkValue(
				attributes as SchemaAttributes,
				attributesName,
				nodeAttributes[attributesName],
			);
		});
		if (!attrResult) return false;
		return Object.keys(styles || {}).every(styleName => {
			return this.checkValue(styles, styleName, nodeStyles[styleName]);
		});
	}
	/**
	 * 检测样式值是否符合节点样式规则
	 * @param name 节点名称
	 * @param styleName 样式名称
	 * @param styleValue 样式值
	 * @param type 指定类型
	 */
	checkStyle(
		name: string,
		styleName: string,
		styleValue: string,
		type?: 'block' | 'mark' | 'inline',
	) {
		//根据节点名称查找属性规则
		const map = this.getMapCache(type);
		if (!map[name]) return false;
		//没有规则返回false
		let rule = map[name].style as SchemaAttributes;
		if (!rule) return false;
		return this.checkValue(rule, styleName, styleValue);
	}
	/**
	 * 检测值是否符合节点属性的规则
	 * @param name 节点名称
	 * @param attributesName 属性名称
	 * @param attributesValue 属性值
	 * @param type 指定类型
	 */
	checkAttributes(
		name: string,
		attributesName: string,
		attributesValue: string,
		type?: 'block' | 'mark' | 'inline',
	) {
		//根据节点名称查找属性规则
		const map = this.getMapCache(type);
		//没有规则返回false
		if (!map[name]) return false;
		let rule = map[name] as SchemaAttributes;
		if (!rule) return false;
		return this.checkValue(
			{ ...omit(rule, 'style') },
			attributesName,
			attributesValue,
		);
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
		attributesValue: string,
	): boolean {
		if (!schema[attributesName]) return false;
		let rule = schema[attributesName];
		if (isSchemaValueObject(rule)) {
			//如果没有值，强制状态就返回 false，非强制就返回 true
			if (attributesValue === undefined) return !rule.required;
			rule = rule.value;
		}
		//默认都不为强制的
		else if (attributesValue === undefined) return true;
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
					.some(value => value.trim() === rule);
			}

			return rule === attributesValue;
		}
		/**
		 * 数组解析
		 */
		if (Array.isArray(rule)) {
			if (attributesName === 'class') {
				return (attributesValue || '')
					.split(/\s+/)
					.every(value =>
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
					.every(value =>
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
	 * @param name 节点名称
	 * @param styles 样式
	 * @param type 指定类型
	 */
	filterStyles(
		name: string,
		styles: { [k: string]: string },
		type?: 'block' | 'mark' | 'inline',
	) {
		Object.keys(styles).forEach(styleName => {
			if (!this.checkStyle(name, styleName, styles[styleName], type))
				delete styles[styleName];
		});
	}
	/**
	 * 过滤节点属性
	 * @param name 节点名称
	 * @param attributes 属性
	 * @param type 指定类型
	 */
	filterAttributes(
		name: string,
		attributes: { [k: string]: string },
		type?: 'block' | 'mark' | 'inline',
	) {
		Object.keys(attributes).forEach(attributesName => {
			if (
				!this.checkAttributes(
					name,
					attributesName,
					attributes[attributesName],
					type,
				)
			)
				delete attributes[attributesName];
		});
	}
	/**
	 * 将相同标签的属性和gloals属性合并转换为map格式
	 * @param type 指定转换的类别 "block" | "mark" | "inline"
	 */
	toAttributesMap(type?: 'block' | 'mark' | 'inline'): SchemaMap {
		const data: SchemaMap = {};

		Object.keys(this.data.globals).forEach(dataType => {
			if (type !== undefined && dataType !== type) return;
			const globalAttributes = this.data.globals[dataType];
			this.data[dataType + 's'].forEach((rule: SchemaRule) => {
				data[rule.name] = merge(
					{ ...rule.attributes },
					{ ...globalAttributes },
				);
			});
		});

		Object.keys(this.data).forEach(dataType => {
			if (
				dataType === 'globals' ||
				(type !== undefined && dataType !== `${type}s`)
			)
				return;
			const rules = this.data[dataType];

			rules.forEach((rule: SchemaRule) => {
				let attributes = { ...rule.attributes };
				if (type === undefined && !!data[rule.name]) {
					Object.keys(data[rule.name]).forEach(key => {
						const dataValue = data[rule.name][key];
						const ruleValue = attributes[key];
						if (
							typeof dataValue === 'string' &&
							typeof ruleValue === 'string' &&
							dataValue !== ruleValue
						) {
							attributes[key] = [dataValue, ruleValue];
						} else if (
							Array.isArray(dataValue) &&
							typeof ruleValue === 'string' &&
							dataValue.indexOf(ruleValue) < 0
						) {
							attributes[key] = dataValue;
							attributes[key].push(ruleValue);
						} else if (
							Array.isArray(ruleValue) &&
							typeof dataValue === 'string' &&
							ruleValue.indexOf(dataValue) < 0
						) {
							attributes[key].push(dataValue);
						} else if (
							Array.isArray(ruleValue) &&
							Array.isArray(dataValue)
						) {
							dataValue.forEach(value => {
								if (ruleValue.indexOf(value) < 0) {
									attributes[key].push(value);
								}
							});
						}
					});
				}
				data[rule.name] = merge({ ...data[rule.name] }, attributes);
			});
		});
		return data;
	}

	/**
	 * 获取合并后的Map格式
	 * @param 类型，默认为所有
	 */
	getMapCache(type?: 'block' | 'mark' | 'inline') {
		const key = type || '*';
		if (!this._map[key]) this._map[key] = this.toAttributesMap(type);

		return this._map[key];
	}
	/**
	 * 查找节点符合规则的最顶层的节点名称
	 * @param name 节点名称
	 * @param callback 回调函数，判断是否继续向上查找，返回false继续查找
	 * @returns 最顶级的block节点名称
	 */
	closest(name: string) {
		let topName = name;
		this.data.blocks
			.filter(rule => rule.name === name)
			.forEach(block => {
				const schema = block as SchemaBlock;
				if (schema.allowIn) {
					schema.allowIn.forEach(parentName => {
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
		//目标节点是p标签
		if (target === 'p' && source !== 'p') return true;
		return this.data.blocks
			.filter(rule => rule.name === target)
			.some(block => {
				const schema = block as SchemaBlock;
				if (schema.allowIn && schema.allowIn.indexOf(source) > -1) {
					return true;
				}
				return;
			});
	}
	/**
	 * 获取允许有子block节点的标签集合
	 * @returns
	 */
	getAllowInTags() {
		const tags: Array<string> = [];
		this.data.blocks.forEach(rule => {
			const schema = rule as SchemaBlock;
			if (schema.allowIn) {
				schema.allowIn.forEach(name => {
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
		this.data.blocks.forEach(rule => {
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
