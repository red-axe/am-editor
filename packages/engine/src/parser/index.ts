import tinycolor from 'tinycolor2';
import { NodeInterface } from '../types/node';
import { DATA_ELEMENT, DATA_ID, EDITABLE, UI } from '../constants/root';
import { EditorInterface } from '../types/editor';
import {
	SchemaInterface,
	ParserInterface,
	Callbacks,
	ConversionInterface,
	ConversionRule,
	SchemaRule,
} from '../types';
import {
	ANCHOR_SELECTOR,
	CARD_EDITABLE_KEY,
	CARD_ELEMENT_KEY,
	CARD_KEY,
	CARD_SELECTOR,
	CURSOR_SELECTOR,
	FOCUS_SELECTOR,
} from '../constants';
import {
	escape,
	unescape,
	removeUnit,
	transformCustomTags,
	getListStyle,
	getStyleMap,
} from '../utils';
import TextParser from './text';
import { $ } from '../node';
import { isNodeEntry } from '../node/utils';

const attrsToString = (attributes: { [k: string]: string }) => {
	let attrsString = '';
	for (const key in attributes) {
		if (key === 'style') {
			continue;
		}
		const val = escape(attributes[key]);
		attrsString += ' '.concat(key, '="').concat(val, '"');
	}
	return attrsString.trim();
};

const stylesToString = (styles: { [k: string]: string }) => {
	let stylesString = '';
	for (let key in styles) {
		key = key.toLowerCase();
		let val = escape(styles[key]);

		if (
			/^(padding|margin|text-indent)/.test(key) &&
			removeUnit(val) === 0
		) {
			continue;
		}

		if (key.endsWith('color')) {
			val = tinycolor(val).toHexString();
		}

		stylesString += ' '.concat(key, ': ').concat(val, ';');
	}
	return stylesString.trim();
};

