import {
	$,
	NodeInterface,
	List,
	isAllListedByType,
	cancelList,
	CARD_KEY,
} from '@aomao/engine';
import Checkbox from './checkbox';
import './index.css';

export type Options = {
	hotkey?: string | Array<string>;
	markdown?: boolean;
};

export default class extends List<Options> {
	schema(): any {
		const rules = super.schema();
		rules[0].ul?.class.push('data-list-task');
		return rules;
	}

	isCurentList(node: NodeInterface) {
		if (node.name === 'li')
			return (
				node.hasClass('data-list-node') &&
				node.first()?.attr(CARD_KEY) === 'checkbox'
			);
		return node.hasClass('data-list') && node.hasClass('data-list-task');
	}

	execute(value?: any) {
		if (!this.engine) return;
		const { change } = this.engine;
		change.separateBlocks();
		const range = change.getRange();
		const activeBlocks = range.getActiveBlocks();
		if (activeBlocks) {
			const bookmark = range.createBookmark();
			const isList = isAllListedByType(activeBlocks, 'ul', 'checkbox');
			if (isList) {
				cancelList(activeBlocks);
			} else {
				const listBlocks = this.toCustomize(
					activeBlocks,
					'checkbox',
					value,
				);
				listBlocks.forEach(list => {
					list.addClass('data-list-task');
				});
			}
			if (bookmark) range.moveToBookmark(bookmark);
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
			change.mergeAdjacentList();
		}
	}

	hotkey() {
		return this.options.hotkey || 'mod+shift+9';
	}

	parseHtml(root: NodeInterface) {
		root.find(`[${CARD_KEY}=checkbox`).each(checkboxNode => {
			const node = $(checkboxNode);
			const checkbox = $(
				'<span>'.concat(
					'checked' === node.find('input').attr('checked')
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
	onKeydownSpace(event: KeyboardEvent, node: NodeInterface) {
		if (!this.engine || this.options.markdown === false) return;

		const block = node.getClosestBlock();
		// fix: 列表、引用等 markdown 快捷方式不应该在标题内生效
		if (!block.isHeading() || /^h\d$/i.test(block.name || '')) {
			return;
		}

		const { change } = this.engine;
		const range = change.getRange();
		const text = range.getBlockLeftText(block[0]);
		if (['[]', '[ ]', '[x]'].indexOf(text) < 0) return;
		event.preventDefault();
		range.removeBlockLeftText(block[0]);
		if (block.isEmpty()) {
			block.empty();
			block.append('<br />');
		}
		this.execute(text === '[x]' ? { checked: true } : undefined);
		return false;
	}
}
export { Checkbox };
