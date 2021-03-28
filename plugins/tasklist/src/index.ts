import {
	NodeInterface,
	List,
	CARD_KEY,
	SchemaBlock,
	isEngine,
	PluginEntry,
} from '@aomao/engine';
import Checkbox from './checkbox';
import './index.css';

export type Options = {
	hotkey?: string | Array<string>;
	markdown?: boolean;
};

export default class extends List<Options> {
	static get pluginName() {
		return 'tasklist';
	}

	cardName = 'checkbox';

	tagName = 'ul';

	attributes = {
		class: '@var0',
	};

	variable = {
		'@var0': [this.editor.list.CUSTOMZIE_UL_CLASS, 'data-list-task'],
	};

	allowIn = ['blockquote'];

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
				listBlocks.forEach(list => {
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
			change.select(range);
			list.merge();
		}
	}

	hotkey() {
		return this.options.hotkey || 'mod+shift+9';
	}

	parseHtml(root: NodeInterface) {
		const { $ } = this.editor;
		root.find(`[${CARD_KEY}=checkbox`).each(checkboxNode => {
			const node = $(checkboxNode);
			const checkbox = $(
				'<span>'.concat(
					'checked' === node.find('input').attributes('checked')
						? '✅'
						: '🔲',
					'<span/>',
				),
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

		const plugins = this.editor.block.findPlugin(block);
		// fix: 列表、引用等 markdown 快捷方式不应该在标题内生效
		if (
			block.name !== 'p' ||
			plugins.find(
				plugin =>
					(plugin.constructor as PluginEntry).pluginName ===
					'heading',
			)
		) {
			return;
		}

		if (['[]', '[ ]', '[x]'].indexOf(text) < 0) return;
		event.preventDefault();
		this.editor.block.removeLeftText(block);
		if (this.editor.node.isEmpty(block)) {
			block.empty();
			block.append('<br />');
		}
		this.editor.command.execute(
			(this.constructor as PluginEntry).pluginName,
			text === '[x]' ? { checked: true } : undefined,
		);
		return false;
	}
}
export { Checkbox };