class Parser implements ParserInterface {
	root: NodeInterface;
	private editor: EditorInterface;
	/**
	 * 对节点进行正常化转换，在解析编辑器值的时候设置为false可以提升性能。设置为ture的时候可以对不确定的html进行转换，例如粘贴的时候
	 */
	private isNormalize = true;
	constructor(
		source: string | Node | NodeInterface,
		editor: EditorInterface,
		paserBefore?: (node: NodeInterface) => void,
		isNormalize: boolean = true,
	) {
		this.editor = editor;
		this.isNormalize = isNormalize;
		if (typeof source === 'string') {
			source = source.replace(/<a\s{0,1000}\/>/gi, '<a></a>');
			source = source.replace(/<a(\s[^>]+?)\/>/gi, (_, t) => {
				return '<a'.concat(t, '></a>');
			});
			// 移除掉img事件绑定，img 标签在 DOMParser 中会加载 onload 和 onerror 事件
			source = source?.replace(/<img .*>/gi, (str) => {
				return str.replace(/\son[a-zA-Z]{1,20}=/g, 'notallow=');
			});
			// 在 p 里包含 div 标签时 DOMParser 解析错误
			// <p><div>foo</div></p>
			// 变成
			// <paragraph><div>foo</div></paragraph>
			source = source
				.replace(/<p(>|\s+[^>]*>)/gi, '<paragraph$1')
				.replace(/<\/p(>|\s+[^>]*>)/gi, '</paragraph$1');
			source = transformCustomTags(source);
			const doc = new DOMParser().parseFromString(source, 'text/html');
			const html = doc.body.innerHTML
				.replace(/<paragraph(>|\s+[^>]*>)/gi, '<p$1')
				.replace(/<\/paragraph(>|\s+[^>]*>)/gi, '</p$1');
			this.root = $(`<div>${html}</div>`);
		} else if (isNodeEntry(source)) {
			this.root = source;
		} else {
			this.root = $(source);
		}
		if (paserBefore) paserBefore(this.root);
	}
	convert(
		conversion: ConversionInterface,
		node: NodeInterface,
		schema?: SchemaInterface,
	) {
		let value = conversion.transform(node);
		const oldRules: Array<ConversionRule> = [];
		const nodeApi = this.editor.node;
		let convertAfterNode: NodeInterface | null = null;
		while (value) {
			const { rule } = value;
			oldRules.push(rule);
			const { name, attributes, style } = value.node;
			if (name !== 'card') delete attributes[DATA_ID];
			delete attributes['id'];
			const newNode = $(`<${name} />`);
			nodeApi.setAttributes(newNode, {
				...attributes,
				style,
			});
			//把旧节点的子节点追加到新节点下
			newNode.get<Element>()?.append(...node.get<Element>()!.childNodes);
			if (node.isCard()) {
				node.replaceWith(newNode);
				return newNode;
			} else {
				if (value.replace) {
					node.replaceWith(newNode);
					node = newNode;
				} else {
					//把包含旧子节点的新节点追加到旧节点下
					newNode.each((newNode) => {
						const oldNode = node.get<Element>();
						if (oldNode && oldNode instanceof Element)
							oldNode.append(newNode);
					});
				}
				if (!convertAfterNode || convertAfterNode.length === 0)
					convertAfterNode = newNode;

				if (nodeApi.isBlock(newNode, schema)) {
					//排除之前的过滤规则后再次过滤
					value = conversion.transform(
						newNode,
						(r) => oldRules.indexOf(r) < 0,
					);
					continue;
				}
			}
			//排除之前的过滤规则后再次过滤
			value = conversion.transform(node, (r) => oldRules.indexOf(r) < 0);
		}
		return convertAfterNode;
	}
	normalize(
		root: NodeInterface,
		schema: SchemaInterface,
		conversion: ConversionInterface | null,
	) {
		const editor = this.editor;
		const nodeApi = editor.node;
		const inlineApi = editor.inline;
		//转换标签和分割 mark 和 inline
		// 不分割，就只转换卡片
		if (!this.isNormalize) {
			if (!conversion) return;
			const cards = root.find(CARD_SELECTOR);
			cards.each((_, index) => {
				const cardNode = cards.eq(index);
				if (!cardNode) return;
				this.convert(conversion, cardNode, schema);
			});
			const cursors = root.find(
				`${CURSOR_SELECTOR},${ANCHOR_SELECTOR},${FOCUS_SELECTOR}`,
			);
			cursors.each((_, index) => {
				const cursor = cursors.eq(index);
				if (!cursor) return;
				this.convert(conversion, cursor, schema);
			});
			return;
		}
		// 过滤分割
		const filter = (node: NodeInterface, type: string = 'mark') => {
			//获取节点属性样式
			const attributes = node.attributes();
			const style = getStyleMap(attributes.style || '');
			delete attributes.style;
			if (
				Object.keys(attributes).length === 0 &&
				Object.keys(style).length === 0
			)
				return;
			const attrCount = Object.keys(attributes).length;
			const styleCount = Object.keys(style).length;

			//复制一个节点
			const newNode = node.clone();
			//过滤不符合当前节点规则的属性样式
			schema.filter(node, attributes, style, true);
			//移除 data-id，以免在下次判断类型的时候使用缓存
			newNode.removeAttributes(DATA_ID);
			//移除符合当前节点的属性样式，剩余的属性样式组成新的节点
			const attrKeys = Object.keys(attributes);
			let filterAttrCount = 0;
			attrKeys.forEach((name) => {
				if (attributes[name]) {
					filterAttrCount++;
					newNode.removeAttributes(name);
				}
			});
			let filterStyleCount = 0;
			const styleKeys = Object.keys(style);
			styleKeys.forEach((name) => {
				if (style[name]) {
					filterStyleCount++;
					newNode.css(name, '');
				}
			});
			// 如果这个节点过滤掉所有属性样式后还是一个有效的节点就替换掉当前节点
			if (
				((filterAttrCount === attrCount &&
					filterStyleCount === styleCount) ||
					(filterAttrCount === 0 && filterStyleCount === 0)) &&
				schema.getType(newNode) === type
			) {
				node.before(newNode);
				const children = node.children();
				newNode.append(
					children.length > 0
						? children
						: type === 'block'
						? '<br />'
						: $('\u200b', null),
				);
				node.remove();
				node = newNode;
				return;
			}
			if (newNode.attributes('style').trim() === '')
				newNode.removeAttributes('style');
			return newNode;
		};
		root.traverse((node) => {
			if (
				node[0] === root[0] ||
				['style', 'script', 'meta'].includes(node.name)
			)
				return;
			if (node.isElement()) {
				const isCard = node.isCard();
				//转换标签
				if (conversion && (!schema.getType(node) || isCard)) {
					const newNode = this.convert(conversion, node, schema);
					if (newNode) {
						if (isCard) return true;
						return newNode;
					}
				}
				if (isCard) return;
				//当前节点是 mark 节点
				if (nodeApi.isMark(node, schema)) {
					//过滤掉当前mark节点属性样式并使用剩下的属性样式组成新的节点
					const oldRules: Array<SchemaRule> = [];
					let rule = schema.getRule(node);
					if (rule) {
						oldRules.push(rule);
						if (node.get<Element>()?.childNodes.length === 0) {
							editor.mark.repairCursor(node);
						}
						let newNode = filter(node);
						if (!newNode) return;
						//获取这个新的节点所属类型，并且不能是之前节点一样的规则
						let type = schema.getType(
							newNode,
							(rule) =>
								rule.name === newNode!.name &&
								rule.type === 'mark' &&
								oldRules.indexOf(rule) < 0,
						);
						if (!type) {
							if (conversion) {
								const newChildren = this.convert(
									conversion,
									newNode,
									schema,
								);
								if (newChildren && newChildren.length > 0) {
									const children = node.children();
									newChildren.append(
										children.length > 0
											? children
											: $('\u200b', null),
									);
									node.append(
										newNode.length === 0
											? newChildren
											: newNode.children(),
									);
									return;
								}
							}
						}

						//如果是mark节点，使用新节点包裹旧节点子节点
						let tempNode = node;
						while (type === 'mark') {
							const children = tempNode.children();
							let appendTarget = newNode;
							while (true) {
								const children = appendTarget.children();
								if (children.length > 0) {
									appendTarget = children;
								} else {
									break;
								}
							}
							appendTarget.append(
								children.length > 0
									? children
									: $('\u200b', null),
							);
							tempNode.append(newNode);
							tempNode = newNode;
							newNode = filter(newNode);
							if (!newNode) break;
							//获取这个新的节点所属类型，并且不能是之前节点一样的规则
							type = schema.getType(
								newNode,
								(rule) =>
									rule.name === newNode!.name &&
									rule.type === 'mark' &&
									oldRules.indexOf(rule) < 0,
							);
							if (!type) {
								if (conversion) {
									const newChildren = this.convert(
										conversion,
										newNode,
										schema,
									);
									if (newChildren && newChildren.length > 0) {
										newNode =
											newNode.length > 0
												? newNode.children()
												: newChildren;
										type = 'mark';
										continue;
									}
								}
								break;
							}
							rule = schema.getRule(newNode);
							if (!rule) break;
							oldRules.push(rule);
						}
					}
				} else if (nodeApi.isInline(node)) {
					//当前节点是 inline 节点，inline 节点不允许嵌套、不允许放入mark节点
					return inlineApi.flat(node, schema);
				}
			} else if (node.isText()) {
				const text = node.text();
				if (/^\n/.test(text) || /^\s/.test(text)) {
					const element = node.get<Text>()!;
					const prev = element.previousSibling;
					const next = element.nextSibling;
					const prevType: string | undefined = prev
						? schema.getType(prev)
						: undefined;
					const nextType: string | undefined = next
						? schema.getType(next)
						: undefined;
					// 节点前面
					if (!prev && next && (!nextType || nextType === 'block')) {
						node.remove();
						return;
					}
					// 节点后面
					if (!next && prev && (!prevType || prevType === 'block')) {
						node.remove();
					}
				}
			}
		});
	}

