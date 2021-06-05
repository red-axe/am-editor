import {
	CARD_ELEMENT_KEY,
	CARD_KEY,
	READY_CARD_KEY,
	CARD_VALUE_KEY,
	CARD_TYPE_KEY,
} from '../constants';
import {
	escape,
	unescape,
	removeUnit,
	toHex,
	transformCustomTags,
	getListStyle,
	getWindow,
} from '../utils';
import transform from './transform';
import TextParser from './text';
import { NodeInterface } from '../types/node';
import { DATA_ELEMENT, EDITABLE } from '../constants/root';
import { EditorInterface } from '../types/engine';
import {
	SchemaInterface,
	isNodeEntry,
	ParserInterface,
	Callbacks,
} from '../types';

const style = {
	'font-size': '14px',
	color: '#262626',
	'line-height': '24px',
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
	Object.keys(attrs).forEach(key => {
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
	Object.keys(styles).forEach(key => {
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
		const { $, node } = this.editor;
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
			this.root.find('paragraph').each(child => {
				node.replace($(child), p.clone());
			});
		} else if (isNodeEntry(source)) {
			this.root = source;
		} else {
			this.root = $(source);
		}
		if (paserBefore) paserBefore(this.root);
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
		conversionRules: any,
		callbacks: Callbacks,
		isCardNode?: boolean,
		includeCard?: boolean,
	) {
		let child = node.first();
		const nodeApi = this.editor.node;
		while (child) {
			if (child.isElement()) {
				let name = child.name;
				let attrs = child.attributes();
				let styles = child.css();
				//删除属性中的style属性
				delete attrs.style;
				// 光标相关节点
				if (child.isCursor()) {
					name = attrs[DATA_ELEMENT].toLowerCase();
					attrs = {};
					styles = {};
				}
				// Card Combine 相关节点
				if (['left', 'right'].indexOf(attrs[CARD_ELEMENT_KEY]) >= 0) {
					child = child.next();
					continue;
				}

				if (attrs[CARD_KEY] || attrs[READY_CARD_KEY]) {
					name = 'card';
					const value = attrs[CARD_VALUE_KEY];

					const oldAttrs = { ...attrs };
					attrs = {
						type: attrs[CARD_TYPE_KEY],
						name: (
							attrs[CARD_KEY] || attrs[READY_CARD_KEY]
						).toLowerCase(),
					};
					//其它 data 属性
					Object.keys(oldAttrs).forEach(attrName => {
						if (
							attrName.indexOf('data-') === 0 &&
							attrName.indexOf('data-card') !== 0
						) {
							attrs[attrName] = oldAttrs[attrName];
						}
					});

					if (value !== undefined) {
						attrs.value = value;
					}
					styles = {};
				}
				name = transform(
					conversionRules,
					name,
					attrs,
					styles,
					isCardNode,
				);
				// 执行回调函数
				if (attrs[CARD_ELEMENT_KEY] !== 'center') {
					if (callbacks.onOpen) {
						const result = callbacks.onOpen(
							child,
							name,
							attrs,
							styles,
						);
						if (result === false) {
							child = child.next();
							continue;
						}
					}
				}
				// Card不遍历子节点
				if (name !== 'card' || includeCard) {
					this.walkTree(
						child,
						conversionRules,
						callbacks,
						isCardNode,
						includeCard,
					);
				}
				// 执行回调函数
				if (attrs[CARD_ELEMENT_KEY] !== 'center') {
					if (callbacks.onClose) {
						callbacks.onClose(child, name, attrs, styles);
					}
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
				// 删除 zero width space
				text = text.replace(/\u200B/g, '');
				if (callbacks.onText) {
					callbacks.onText(child, text);
				}
			}
			child = child.next();
		}
	}
	/**
	 * 遍历 DOM 树，生成符合标准的 XML 代码
	 * @param schemaRules 标签保留规则
	 * @param conversionRules 标签转换规则
	 * @param replaceSpaces 是否替换空格
	 * @param customTags 是否将光标、卡片节点转换为标准代码
	 */
	toValue(
		schema: SchemaInterface | null = null,
		conversionRules: any = null,
		replaceSpaces: boolean = false,
		customTags: boolean = false,
	) {
		const result: Array<string> = [];
		const { $ } = this.editor;
		const nodeApi = this.editor.node;
		this.editor.trigger('paser:value-before', this.root);
		this.walkTree(this.root, conversionRules, {
			onOpen: (child, name, attrs, styles) => {
				if (schema && attrs[DATA_ELEMENT] !== EDITABLE) {
					let node = child;
					if (child.name !== name) {
						node = $(`<${name} />`);
						node.attributes(attrs);
						node.css(styles);
					}
					const type = schema.getType(node);
					if (type === undefined) return;
					schema.filterAttributes(name, attrs, type);
					schema.filterStyles(name, styles, type);
				}
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
					text = text.replace(/[\u00a0 ]+/g, item => {
						const strArray = [];
						item = item.replace(/\u00a0/g, ' ');
						for (let n = 0; n < item.length; n++)
							strArray[n] = n % 2 == 0 ? item[n] : ' ';
						return strArray.join('');
					});
				}
				result.push(text);
			},
			onClose: (child, name, attrs, styles) => {
				if (nodeApi.isVoid(name, schema ? schema : undefined)) return;
				if (schema) {
					let node = child;
					if (child.name !== name) {
						node = $(`<${name} />`);
						node.attributes(attrs);
						node.css(styles);
					}
					const type = schema.getType(node);
					if (type === undefined) return;
					schema.filterAttributes(name, attrs, type);
					schema.filterStyles(name, styles, type);
				}
				result.push('</'.concat(name, '>'));
			},
		});
		this.editor.trigger('paser:value-after', result);
		const value = result.join('');
		return customTags ? transformCustomTags(value) : value;
	}

	/**
	 * 转换为HTML代码
	 * @param inner 内包裹节点
	 * @param outter 外包裹节点
	 */
	toHTML(inner?: Node, outter?: Node) {
		const { $ } = this.editor;
		const element = $('<div />');
		if (inner && outter) {
			$(inner)
				.append(this.root)
				.css(style);
			element.append(outter);
		} else {
			element.append(this.root);
		}
		this.editor.trigger('paser:html-before', this.root);
		element.traverse(domNode => {
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
			text: new Parser(element, this.editor).toText(null, true),
		};
	}

	/**
	 * 返回DOM树
	 */
	toDOM(schema: SchemaInterface | null = null, conversionRules: any = null) {
		const value = this.toValue(schema, conversionRules, false, true);
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
	 * @param conversionRules 标签转换规则
	 * @param includeCard 是否包含卡片
	 */
	toText(
		schema: SchemaInterface | null = null,
		conversionRules: any = null,
		includeCard?: boolean,
	) {
		const result: Array<string> = [];
		this.walkTree(
			this.root,
			conversionRules,
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
						this.editor.node.isBlock(node, schema || undefined)
					) {
						result.push('\n');
					}
				},
			},
			false,
			includeCard,
		);
		return result
			.join('')
			.replace(/\n{2,}/g, '\n')
			.trim();
	}
}
export default Parser;
export { TextParser };
