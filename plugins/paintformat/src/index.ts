import {
	$,
	isEngine,
	isNode,
	NodeInterface,
	Plugin,
	RangeInterface,
	PluginOptions,
	DATA_ELEMENT,
	UI,
} from '@aomao/engine';
import './index.css';

export interface PaintformatOptions extends PluginOptions {
	removeCommand?: string | ((range: RangeInterface) => void);
	paintBlock?: (
		currentBlocl: NodeInterface,
		block: NodeInterface,
	) => boolean | void;
}

const PAINTFORMAT_CLASS = 'data-paintformat-mode';

export default class<
	T extends PaintformatOptions = PaintformatOptions,
> extends Plugin<T> {
	protected activeMarks?: NodeInterface[];
	protected activeBlocks?: NodeInterface[];
	protected type?: string;
	protected event?: (event: KeyboardEvent) => void;
	protected isFormat: boolean = false;

	static get pluginName() {
		return 'paintformat';
	}

	init() {
		const editor = this.editor;
		if (!isEngine(editor)) return;

		editor.on('beforeCommandExecute', this.onBeforeCommandExecute);
		// 鼠标选中文本之后添加样式
		editor.container.on('mouseup', this.onContainerMouseUp);
	}

	onBeforeCommandExecute = (name: string) => {
		if ('paintformat' !== name && !this.isFormat && this.event) {
			this.removeActiveNodes(this.editor!.container[0].ownerDocument!);
		}
	};

	onContainerMouseUp = (e: MouseEvent) => {
		if (!this.activeMarks || !e.target) {
			return;
		}
		const editor = this.editor;
		// 在Card里不生效
		if (editor.card.closest($(e.target))) {
			this.removeActiveNodes(editor.container[0].ownerDocument!);
			return;
		}
		this.isFormat = true;
		this.paintFormat(this.activeMarks, this.activeBlocks);
		this.isFormat = false;
		if (this.type === 'single')
			this.removeActiveNodes(editor.container[0].ownerDocument!);
	};

	removeActiveNodes(node: NodeInterface | Node) {
		if (isNode(node)) node = $(node);
		const editor = this.editor;
		editor.container.removeClass(PAINTFORMAT_CLASS);
		this.activeMarks = undefined;
		this.activeBlocks = undefined;
		if (this.event) {
			node.off('keydown', this.event);
			this.event = undefined;
		}
		if (isEngine(editor)) editor.trigger('select');
	}

	bindEvent(node: NodeInterface) {
		const ownerDocument = node[0].ownerDocument;

		const keyEvent = (event: KeyboardEvent) => {
			if (event.metaKey || event.ctrlKey || event.shiftKey) return;
			this.event = undefined;
			if ('Escape' === event.key || 27 === event.keyCode) {
				node.off('keydown', keyEvent);
				if (ownerDocument) this.removeActiveNodes(ownerDocument);
			}
		};
		if (ownerDocument) {
			$(ownerDocument).on('keydown', keyEvent);
			this.event = keyEvent;
		}
	}

	paintFormat(activeMarks: NodeInterface[], activeBlocks?: NodeInterface[]) {
		const editor = this.editor;
		if (!isEngine(editor)) return;
		const { change, command, block } = editor;
		const range = change.range.get();
		const removeCommand = this.options.removeCommand || 'removeformat';
		// 选择范围为折叠状态，应用在整个段落，包括段落自己的样式
		if (range.collapsed) {
			let dummy = $(
				`<img ${DATA_ELEMENT}="${UI}" role="format-dummy" style="display: none;" />`,
			);
			range.insertNode(dummy[0]);
			const currentBlock = block.closest(range.startNode);
			range.select(currentBlock, true);
			change.range.select(range);
			if (typeof removeCommand === 'function') removeCommand(range);
			else command.execute(removeCommand);
			this.paintMarks(activeMarks);
			// 移除样式后，会导致block被移除，需要重新查找
			const blocks = block.getBlocks(range);
			if (activeBlocks) {
				blocks.forEach((block) => {
					this.paintBlocks(block, activeBlocks);
				});
			}
			dummy = currentBlock.find(`img[role="format-dummy"]`);
			range.select(dummy);
			range.collapse(true);
			dummy.remove();
			change.apply(range);
		} else {
			// 选择范围为展开状态
			if (typeof removeCommand === 'function') removeCommand(range);
			else command.execute(removeCommand);
			this.paintMarks(activeMarks);
			const blocks = block.getBlocks(range);
			if (activeBlocks) {
				blocks.forEach((block) => {
					this.paintBlocks(block, activeBlocks);
				});
			}
		}
		editor.mark.merge(range);
	}

	paintMarks(activeMarks: NodeInterface[]) {
		const editor = this.editor;
		const { mark } = editor;
		for (let i = activeMarks.length - 1; i >= 0; i--) {
			const node = activeMarks[i];
			mark.wrap(editor.node.clone(node, false, false));
		}
	}

	paintBlocks(currentBlock: NodeInterface, activeBlocks: NodeInterface[]) {
		const editor = this.editor;
		if (!isEngine(editor) || !currentBlock.inEditor()) return;
		const { node, change } = editor;
		const blockApi = editor.block;
		const range = change.range.get();
		const selection = range.createSelection('removeformat');
		activeBlocks.forEach((block) => {
			if (!currentBlock.inEditor()) return;
			if (this.options.paintBlock) {
				const paintResult = this.options.paintBlock(
					currentBlock,
					block,
				);
				if (paintResult === false) return;
			}
			if (block.name !== currentBlock.name) {
				range.select(currentBlock).shrinkToElementNode();
				change.blocks = [currentBlock];
				if (block.name === 'p') {
					const plugin = blockApi.findPlugin(currentBlock);
					if (plugin) plugin.execute(block.name);
				} else if (node.isRootBlock(block)) {
					const plugin = blockApi.findPlugin(block);
					if (plugin) plugin.execute(block.name);
				} else if (node.isList(block) && block.name !== 'li') {
					const plugin = blockApi.findPlugin(block);
					const curPlugin = blockApi.findPlugin(
						currentBlock.name === 'li'
							? currentBlock.parent()!
							: currentBlock,
					);
					if (plugin && curPlugin !== plugin) plugin.execute();
				}
			}
			const css = block.css();
			if (Object.keys(css).length > 0) {
				blockApi.setBlocks({
					style: css,
				});
			}
		});
		selection.move();
	}

	execute(type: string = 'single') {
		const editor = this.editor;
		if (!isEngine(editor)) return;
		if (this.activeMarks) {
			this.removeActiveNodes(editor.container);
			return;
		}
		this.type = type;
		this.bindEvent(editor.container);
		const { change, mark, block } = editor;
		const range = change.range.get();
		this.activeMarks = mark.findMarks(range);
		this.activeBlocks = block.findBlocks(range);
		editor.trigger('select');
		editor.container.addClass('data-paintformat-mode');
	}

	queryState() {
		return !!this.activeMarks;
	}

	destroy() {
		const editor = this.editor;
		editor.off('beforeCommandExecute', this.onBeforeCommandExecute);
		editor.container.off('mouseup', this.onContainerMouseUp);
	}
}