	traverse(
		node: NodeInterface,
		schema: SchemaInterface | null = null,
		conversion: ConversionInterface | null,
		callbacks: Callbacks,
		includeCard?: boolean,
	) {
		const nodeApi = this.editor.node;

		let child = node.first();
		while (child) {
			if (['style', 'script', 'meta'].includes(child.name)) {
				child = child.next();
				continue;
			}
			if (child.isElement()) {
				let name = child.name;
				let attributes = child.attributes();
				if (attributes[DATA_ELEMENT] === UI) {
					child = child.next();
					continue;
				}
				let styles = getStyleMap(attributes.style || '');
				//删除属性中的style属性
				delete attributes.style;

				// Card Combine 相关节点
				if (
					['left', 'right'].indexOf(attributes[CARD_ELEMENT_KEY]) >= 0
				) {
					child = child.next();
					continue;
				}
				let passed = true;
				let type: 'inline' | 'block' | 'mark' | undefined = undefined;
				if (schema && attributes[DATA_ELEMENT] !== EDITABLE) {
					//不符合规则，跳过
					type = schema.getType(child);
					if (type === undefined) {
						passed = false;
						const parent = child.parent();
						if (
							parent &&
							nodeApi.isBlock(parent, schema) &&
							// 子节点只有一个
							parent.get<HTMLElement>()?.childNodes.length ===
								1 &&
							// 没有子节点
							child.get<HTMLElement>()?.childNodes.length === 0
						) {
							const newChild = $('<br />');
							child.before(newChild);
							child.remove();
							child = newChild;
							name = newChild.name;
							attributes = {};
							styles = {};
							passed = true;
						}
					} else {
						//过滤不符合规则的属性和样式
						schema.filter(child, attributes, styles);
					}
				}
				// 执行回调函数
				if (
					attributes[CARD_ELEMENT_KEY] !== 'center' &&
					callbacks.onOpen &&
					passed
				) {
					const result = callbacks.onOpen(
						child,
						name,
						attributes,
						styles,
					);
					//终止遍历当前节点
					if (result === false) {
						child = child.next();
						continue;
					}
				}
				// Card不遍历子节点
				if (
					(name !== 'card' &&
						(!attributes[CARD_KEY] ||
							attributes[CARD_EDITABLE_KEY] === 'true')) ||
					includeCard
				) {
					this.traverse(
						child,
						schema,
						conversion,
						callbacks,
						includeCard,
					);
				}
				// 执行回调函数
				if (
					attributes[CARD_ELEMENT_KEY] !== 'center' &&
					callbacks.onClose &&
					passed
				) {
					callbacks.onClose(child, name, attributes, styles);
				}
			} else if (child.isText()) {
				let text = child[0].nodeValue ? escape(child[0].nodeValue) : '';
				if (
					text === '' &&
					nodeApi.isBlock(child.parent()!, schema || undefined)
				) {
					if (!child.prev()) {
						text = text.replace(/^[ \n]+/, '');
					}

					if (!child.next()) {
						text = text.replace(/[ \n]+$/, '');
					}
				}
				const childPrev = child.prev();
				const childNext = child.next();
				if (
					childPrev &&
					nodeApi.isBlock(childPrev, schema || undefined) &&
					childNext &&
					nodeApi.isBlock(childNext, schema || undefined) &&
					text.trim() === ''
				) {
					text = text.trim();
				}
				// 删除 zero width space，删除后会导致空行中如果有mark节点，那么空行会没有高度
				// text = text.replace(/\u200B/g, '');
				if (callbacks.onText) {
					callbacks.onText(child, text);
				}
			}
			child = child.next();
		}
	}
	/**
	 * 遍历 DOM 树，生成符合标准的 XML 代码
	 * @param schema 标签保留规则
	 * @param conversion 标签转换规则
	 * @param replaceSpaces 是否替换空格
	 * @param customTags 是否将光标、卡片节点转换为标准代码
	 */
	toValue(
		schema: SchemaInterface | null = null,
		conversion: ConversionInterface | null = null,
		replaceSpaces: boolean = false,
		customTags: boolean = false,
	) {
		const result: Array<string> = [];
		const editor = this.editor;
		const nodeApi = editor.node;
		const root = this.root.clone(true);
		if (schema) this.normalize(root, schema, conversion);
		editor.trigger('parse:value-before', root);
		this.traverse(root, schema, conversion, {
			onOpen: (child, name, attributes, styles) => {
				if (
					editor.trigger(
						'parse:value',
						child,
						attributes,
						styles,
						result,
					) === false
				)
					return false;

				result.push('<');
				result.push(name);

				if (Object.keys(attributes).length > 0) {
					result.push(' ' + attrsToString(attributes));
				}

				if (Object.keys(styles).length > 0) {
					const stylesString = stylesToString(styles);
					if (stylesString !== '') {
						result.push(' style="');
						result.push(stylesString);
						result.push('"');
					}
				}

				if (
					nodeApi.isVoid(name, schema ? schema : undefined) &&
					child.get<HTMLElement>()?.childNodes.length === 0
				) {
					result.push(' />');
				} else {
					result.push('>');
				}
				return;
			},
			onText: (_, text) => {
				if (replaceSpaces && text.length > 1) {
					text = text.replace(/[\u00a0 ]+/g, (item) => {
						const strArray = [];
						item = item.replace(/\u00a0/g, ' ');
						for (let n = 0; n < item.length; n++)
							strArray[n] = n % 2 == 0 ? item[n] : ' ';
						return strArray.join('');
					});
				}
				result.push(text);
			},
			onClose: (_, name) => {
				if (nodeApi.isVoid(name, schema ? schema : undefined)) return;
				result.push('</'.concat(name, '>'));
			},
		});
		editor.trigger('parse:value-after', result);
		//移除前后的换行符
		if (result.length > 0 && /^\n+/g.test(result[0])) {
			result[0] = result[0].replace(/^\n+/g, '');
		}
		if (result.length > 0 && /\n+$/g.test(result[result.length - 1])) {
			result[result.length - 1] = result[result.length - 1].replace(
				/\n+$/g,
				'',
			);
		}
		const value = result.join('');
		return customTags ? transformCustomTags(value) : value;
	}

