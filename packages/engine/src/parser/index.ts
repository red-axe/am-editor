import { NodeInterface } from '../types/node';
import { DATA_ELEMENT, EDITABLE } from '../constants/root';
import { EditorInterface } from '../types/engine';
import {
	SchemaInterface,
	isNodeEntry,
	ParserInterface,
	Callbacks,
	ConversionInterface,
	ConversionRule,
	SchemaRule,
} from '../types';
import { CARD_ELEMENT_KEY, CARD_KEY, READY_CARD_KEY } from '../constants';
import {
	escape,
	unescape,
	removeUnit,
	toHex,
	transformCustomTags,
	getListStyle,
	getWindow,
} from '../utils';
import TextParser from './text';
import { $ } from '../node';

const style = {
	'letter-spacing': '.05em',
	'outline-style': 'none',
	'overflow-wrap': 'break-word',
};

const escapeAttr = (value: string) => {
	return value
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
};

const attrsToString = (attrs: { [k: string]: string }) => {
	let attrsString = '';
	Object.keys(attrs).forEach((key) => {
		if (key === 'style') {
			return;
		}
		const val = escapeAttr(attrs[key]);
		attrsString += ' '.concat(key, '="').concat(val, '"');
	});
	return attrsString.trim();
};

const stylesToString = (styles: { [k: string]: string }) => {
	let stylesString = '';
	Object.keys(styles).forEach((key) => {
		let val = escape(styles[key]);

		if (
			/^(padding|margin|text-indent)/.test(key) &&
			removeUnit(val) === 0
		) {
			return;
		}

		if (/[^a-z]color$/.test(key)) {
			val = toHex(val);
		}

		stylesString += ' '.concat(key, ': ').concat(val, ';');
	});
	return stylesString.trim();
};

