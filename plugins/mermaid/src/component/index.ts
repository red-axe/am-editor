import {
	$,
	Card,
	CardToolbarItemOptions,
	CardType,
	isEngine,
	NodeInterface,
	ToolbarItemOptions,
	Resizer,
	isMobile,
} from '@aomao/engine';
import type { MermaidValue } from './types';
import { MermaidChart } from './mermaid';
import './index.css';

export type Options = {};
class MermaidComponent extends Card<MermaidValue> {
	static get cardName() {
		return 'mermaid';
	}

	static get cardType() {
		return CardType.BLOCK;
	}

	static get autoSelected() {
		return false;
	}

	static get singleSelectable() {
		return false;
	}

	#container?: NodeInterface;
	resizer?: Resizer;

	toolbar(): Array<ToolbarItemOptions | CardToolbarItemOptions> {
		if (!isEngine(this.editor) || this.editor.readonly) return [];
		const lang: Record<string, any> =
			this.editor.language.get('cardToolBar');
		return [
			{ type: 'dnd' },
			{ type: 'delete' },
			{
				key: 'block',
				type: 'button',
				content:
					'<span class="data-icon data-icon-block-image"></span>',
				title: lang.displayBlockTitle,
				onClick: () => {
					this.type = CardType.BLOCK;
				},
			},
			{
				key: 'inline',
				type: 'button',
				content:
					'<span class="data-icon data-icon-inline-image"></span>',
				title: lang.displayInlineTitle,
				onClick: () => {
					this.type = CardType.INLINE;
				},
			},
		];
	}

	getInitOptions() {
		const maxWidth = this.getMaxWidth();
		const value = this.getValue();

		const size: { width: number; height: number } = {
			width: value.size?.width || maxWidth,
			height: value.size?.height || maxWidth * (value.rate || 1),
		};

		value.maxWidth = maxWidth;
		value.size = size;

		this.setValue({ ...value });

		return value;
	}

	render() {
		const value = this.getInitOptions();
		const { code } = value;
		if (!this.#container) {
			this.#container = $(`<div class="data-mermaid"></div>`);
		}

		if (code) {
			const svg = MermaidChart(code);
			const temp =
				$(`<div class="data-mermaid-content" style="width: ${value.size?.width}px; height: ${value.size?.height}px">
						  ${svg}
						  <div class="data-mermaid-mask"></div>
					  </div > `);
			this.#container?.empty().append(temp);
		}

		if (this.type === CardType.BLOCK) {
			this.#container.addClass('data-mermaid-blcok');
		} else {
			this.#container.removeClass('data-mermaid-blcok');
		}

		return this.#container;
	}

	didRender() {
		console.log('mermaid card didRender');
		super.didRender();
		this.toolbarModel?.setDefaultAlign('top');
	}

	didUpdate() {
		console.log('mermaid card didUpdate');
		super.didUpdate();
		this.toolbarModel?.getContainer()?.remove();
		this.toolbarModel?.create();
		this.toolbarModel?.setDefaultAlign('top');
	}

	onActivate(activated: boolean) {
		console.log('mermaid onActivate', activated);
		super.onActivate(activated);

		if (activated) {
			this.#container?.addClass('data-mermaid-active');
			this.destroyEditor();
			this.renderEditor();
		} else {
			this.#container?.removeClass('data-mermaid-active');
			this.destroyEditor();
		}
	}

	renderEditor() {
		const value = this.getValue();
		const mermaid = this.#container?.find('.data-mermaid-content');
		if (!mermaid) return;
		let clientWidth = value.size?.width || mermaid.width();
		let clientHeight = value.size?.height || mermaid.height();

		if (!clientWidth || !clientHeight) {
			return;
		}
		const editor = this.editor;
		const maxWidth = this.getMaxWidth();
		clientWidth = clientWidth > maxWidth ? maxWidth : clientWidth;
		const rate = clientHeight / clientWidth;

		this.setValue({
			...value,
			maxWidth,
			rate,
			size: { width: clientWidth, height: clientHeight },
		});
		if (isMobile || !isEngine(editor) || editor.readonly) return;
		if (this.getValue().enableResizer === false) {
			return;
		}
		// 拖动调整图片大小
		const resizer = new Resizer({
			imgUrl: '',
			width: clientWidth,
			height: clientHeight,
			rate: rate || 1,
			maxWidth: maxWidth,
			onChange: ({ width, height }) => this.changeSize(width, height),
		});
		const resizerNode = resizer.render();
		this.root.find('.data-mermaid-content').append(resizerNode);
		this.resizer = resizer;
	}

	getMaxWidth(node: NodeInterface = this.root) {
		const block = this.editor.block.closest(node).get<HTMLElement>();
		if (!block) return 0;
		return block.clientWidth - 6;
	}

	changeSize(width: number, height: number) {
		const value = this.getValue();
		if (width < 24) {
			width = 24;
			height = width * value.rate;
		}

		if (width > value.maxWidth) {
			width = value.maxWidth;
			height = width * value.rate;
		}

		if (height < 24) {
			height = 24;
			width = height / value.rate;
		}

		width = Math.round(width);
		height = Math.round(height);
		value.size.width = width;
		value.size.height = height;

		this.setValue({ ...value });

		const mermaid = $('.data-mermaid-content');
		mermaid?.css({
			width: `${width}px`,
			height: `${height}px`,
		});

		this.destroyEditor();
		this.renderEditor();
	}

	destroyEditor() {
		this.resizer?.destroy();
	}
}
export default MermaidComponent;
export type { MermaidValue };