	/**
	 * 转换为HTML代码
	 * @param inner 内包裹节点
	 * @param outter 外包裹节点
	 */
	toHTML(inner?: Node, outter?: Node) {
		const element = $('<div />');
		const editor = this.editor;
		const style = editor.container.css();
		if (inner && outter) {
			$(inner).append(this.root).css(style);
			element.append(outter);
		} else {
			element.append(this.root);
		}
		editor.trigger('parse:html-before', this.root);
		editor.trigger('parse:html', element);
		editor.trigger('parse:html-after', element);
		return element.html().replace(/\u200b/g, '');
	}

	/**
	 * 返回DOM树
	 */
	toDOM(
		schema: SchemaInterface | null = null,
		conversion: ConversionInterface | null,
	) {
		const value = this.toValue(schema, conversion, false, true);
		const doc = new DOMParser().parseFromString(value, 'text/html');
		const fragment = doc.createDocumentFragment();
		const nodes = doc.body.childNodes;

		while (nodes.length > 0) {
			const node = nodes[0];
			fragment.appendChild(node);
		}
		return fragment;
	}

	/**
	 * 转换为文本
	 * @param schema Schema 规则
	 * @param includeCard 是否遍历卡片内部
	 * @param formatOL 是否格式化有序列表，<ol><li>a</li><li>b</li></ol>  ->  1. a  2. b
	 */
	toText(
		schema: SchemaInterface | null = null,
		includeCard?: boolean,
		formatOL: boolean = true,
	) {
		const root = this.root.clone(true);
		const result: Array<string> = [];
		const editor = this.editor;
		this.traverse(
			root,
			null,
			null,
			{
				onOpen: (node, name, attributes, styles) => {
					if (
						editor.trigger(
							'parse:text',
							node,
							attributes,
							styles,
							result,
						) === false
					) {
						return false;
					}
					if (name === 'br') {
						result.push('\n');
					}
					if (formatOL && node.name === 'li') {
						if (node.hasClass(editor.list.CUSTOMZIE_LI_CLASS)) {
							return;
						}
						const parent = node.parent();
						const styleType = parent?.css('listStyleType');
						if (parent?.name === 'ol') {
							const start = parent[0]['start'];
							const index = start ? start : 1;
							result.push(`${getListStyle(styleType, index)}. `);
							parent.attributes('start', index + 1);
						} else if (parent?.name === 'ul') {
							result.push(getListStyle(styleType) + ' ');
						}
					}
					return;
				},
				onText: (_, text) => {
					text = unescape(text);
					text = text.replace(/\u00a0/g, ' ');
					text = text.replace(/\u200b/g, '');
					result.push(text);
				},
				onClose: (node, name) => {
					const nodeApi = editor.node;
					if (
						name === 'p' ||
						nodeApi.isBlock(node, schema || editor.schema)
					) {
						const children = Array.from(
							node.get<HTMLElement>()!.childNodes,
						);
						// 子节点还有block节点，则不换行
						if (
							children.length === 0 ||
							children.some((child) => {
								if (child instanceof Text) return false;
								if (child.nodeName === 'BR') return true;
								const type = (schema || editor.schema).getType(
									child,
								);
								if (!type || type === 'block') return true;
								return false;
							})
						)
							return;
						result.push('\n');
					}
				},
			},
			includeCard,
		);
		return result.join('').trim();
	}
}
export default Parser;
export { TextParser };
