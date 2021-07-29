import {
	$,
	NodeInterface,
	ListPlugin,
	CARD_KEY,
	SchemaBlock,
	isEngine,
	PluginEntry,
	READY_CARD_KEY,
	PluginOptions,
} from '@aomao/engine';
import CheckboxComponent from './checkbox';
import './index.css';

export interface Options extends PluginOptions {
	hotkey?: string | Array<string>;
	markdown?: boolean;
}

export default class extends ListPlugin<Options> {
	static get pluginName() {
		return 'tasklist';
	}

	cardName = 'checkbox';

	tagName = 'ul';

	attributes = {
		class: '@var0',
	};

	variable = {
		'@var0': {
			required: true,
			value: [this.editor.list.CUSTOMZIE_UL_CLASS, 'data-list-task'],
		},
	};

	allowIn = ['blockquote', '$root'];

	init() {
		super.init();
		this.editor.on('paser:html', (node) => this.parseHtml(node));
		if (isEngine(this.editor)) {
			this.editor.on('paste:markdown', (child) =>
				this.pasteMarkdown(child),
			);
			this.editor.on('paste:each-after', (child) => {
				if (
					child.name === 'li' &&
					child.hasClass(this.editor.list.CUSTOMZIE_LI_CLASS) &&
					(child.first()?.attributes(CARD_KEY) === 'checkbox' ||
						child.first()?.attributes(READY_CARD_KEY) ===
							'checkbox')
				) {
					child.parent()?.addClass('data-list-task');
				}
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
					class: this.editor.list.CUSTOMZIE_LI_CLASS,
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
		const range = change.getRange();
		const activeBlocks = block.findBlocks(range);
		if (activeBlocks) {
			const selection = range.createSelection();
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

	parseHtml(root: NodeInterface) {
		root.find(`[${CARD_KEY}=checkbox`).each((checkboxNode) => {
			const node = $(checkboxNode);
			const checkbox = $(
				`<span>${
					'checked' === node.find('input').attributes('checked')
						? '✅'
						: '🔲'
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
			node.append(checkbox);
		});
		root.find('.data-list-task').css({
			'list-style': 'none',
		});
	}

	//设置markdown
	markdown(event: KeyboardEvent, text: string, block: NodeInterface) {
		if (!isEngine(this.editor) || this.options.markdown === false) return;
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

		if (['[]', '[ ]', '[x]'].indexOf(text) < 0) return;
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

	pasteMarkdown(node: NodeInterface) {
		if (!isEngine(this.editor) || !this.markdown || !node.isText()) return;

		const text = node.text();
		if (!text) return;

		const reg = /(^|\r\n|\n)(-\s*)?(\[[\sx]{0,1}\])/;
		let match = reg.exec(text);
		if (!match) return;

		const { list, card } = this.editor;

		const createList = (nodes: Array<string>) => {
			const listNode = $(
				`<${this.tagName} class="${
					list.CUSTOMZIE_UL_CLASS
				} data-list-task">${nodes.join('')}</${this.tagName}>`,
			);
			list.addBr(listNode);
			return listNode.get<Element>()?.outerHTML;
		};

		let newText = '';
		const rows = text.split(/\n|\r\n/);
		let nodes: Array<string> = [];
		rows.forEach((row) => {
			const match = /^(-\s*)?(\[[\sx]{0,1}\])/.exec(row);
			if (match && !/(\[(.*)\]\(([\S]+?)\))/.test(row)) {
				const codeLength = match[0].length;
				const content = row.substr(
					/^\s+/.test(row.substr(codeLength))
						? codeLength + 1
						: codeLength,
				);
				const tempNode = $('<span />');
				const cardNode = card.replaceNode(tempNode, this.cardName, {
					checked: match[0].indexOf('x') > 0,
				});
				tempNode.remove();
				nodes.push(
					`<li class="${list.CUSTOMZIE_LI_CLASS}">${
						cardNode.get<Element>()?.outerHTML
					}${content}</li>`,
				);
			} else if (nodes.length > 0) {
				newText += createList(nodes) + '\n' + row + '\n';
				nodes = [];
			} else {
				newText += row + '\n';
			}
		});
		if (nodes.length > 0) {
			newText += createList(nodes) + '\n';
		}
		node.text(newText);
	}
}
export { CheckboxComponent };
