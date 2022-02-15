import {
	$,
	NodeInterface,
	ListPlugin,
	CARD_KEY,
	SchemaBlock,
	isEngine,
	PluginEntry,
	PluginOptions,
	decodeCardValue,
	CARD_VALUE_KEY,
} from '@aomao/engine';
import CheckboxComponent, { CheckboxValue } from './checkbox';
import './index.css';

export interface TasklistOptions extends PluginOptions {
	hotkey?: string | Array<string>;
	markdown?: boolean | string[];
}

export default class<
	T extends TasklistOptions = TasklistOptions,
> extends ListPlugin<T> {
	static get pluginName() {
		return 'tasklist';
	}

	cardName = 'checkbox';

	tagName = 'ul';

	attributes = {
		class: '@var0',
		'data-indent': '@var1',
	};

	variable = {
		'@var0': {
			required: true,
			value: [this.editor.list.CUSTOMZIE_UL_CLASS, 'data-list-task'],
		},
		'@var1': '@number',
	};

	allowIn = ['blockquote', '$root'];

	init() {
		super.init();
		this.editor.on('parse:html', (node) => this.parseHtml(node));
		if (isEngine(this.editor)) {
			this.editor.on(
				'paste:markdown-check',
				(child) => !this.checkMarkdown(child)?.match,
			);
			this.editor.on('paste:markdown', (child) =>
				this.pasteMarkdown(child),
			);
			this.editor.on('paste:each-after', (root) => {
				const liNodes = root.find(
					`li.${this.editor.list.CUSTOMZIE_LI_CLASS}`,
				);
				liNodes.each((_, index) => {
					const child = liNodes.eq(index);
					if (!child) return;
					const firstChild = child.first();
					if (
						firstChild &&
						firstChild.name === CheckboxComponent.cardName
					) {
						const card =
							this.editor.card.find<CheckboxValue>(firstChild);
						if (card) {
							const parent = child.parent();
							parent?.addClass('data-list-task');
							const value = card.getValue();
							if (value && value.checked) {
								parent?.attributes('checked', 'true');
							} else {
								parent?.removeAttributes('checked');
							}
						}
					}
				});
			});
		}
	}

	schema(): Array<SchemaBlock> {
		const scheam = super.schema() as SchemaBlock;
		return [
			scheam,
			{
				name: 'li',
				type: 'block',
				attributes: {
					class: {
						required: true,
						value: this.editor.list.CUSTOMZIE_LI_CLASS,
					},
					checked: ['true', 'false'],
				},
				allowIn: ['ul'],
			},
		];
	}

	isCurrent(node: NodeInterface) {
		if (node.name === 'li')
			return (
				node.hasClass(this.editor.list.CUSTOMZIE_LI_CLASS) &&
				node.first()?.attributes(CARD_KEY) === 'checkbox'
			);
		return node.hasClass('data-list') && node.hasClass('data-list-task');
	}

	execute(value?: any) {
		if (!isEngine(this.editor)) return;
		const { change, list, block } = this.editor;
		list.split();
		const range = change.range.get();
		const activeBlocks = block.findBlocks(range);
		if (activeBlocks) {
			const selection = range.createSelection('tasklist-execute');
			if (list.isSpecifiedType(activeBlocks, 'ul', 'checkbox')) {
				list.unwrap(activeBlocks);
			} else {
				const listBlocks = list.toCustomize(
					activeBlocks,
					'checkbox',
					value,
				) as Array<NodeInterface>;
				listBlocks.forEach((list) => {
					if (this.editor.node.isList(list))
						list.addClass('data-list-task');
				});
			}
			selection.move();
			if (
				range.collapsed &&
				range.startContainer.nodeType === Node.ELEMENT_NODE &&
				range.startContainer.childNodes.length === 0 &&
				range.startContainer.parentNode
			) {
				const brNode = document.createElement('br');
				range.startNode.before(brNode);
				range.startContainer.parentNode.removeChild(
					range.startContainer,
				);
				range.select(brNode);
				range.collapse(false);
			}
			change.apply(range);
			list.merge();
		}
	}

	hotkey() {
		return this.options.hotkey || 'mod+shift+9';
	}

	parseHtml(
		root: NodeInterface,
		callback?: (node: NodeInterface, value: CheckboxValue) => NodeInterface,
	) {
		const getBox = (inner: string = '') => {
			return `<span style="${
				inner
					? 'background:#347eff;position:relative;'
					: 'background:#fff;'
			}width: 16px;height: 16px;display: inline-block;border: 1px solid #347eff;border-radius: 2px;transition: all 0.3s;border-collapse: separate;">${inner}</span>`;
		};
		root.find(`[${CARD_KEY}=checkbox`).each((checkboxNode) => {
			const node = $(checkboxNode);

			let checkbox = $(
				`<span>${
					node.find('.data-checkbox-checked').length > 0
						? getBox(
								'<span style="transform: rotate(45deg) scale(1);position: absolute;display: block;border: 2px solid #fff;border-top: 0;border-left: 0;width:5.71428571px;height:9.14285714px;transition: all 0.2s cubic-bezier(0.12, 0.4, 0.29, 1.46) 0.1s;opacity: 1;left:3.57142857px;top:0.14285714px;"></span>',
						  )
						: getBox()
				}</span>`,
			);
			checkbox.css({
				margin: '3px 0.5ex',
				'vertical-align': 'middle',
				width: '16px',
				height: '16px',
				color: 'color: rgba(0, 0, 0, 0.65)',
			});
			node.empty();
			if (callback) {
				const card = this.editor.card.find<
					CheckboxValue,
					CheckboxComponent<CheckboxValue>
				>(node);
				const value =
					card?.getValue() ||
					decodeCardValue(node.attributes(CARD_VALUE_KEY));
				if (value) checkbox = callback(checkbox, value);
			}
			node.append(checkbox);
		});
		root.find('.data-list-task').css({
			'list-style': 'none',
		});
	}

	//设置markdown
	markdown(event: KeyboardEvent, text: string, block: NodeInterface) {
		const { markdown } = this.options;
		if (!isEngine(this.editor) || markdown === false) return;
		const { node, command } = this.editor;
		const blockApi = this.editor.block;
		const plugin = blockApi.findPlugin(block);
		// fix: 列表、引用等 markdown 快捷方式不应该在标题内生效
		if (
			block.name !== 'p' ||
			(plugin &&
				(plugin.constructor as PluginEntry).pluginName === 'heading')
		) {
			return;
		}

		let markdownWords = ['[]', '[ ]', '[x]'];
		if (Array.isArray(markdown)) {
			markdownWords = markdown;
		}

		if (markdownWords.indexOf(text) < 0) return;
		event.preventDefault();
		blockApi.removeLeftText(block);
		if (node.isEmpty(block)) {
			block.empty();
			block.append('<br />');
		}
		command.execute(
			(this.constructor as PluginEntry).pluginName,
			text === '[x]' ? { checked: true } : undefined,
		);
		return false;
	}

	checkMarkdown(node: NodeInterface) {
		if (!isEngine(this.editor) || !this.markdown || !node.isText()) return;

		const text = node.text();
		if (!text) return;

		const reg = /(^|\r\n|\n)(-\s*)?(\[[\sx]{0,1}\])/;
		const match = reg.exec(text);
		return {
			reg,
			match,
		};
	}

	pasteMarkdown(node: NodeInterface) {
		const result = this.checkMarkdown(node);
		if (!result) return;
		const { match } = result;
		if (!match) return;

		const { list, card } = this.editor;

		const createList = (nodes: Array<string>, indent?: number) => {
			const listNode = $(
				`<${this.tagName} class="${
					list.CUSTOMZIE_UL_CLASS
				} data-list-task">${nodes.join('')}</${this.tagName}>`,
			);
			if (indent) {
				listNode.attributes(this.editor.list.INDENT_KEY, indent);
			}
			list.addBr(listNode);
			return listNode.get<Element>()?.outerHTML;
		};
		const text = node.text();
		let newText = match[1] || '';
		const rows = text.split(/\n|\r\n/);
		let nodes: Array<string> = [];
		let indent = 0;
		rows.forEach((row) => {
			const match = /^(\s*)(-\s*)?(\[[\sx]{0,1}\])/.exec(row);
			if (match && !/(\[(.*)\]\(([\S]+?)\))/.test(row)) {
				const codeLength = match[0].length;
				const content = row.substr(
					/^\s+/.test(row.substr(codeLength))
						? codeLength + 1
						: codeLength,
				);
				const tempNode = $('<span />');
				const cardNode = card.replaceNode<CheckboxValue>(
					tempNode,
					this.cardName,
					{
						checked: match[0].indexOf('x') > 0,
					},
				);
				tempNode.remove();
				if (match[1].length !== indent && nodes.length > 0) {
					newText += createList(nodes, indent);
					nodes = [];
					indent = Math.ceil(match[1].length / 2);
				}
				nodes.push(
					`<li class="${list.CUSTOMZIE_LI_CLASS}">${
						cardNode.get<Element>()?.outerHTML
					}${content}</li>`,
				);
			} else if (nodes.length > 0) {
				newText += createList(nodes, indent) + '\n' + row + '\n';
				nodes = [];
			} else {
				newText += row + '\n';
			}
		});
		if (nodes.length > 0) {
			newText += createList(nodes, indent) + '\n';
		}
		node.text(newText);
	}
}
export { CheckboxComponent };
export type { CheckboxValue };