class Parser implements ParserInterface {
	private root: NodeInterface;
	private editor: EditorInterface;
	constructor(
		source: string | Node | NodeInterface,
		editor: EditorInterface,
		paserBefore?: (node: NodeInterface) => void,
	) {
		this.editor = editor;
		const { node } = this.editor;
		if (typeof source === 'string') {
			source = source.replace(/<a\s{0,1000}\/>/gi, '<a></a>');
			source = source.replace(/<a(\s[^>]+?)\/>/gi, (_, t) => {
				return '<a'.concat(t, '></a>');
			});
			// bugfix：在 p 里包含 div 标签时 DOMParser 解析错误
			// <p><div>foo</div></p>
			// 变成
			// <p></p><div>foo</div><p></p>
			source = source
				.replace(/<p(>|\s+[^>]*>)/gi, '<paragraph$1')
				.replace(/<\/p>/gi, '</paragraph>');
			source = transformCustomTags(source);
			const doc = new (getWindow().DOMParser)().parseFromString(
				source,
				'text/html',
			);
			this.root = $(doc.body);
			const p = $('<p></p>');
			const paragraphs = this.root.find('paragraph');
			paragraphs.each((_, index) => {
				const cNode = paragraphs.eq(index);
				if (!cNode) return;
				const pNode = p.clone();
				const attributes = cNode.attributes();
				Object.keys(attributes).forEach((name) => {
					pNode.attributes(name, attributes[name]);
				});
				node.replace(cNode, pNode);
			});
		} else if (isNodeEntry(source)) {
			this.root = source;
		} else {
			this.root = $(source);
		}
		if (paserBefore) paserBefore(this.root);
	}
	normalize(
		root: NodeInterface,
		schema: SchemaInterface,
		conversion: ConversionInterface | null,
	) {
		const nodeApi = this.editor.node;
		const inlineApi = this.editor.inline;
		//转换标签和分割 mark 和 inline 标签
		root.traverse((node) => {
			if (node.equal(root)) return;
			if (node.isElement()) {
				//转换标签
				if (conversion) {
					let value = conversion.transform(node);
					const oldRules: Array<ConversionRule> = [];
					while (value) {
						const { rule } = value;
						oldRules.push(rule);
						const { name, attributes, style } = value.node;
						const newNode = $(`<${name} />`);
						nodeApi.setAttributes(newNode, {
							...attributes,
							style,
						});
						//把旧节点的子节点追加到新节点下
						newNode.append(node.children());
						if (
							node.attributes(CARD_KEY) ||
							node.attributes(READY_CARD_KEY)
						) {
							node.before(newNode);
							node.remove();
							value = undefined;
							continue;
						} else {
							//把包含旧子节点的新节点追加到旧节点下
							node.append(newNode);
						}
						//排除之前的过滤规则后再次过滤
						value = conversion.transform(
							node,
							(r) => oldRules.indexOf(r) < 0,
						);
					}
				}
				if (
					node.attributes(CARD_KEY) ||
					node.attributes(READY_CARD_KEY)
				)
					return;
				//分割
				const filter = (node: NodeInterface) => {
					//获取节点属性样式
					const attributes = node.attributes();
					const style = node.css();
					delete attributes.style;
					if (
						Object.keys(attributes).length === 0 &&
						Object.keys(style).length === 0
					)
						return;
					//过滤不符合当前节点规则的属性样式
					schema.filter(node, attributes, style);
					//复制一个节点
					const newNode = node.clone();
					//移除 data-id，以免在下次判断类型的时候使用缓存
					newNode.removeAttributes('data-id');
					//移除符合当前节点的属性样式，剩余的属性样式组成新的节点
					Object.keys(attributes).forEach((name) => {
						if (attributes[name]) {
							newNode.removeAttributes(name);
						}
					});
					Object.keys(style).forEach((name) => {
						if (style[name]) {
							newNode.css(name, '');
						}
					});
					if (newNode.attributes('style').trim() === '')
						newNode.removeAttributes('style');
					return newNode;
				};
				//当前节点是 inline 节点，inline 节点不允许嵌套、不允许放入mark节点
				inlineApi.normal(node);
				//当前节点是 mark 节点
				if (nodeApi.isMark(node)) {
					//过滤掉当前mark节点属性样式并使用剩下的属性样式组成新的节点
					const oldRules: Array<SchemaRule> = [];
					let rule = schema.getRule(node);
					if (rule) {
						oldRules.push(rule);
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
						//如果是mark节点，使用新节点包裹旧节点子节点
						while (type === 'mark') {
							newNode.append(node.children());
							node.append(newNode);
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
							if (!type) break;
							rule = schema.getRule(newNode);
							if (!rule) break;
							oldRules.push(rule);
						}
					}
				}
			}
		});
	}
	/**
	 * data type:
	 *
	 * Value: <p>foo</p><p><br /><cursor /></p>
	 * LowerValue: <p>foo</p><p><br /><span data-element="cursor"></span></p>
	 * DOM: HTML DOM tree
	 * Markdown: ### heading
	 * Text: plain text
	 *
	 */
	walkTree(
		node: NodeInterface,
		schema: SchemaInterface | null = null,
		conversion: ConversionInterface | null,
		callbacks: Callbacks,
		includeCard?: boolean,
	) {
		const nodeApi = this.editor.node;

		let child = node.first();
		while (child) {
			if (child.isElement()) {
				let name = child.name;
				let attrs = child.attributes();
				let styles = child.css();
				//删除属性中的style属性
				delete attrs.style;

				// Card Combine 相关节点
				if (['left', 'right'].indexOf(attrs[CARD_ELEMENT_KEY]) >= 0) {
					child = child.next();
					continue;
				}
				let passed = true;
				let type: 'inline' | 'block' | 'mark' | undefined = undefined;
				if (schema && attrs[DATA_ELEMENT] !== EDITABLE) {
					//不符合规则，跳过
					type = schema.getType(child);
					if (type === undefined) {
						passed = false;
					} else {
						//过滤不符合规则的属性和样式
						schema.filter(child, attrs, styles);
					}
				}
				// 执行回调函数
				if (
					attrs[CARD_ELEMENT_KEY] !== 'center' &&
					callbacks.onOpen &&
					passed
				) {
					const result = callbacks.onOpen(child, name, attrs, styles);
					//终止遍历当前节点
					if (result === false) {
						child = child.next();
						continue;
					}
				}
				// Card不遍历子节点
				if (name !== 'card' || includeCard) {
					this.walkTree(
						child,
						schema,
						conversion,
						callbacks,
						includeCard,
					);
				}
				// 执行回调函数
				if (
					attrs[CARD_ELEMENT_KEY] !== 'center' &&
					callbacks.onClose &&
					passed
				) {
					callbacks.onClose(child, name, attrs, styles);
				}
			} else if (child.isText()) {
				let text = child[0].nodeValue ? escape(child[0].nodeValue) : '';
				// 为了简化 DOM 操作复杂度，删除 block 两边的空白字符，不影响渲染展示
				if (text === '' && nodeApi.isBlock(child.parent()!)) {
					if (!child.prev()) {
						text = text.replace(/^[ \n]+/, '');
					}

					if (!child.next()) {
						text = text.replace(/[ \n]+$/, '');
					}
				}
				// 删除两个 block 中间的空白字符
				// <p>foo</p>\n<p>bar</p>
				const childPrev = child.prev();
				const childNext = child.next();
				if (
					childPrev &&
					nodeApi.isBlock(childPrev) &&
					childNext &&
					nodeApi.isBlock(childNext) &&
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
		const nodeApi = this.editor.node;
		const root = this.root.clone(true);
		if (schema) this.normalize(root, schema, conversion);
		this.editor.trigger('paser:value-before', root);
		this.walkTree(root, schema, conversion, {
			onOpen: (child, name, attrs, styles) => {
				if (
					this.editor.trigger(
						'paser:value',
						child,
						attrs,
						styles,
						result,
					) === false
				)
					return false;

				result.push('<');
				result.push(name);

				if (Object.keys(attrs).length > 0) {
					result.push(' ' + attrsToString(attrs));
				}

				if (Object.keys(styles).length > 0) {
					const stylesString = stylesToString(styles);
					if (stylesString !== '') {
						result.push(' style="');
						result.push(stylesString);
						result.push('"');
					}
				}

				if (nodeApi.isVoid(name, schema ? schema : undefined)) {
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
		this.editor.trigger('paser:value-after', result);
		//移除前后的换行符
		if (result.length > 0 && /^\n+/g.test(result[0])) {
			result[0] = result[0].replace(/^\n+/g, '');
		}
		if (result.length > 0 && /^\n+/g.test(result[result.length - 1])) {
			result[result.length - 1] = result[result.length - 1].replace(
				/^\n+/g,
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
		if (inner && outter) {
			$(inner).append(this.root).css(style);
			element.append(outter);
		} else {
			element.append(this.root);
		}
		this.editor.trigger('paser:html-before', this.root);
		element.traverse((domNode) => {
			const node = domNode.get<HTMLElement>();
			if (
				node &&
				node.nodeType === getWindow().Node.ELEMENT_NODE &&
				'none' === node.style['user-select'] &&
				node.parentNode
			) {
				node.parentNode.removeChild(node);
			}
		});
		this.editor.trigger('paser:html', element);
		element.find('p').css(style);
		this.editor.trigger('paser:html-after', element);
		return {
			html: element.html(),
			text: new Parser(element, this.editor).toText(
				this.editor.schema,
				true,
			),
		};
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
			fragment.appendChild(nodes[0]);
		}
		return fragment;
	}

	/**
	 * 转换为文本
	 * @param includeCard 是遍历卡片内部
	 */
	toText(schema: SchemaInterface | null = null, includeCard?: boolean) {
		const root = this.root.clone(true);
		const result: Array<string> = [];
		this.walkTree(
			root,
			null,
			null,
			{
				onOpen: (node, name) => {
					if (name === 'br') {
						result.push('\n');
					}
					const nodeElement = node[0];
					if (node.name === 'li') {
						if (node.hasClass('data-list-item')) {
							return;
						}
						const parent = node.parent();
						const styleType = parent?.css('listStyleType');
						if (parent?.name === 'ol') {
							const start = parent[0]['start'];
							const index = start ? start : 1;
							const childs = parent[0].childNodes;
							let liCount = -1;
							for (
								let i = 0;
								i < childs.length &&
								childs[i].nodeName === 'LI' &&
								liCount++ &&
								childs[i] !== nodeElement;
								i++
							) {
								result.push(
									''.concat(
										getListStyle(
											styleType,
											index + liCount,
										).toString(),
										'. ',
									),
								);
							}
						} else if (parent?.name === 'ul') {
							result.push(getListStyle(styleType) + ' ');
						}
					}
				},
				onText: (_, text) => {
					text = unescape(text);
					text = text.replace(/\u00a0/g, ' ');
					result.push(text);
				},
				onClose: (node, name) => {
					if (
						name === 'p' ||
						this.editor.node.isBlock(
							node,
							schema || this.editor.schema,
						)
					) {
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
