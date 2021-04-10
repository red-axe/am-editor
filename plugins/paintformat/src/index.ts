import {
	isEngine,
	isNode,
	NodeInterface,
	Plugin,
	RangeInterface,
} from '@aomao/engine';
import './index.css';

export type Options = {
	removeCommand?: string | ((range: RangeInterface) => void);
	paintBlock?: (
		currentBlocl: NodeInterface,
		block: NodeInterface,
	) => boolean | void;
};

const PAINTFORMAT_CLASS = 'data-paintformat-mode';

export default class extends Plugin<Options> {
	private activeMarks?: NodeInterface[];
	private activeBlocks?: NodeInterface[];
	private type?: string;
	private event?: (event: KeyboardEvent) => void;
	private isFormat: boolean = false;

	static get pluginName() {
		return 'paintformat';
	}

	init() {
		super.init();
		if (!isEngine(this.editor)) return;

		this.editor.on('beforeCommandExecute', name => {
			if ('paintformat' !== name && !this.isFormat && this.event) {
				this.removeActiveNodes(
					this.editor!.container[0].ownerDocument!,
				);
			}
		});

		// 鼠标选中文本之后添加样式
		this.editor.container.on('mouseup', e => {
			if (!this.activeMarks) {
				return;
			}
			// 在Card里不生效
			if (this.editor!.card.closest(e.target)) {
				this.removeActiveNodes(
					this.editor!.container[0].ownerDocument!,
				);
				return;
			}
			this.isFormat = true;
			this.paintFormat(this.activeMarks, this.activeBlocks);
			this.isFormat = false;
			if (this.type === 'single')
				this.removeActiveNodes(
					this.editor!.container[0].ownerDocument!,
				);
		});
	}

	removeActiveNodes(node: NodeInterface | Node) {
		const { $ } = this.editor;
		if (isNode(node)) node = $(node);
		this.editor!.container.removeClass(PAINTFORMAT_CLASS);
		this.activeMarks = undefined;
		this.activeBlocks = undefined;
		if (this.event) {
			node.off('keydown', this.event);
			this.event = undefined;
		}
		if (isEngine(this.editor)) this.editor.trigger('select');
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
			const { $ } = this.editor;
			$(ownerDocument).on('keydown', keyEvent);
			this.event = keyEvent;
		}
	}

	paintFormat(activeMarks: NodeInterface[], activeBlocks?: NodeInterface[]) {
		if (!isEngine(this.editor)) return;
		const { change, command, block, $ } = this.editor;
		const range = change.getRange();
		const removeCommand = this.options.removeCommand || 'removeformat';
		// 选择范围为折叠状态，应用在整个段落，包括段落自己的样式
		if (range.collapsed) {
			const dummy = $('<img style="display: none;" />');
			range.insertNode(dummy[0]);
			const currentBlock = block.closest(range.startNode);
			range.select(currentBlock, true);
			change.select(range);
			if (typeof removeCommand === 'function') removeCommand(range);
			else command.execute(removeCommand);
			this.paintMarks(activeMarks);
			if (activeBlocks) this.paintBlocks(currentBlock, activeBlocks);
			range.select(dummy);
			range.collapse(true);
			dummy.remove();
			change.select(range);
		} else {
			// 选择范围为展开状态
			if (typeof removeCommand === 'function') removeCommand(range);
			else command.execute(removeCommand);
			this.paintMarks(activeMarks);
			const blocks = block.getBlocks(range);
			blocks.forEach(block => {
				if (activeBlocks) this.paintBlocks(block, activeBlocks);
			});
		}
	}

	paintMarks(activeMarks: NodeInterface[]) {
		const { mark } = this.editor!;
		activeMarks.forEach(node => {
			mark.wrap(this.editor.node.clone(node));
		});
	}

	paintBlocks(currentBlock: NodeInterface, activeBlocks: NodeInterface[]) {
		if (!isEngine(this.editor)) return;
		const { command } = this.editor!;
		activeBlocks.forEach(block => {
			if (this.options.paintBlock) {
				const paintResult = this.options.paintBlock(
					currentBlock,
					block,
				);
				if (paintResult === false) return;
			}
			if (block.name !== currentBlock.name) {
				if (block.name === 'p') {
					command.execute('heading', block.name);
				} else if (this.editor.node.isRootBlock(block)) {
					const plugins = this.editor.block.findPlugin(block);
					plugins.forEach(plugin => plugin.execute(block.name));
				}
				if (block.name === 'ol') {
					command.execute('orderlist');
				}
				if (block.name === 'ul') {
					command.execute('unorderedlist');
				}
			}
			const css = block.css();
			if (Object.keys(css).length > 0) {
				this.editor.block.setBlocks({
					style: css,
				});
			}
		});
	}

	execute(type: string = 'single') {
		if (!isEngine(this.editor)) return;
		if (this.activeMarks) {
			this.removeActiveNodes(this.editor.container);
			return;
		}
		this.type = type;
		this.bindEvent(this.editor.container);
		const { change, mark, block } = this.editor;
		const range = change.getRange();
		this.activeMarks = mark.findMarks(range);
		this.activeBlocks = block.findBlocks(range);
		this.editor.trigger('select');
		this.editor.container.addClass('data-paintformat-mode');
	}

	queryState() {
		return !!this.activeMarks;
	}
}
