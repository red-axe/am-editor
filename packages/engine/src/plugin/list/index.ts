import { NodeInterface, PluginOptions } from '../../types';
import { CARD_KEY, READY_CARD_KEY } from '../../constants';
import { ListInterface } from '../../types/list';
import { PluginEntry as PluginEntryType } from '../../types/plugin';
import BlockEntry from '../block';
import { $ } from '../../node';
import { isEngine } from '../../utils';
import './index.css';

abstract class ListEntry<T extends PluginOptions = PluginOptions>
	extends BlockEntry<T>
	implements ListInterface<T>
{
	cardName?: string;
	private isPasteList: boolean = false;

	init() {
		super.init();
		const editor = this.editor;
		if (isEngine(editor)) {
			editor.on('paste:before', this.pasteBefore);
			editor.on('paste:insert', this.pasteInsert);
			editor.on('paste:after', this.pasteAfter);
		}
	}

	queryState() {
		const editor = this.editor;
		if (!isEngine(editor)) return false;
		return (
			editor.list.getPluginNameByNodes(editor.change.blocks) ===
			(this.constructor as PluginEntryType).pluginName
		);
	}

	/**
	 * 判断节点是否是当前列表所需要的节点
	 * @param node 节点
	 */
	abstract isCurrent(node: NodeInterface): boolean;

	pasteBefore = (documentFragment: DocumentFragment) => {
		const editor = this.editor;
		if (!this.cardName || !editor) return;
		const { list } = editor;
		const node = $(documentFragment);
		const children = node.allChildren();
		children.forEach((domChild) => {
			if (
				domChild.name === 'li' &&
				domChild.hasClass(list.CUSTOMZIE_LI_CLASS)
			) {
				//自定义列表，没有卡片节点，就作为普通列表
				if (!domChild.first()?.isCard()) {
					domChild.removeClass(list.CUSTOMZIE_LI_CLASS);
					domChild.closest('ul').removeClass(list.CUSTOMZIE_UL_CLASS);
					return;
				} else {
					domChild.closest('ul').addClass(list.CUSTOMZIE_UL_CLASS);
				}
			}
		});
		this.isPasteList = children.some((child) => child.name === 'li');
	};

	pasteInsert = () => {
		const editor = this.editor;
		if (!this.cardName || !isEngine(editor)) return;
		const { change, list } = editor;
		const range = change.range.get();
		const rootBlock = range.getRootBlock();
		const nextBlock = rootBlock?.next();
		const customizeItems = nextBlock?.find(`li.${list.CUSTOMZIE_LI_CLASS}`);
		if (customizeItems && customizeItems.length > 0) {
			customizeItems.each((node) => {
				const domNode = $(node);
				if (
					0 ===
					domNode.find(
						`[${CARD_KEY}=${this.cardName}],[${READY_CARD_KEY}=${this.cardName}]`,
					).length
				)
					list.addReadyCardToCustomize(domNode, this.cardName!);
			});
		}
	};

	pasteAfter = () => {
		if (this.isPasteList) {
			this.editor?.list.merge();
		}
	};

	destroy() {
		const editor = this.editor;
		if (isEngine(editor)) {
			editor.off('paste:before', this.pasteBefore);
			editor.off('paste:insert', this.pasteInsert);
			editor.off('paste:after', this.pasteAfter);
		}
	}
}

export default ListEntry;
