import {
	$,
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

	initialize() {
		if (!this.engine) return;
		this.engine.on('beforeCommandExecute', name => {
			if (this.name !== name && !this.isFormat && this.event) {
				this.removeActiveNodes(
					this.engine!.container[0].ownerDocument!,
				);
			}
		});

		// 鼠标选中文本之后添加样式
		this.engine.container.on('mouseup', e => {
			if (!this.activeMarks) {
				return;
			}
			// 在Card里不生效
			if (this.engine!.card.closest(e.target)) {
				this.removeActiveNodes(
					this.engine!.container[0].ownerDocument!,
				);
				return;
			}
			this.isFormat = true;
			this.paintFormat(this.activeMarks, this.activeBlocks);
			this.isFormat = false;
			if (this.type === 'single')
				this.removeActiveNodes(
					this.engine!.container[0].ownerDocument!,
				);
		});
	}

	removeActiveNodes(node: NodeInterface | Node) {
		if (isNode(node)) node = $(node);
		this.engine!.container.removeClass(PAINTFORMAT_CLASS);
		this.activeMarks = undefined;
		this.activeBlocks = undefined;
		if (this.event) {
			node.off('keydown', this.event);
			this.event = undefined;
		}
		this.engine!.event.trigger('select');
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
		if (!this.engine) return;
		const { change, command } = this.engine;
		const range = change.getRange();
		const removeCommand = this.options.removeCommand || 'removeformat';
		// 选择范围为折叠状态，应用在整个段落，包括段落自己的样式
		if (range.collapsed) {
			const dummy = $('<img style="display: none;" />');
			range.insertNode(dummy[0]);
			const currentBlock = range.startNode.getClosestBlock();
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
			const blocks = range.getBlocks();
			blocks.forEach(block => {
				if (activeBlocks) this.paintBlocks(block, activeBlocks);
			});
		}
	}

	paintMarks(activeMarks: NodeInterface[]) {
		const { change } = this.engine!;
		activeMarks.forEach(mark => {
			change.addMark(mark.clone());
		});
	}

	paintBlocks(currentBlock: NodeInterface, activeBlocks: NodeInterface[]) {
		const { change, command } = this.engine!;
		activeBlocks.forEach(block => {
			if (this.options.paintBlock) {
				const paintResult = this.options.paintBlock(
					currentBlock,
					block,
				);
				if (paintResult === false) return;
			}
			if (block.name !== currentBlock.name) {
				if (block.isHeading()) {
					command.execute('heading', block.name);
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
				change.setBlocks({
					style: css,
				});
			}
		});
	}

	execute(type: string = 'single') {
		if (!this.engine) return;
		if (this.activeMarks) {
			this.removeActiveNodes(this.engine.container);
			return;
		}
		this.type = type;
		this.bindEvent(this.engine.container);
		const range = this.engine.change.getRange();
		this.activeMarks = range.getActiveMarks();
		this.activeBlocks = range.getActiveBlocks();
		this.engine.event.trigger('select');
		this.engine.container.addClass('data-paintformat-mode');
	}

	queryState() {
		return !!this.activeMarks;
	}
}
