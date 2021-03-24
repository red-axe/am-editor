import { cloneDeep, merge, omit } from 'lodash';
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
} from './types';
import { validUrl } from './utils';

/**
 * 标签规则
 */
class Schema implements SchemaInterface {
	private _map: { [key: string]: SchemaMap } = {};
	data: {
		blocks: Array<SchemaRule>;
		inlines: Array<SchemaRule>;
		marks: Array<SchemaRule>;
		globals: SchemaAttributes | SchemaStyle;
	} = {
		blocks: [],
		inlines: [],
		marks: [],
		globals: {},
	};

	/**
	 * 增加规则，不允许设置div标签，div将用作card使用
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
				if (rule.type === 'block') {
					this.data.blocks.push(rule);
				} else if (rule.type === 'inline') {
					this.data.inlines.push(rule);
				} else if (rule.type === 'mark') {
					this.data.marks.push(rule);
				}
			} else if (!!this.data[`${rule.type}s`]) {
				this.data.globals[rule.type] = merge(
					this.data.globals[rule.type],
					rule.attributes,
				);
			}
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
	/**
	 * 检测节点的属性和值是否符合规则
	 * @param node 节点
	 * @param type 指定类型
	 */
	check(node: NodeInterface, type?: 'block' | 'mark' | 'inline'): boolean {
		const map = this.getMapCache(type);
		if (!map[node.name]) return false;
		const attributes = node.attributes();
		const styles = node.css();
		delete attributes['style'];
		return (
			Object.keys(styles).every(styleName =>
				this.checkStyle(node.name, styleName, styles[styleName], type),
			) &&
			Object.keys(attributes).every(attributesName =>
				this.checkAttributes(
					node.name,
					attributesName,
					attributes[attributesName],
					type,
				),
			)
		);
	}
	/**
	 * 检测节点是否符合某一属性规则
	 * @param node 节点
	 * @param type 节点类型 "block" | "mark" | "inline"
	 * @param attributes 属性规则
	 */
	checkNode(
		node: NodeInterface,
		type: 'block' | 'mark' | 'inline',
		attributes?: SchemaAttributes | SchemaStyle,
	): boolean {
		//获取节点属性
		const nodeAttributes = node.attributes();
		const nodeStyles = node.css();
		delete nodeAttributes['style'];
		//将全局属性合并到属性
		attributes = { ...this.data.globals[type], ...attributes };

		const styles = (attributes || {}).style as SchemaAttributes;
		attributes = omit(attributes, 'style');
		//需要属性和规则数量匹配一致，并且每一项都能效验通过
		return (
			Object.keys(nodeAttributes || {}).every(attributesName => {
				return this.checkValue(
					attributes as SchemaAttributes,
					attributesName,
					nodeAttributes[attributesName],
				);
			}) &&
			Object.keys(nodeStyles).every(styleName => {
				return this.checkValue(
					styles,
					styleName,
					nodeStyles[styleName],
				);
			})
		);
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
		return this.checkValue(rule, attributesName, attributesValue);
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
				return attributesValue
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
				return attributesValue
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
				return attributesValue
					.split(/\s+/)
					.every(value =>
						value.trim() === ''
							? true
							: (rule as RegExp).test(value.trim()),
					);
			}
			return rule.test(attributesValue);
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
				data[rule.name] = merge(data[rule.name], attributes);
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
	closest(
		name: string,
		callback?: (current: string, target: string) => boolean,
	) {
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
						if (callback && callback(name, parentName)) {
							topName = parentName;
						} else {
							topName = this.closest(parentName);
						}
					});
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
		return this.data.blocks.some(block => {
			const schema = block as SchemaBlock;
			if (schema.name === source && schema.allowIn) {
				const isAllowIn = schema.allowIn.indexOf(target) > -1;
				if (isAllowIn) return true;
				schema.allowIn.some(name => this.isAllowIn(name, target));
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
			const name = this.closest(
				rule.name,
				(current: string, target: string) => {
					if (current !== target && tags.indexOf(target) < 0) {
						tags.push(target);
					}
					return false;
				},
			);
			if (rule.name !== name && tags.indexOf(name) < 0) {
				tags.push(name);
			}
		});
		return tags;
	}
}
export default Schema;
