import { isEngine, NodeInterface } from '../../types';
import { CARD_KEY, READY_CARD_KEY } from '../../constants';
import { ListInterface } from '../../types/list';
import { PluginEntry as PluginEntryType } from '../../types/plugin';
import BlockEntry from '../block';
import './index.css';

abstract class ListEntry<T extends {} = {}> extends BlockEntry<T>
	implements ListInterface {
	cardName?: string;
	private isPasteList: boolean = false;

	init() {
		super.init();
		if (isEngine(this.editor)) {
			this.editor.on('paste:before', fragment =>
				this.pasteBefore(fragment),
			);
			this.editor.on('paste:insert', () => this.pasteInsert());
			this.editor.on('paste:before', () => this.pasteAfter());
		}
	}

	queryState() {
		if (!isEngine(this.editor)) return false;
		return (
			this.editor.list.getPluginNameByNodes(this.editor.change.blocks) ===
			(this.constructor as PluginEntryType).pluginName
		);
	}

	/**
	 * 判断节点是否是当前列表所需要的节点
	 * @param node 节点
	 */
	abstract isCurrent(node: NodeInterface): boolean;

	pasteBefore(documentFragment: DocumentFragment) {
		if (!this.cardName || !this.editor) return;
		const { list, $ } = this.editor;
		const node = $(documentFragment);
		const children = node.allChildren();
		children.forEach(child => {
			const domChild = $(child);
			if (
				domChild.name === 'li' &&
				domChild.hasClass(list.CUSTOMZIE_LI_CLASS)
			) {
				domChild.closest('ul').addClass(list.CUSTOMZIE_UL_CLASS);
				if (
					domChild.find(`[${READY_CARD_KEY}=${this.cardName}]`)
						.length === 0
				)
					this.editor?.list.addReadyCardToCustomize(
						domChild,
						this.cardName!,
					);
			}
		});
		this.isPasteList = children.some(
			child => child.nodeName.toLowerCase() === 'li',
		);
	}

	pasteInsert() {
		if (!this.cardName || !isEngine(this.editor)) return;
		const { change, list } = this.editor;
		const range = change.getRange();
		const rootBlock = range.getRootBlock();
		const nextBlock = rootBlock?.next();
		const customizeItems = nextBlock?.find(`li.${list.CUSTOMZIE_LI_CLASS}`);
		if (customizeItems && customizeItems.length > 0) {
			customizeItems.each(node => {
				const domNode = this.editor.$(node);
				if (
					0 ===
					domNode.find(
						`[${CARD_KEY}=${this.cardName}],[${READY_CARD_KEY}=${this.cardName}]`,
					).length
				)
					list.addReadyCardToCustomize(domNode, this.cardName!);
			});
		}
	}

	pasteAfter() {
		if (this.isPasteList) {
			this.editor?.list.merge();
		}
	}
}

export default ListEntry;
