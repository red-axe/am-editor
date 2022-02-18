import { StatusOptions } from '@/types';
import { CardValue } from '@aomao/engine';
import {
	$,
	Card,
	CardType,
	isEngine,
	NodeInterface,
	Position,
	toHex,
	SelectStyleType,
} from '@aomao/engine';
import StatusEditor from './editor';
import './index.css';

export interface StatusValue extends CardValue {
	text: string;
	marks?: string[];
}

class Status<T extends StatusValue = StatusValue> extends Card<T> {
	#position?: Position;

	static get cardName() {
		return 'status';
	}

	static get cardType() {
		return CardType.INLINE;
	}

	static get autoSelected() {
		return false;
	}

	static get selectStyleType() {
		return SelectStyleType.NONE;
	}

	defaultColors: Array<{
		background: string;
		color: string;
	}> = [
		{
			background: '#FFE8E6',
			color: '#820014',
		},
		{
			background: '#FCFCCA',
			color: '#614700',
		},
		{
			background: '#E4F7D2',
			color: '#135200',
		},
		{
			background: '#E9E9E9',
			color: '#595959',
		},
		{
			background: '#D4EEFC',
			color: '#003A8C',
		},
		{
			background: '#DEE8FC',
			color: '#061178',
		},
	];

	#container?: NodeInterface;
	#editorContainer?: NodeInterface;
	#statusEditor?: StatusEditor;

	getColors() {
		const plugin = this.editor.plugin.findPlugin<StatusOptions>('status');
		return plugin?.options.colors || this.defaultColors;
	}

	init() {
		super.init();
		const { card } = this.editor;
		if (!this.#position) this.#position = new Position(this.editor);
		if (this.#statusEditor) return;

		this.#statusEditor = new StatusEditor({
			colors: this.getColors(),
			onChange: (text, color) => {
				if (color) this.setColor(color);
				this.setValue({
					text,
				} as T);
				this.updateContent();
			},
			onOk: (event: MouseEvent) => {
				event.stopPropagation();
				event.preventDefault();
				card.activate($(document.body));
				card.focus(this);
			},
			onDestroy: () => {
				this.#position?.destroy();
			},
		});
	}

	setColor(color: { background: string; color: string }) {
		const { plugin } = this.editor;
		const backgroundPlugin = plugin.findMarkPlugin('backcolor');
		if (backgroundPlugin) {
			const backgroundElement = backgroundPlugin.createElement(
				color.background,
			);
			this.executeMark(backgroundElement, true);
		}
		const fontcolorPlugin = plugin.findMarkPlugin('fontcolor');
		if (fontcolorPlugin) {
			const fontcolorElement = fontcolorPlugin.createElement(color.color);
			this.executeMark(fontcolorElement, true);
		}
	}

	getColor() {
		const marks = this.queryMarks();
		const background =
			marks
				.find(
					(mark) =>
						this.editor.mark.findPlugin(mark)?.name === 'backcolor',
				)
				?.css('background-color') || '';
		const color =
			marks
				.find(
					(mark) =>
						this.editor.mark.findPlugin(mark)?.name === 'fontcolor',
				)
				?.css('color') || '';
		return {
			background: toHex(background),
			color: toHex(color),
		};
	}

	updateContent() {
		if (!this.#container) return;
		const value = this.getValue();
		let { text, marks } = value || { text: '', marks: [] };

		this.#container.removeClass('data-label-empty');
		if (!text) {
			text = this.editor.language.get('status')['defaultValue'];
			this.#container.addClass('data-label-empty');
		}
		this.#container.html(text);
		const color = this.getDefaultColor();
		this.setColor(color);
		(marks || []).forEach((mark) => {
			this.executeMark($(mark), true);
		});
	}

	getDefaultColor() {
		const colors = this.getColors();
		return colors.length > 0
			? colors[0]
			: {
					background: '#FFFFFF',
					color: '#222222',
			  };
	}

	getSelectionNodes() {
		return this.#container ? [this.#container] : [];
	}

	getMaxWidth = () => {
		const block = this.editor.block.closest(this.root);
		return block.get<Element>()!.clientWidth - 4;
	};

	onWindowResize = () => {
		this.updateMaxWidth();
	};

	updateMaxWidth = () => {
		const maxWidth = this.getMaxWidth();
		this.root
			.find('.data-label-container')
			.css('max-width', Math.max(maxWidth, 0) + 'px');
	};

	executeMark(mark?: NodeInterface, warp?: boolean) {
		if (!this.#container) return;

		const children = this.#container.children();
		if (!mark) {
			// 移除所有标记
			const marks = this.queryMarks(false);
			let hasBg = false;
			this.editor.mark.unwrapByNodes(
				marks.filter((unmark) => {
					if (hasBg) return true;
					const plugin = this.editor.mark.findPlugin(unmark);
					if (plugin?.name === 'backcolor') {
						hasBg = true;
						return false;
					}
					return true;
				}),
			);
			this.setValue({
				marks: [] as string[],
			} as T);
		} else if (warp) {
			const backgroundPlugin = this.editor.mark.findPlugin(mark);
			if (backgroundPlugin?.name === 'backcolor') {
				mark.addClass('data-label-background');
			}
			// 增加标记
			children.each((_, index) => {
				const child = children.eq(index);
				if (child) this.editor.mark.wrapByNode(child, mark);
			});
			const marks = this.queryMarks().map(
				(child) => child.clone().get<HTMLElement>()?.outerHTML || '',
			);
			this.setValue({
				marks,
			} as T);
		} else {
			const backgroundPlugin = this.editor.mark.findPlugin(mark);
			if (backgroundPlugin?.name === 'backcolor') {
				return;
			}
			// 移除标记
			this.editor.mark.unwrapByNodes(this.queryMarks(false), mark);
			const marks = this.queryMarks().map(
				(child) => child.get<HTMLElement>()?.outerHTML || '',
			);
			this.setValue({
				marks,
			} as T);
		}
		this.#statusEditor?.updateActive(this.getColor());
	}

	queryMarks(clone: boolean = true) {
		if (!this.#container) return [];
		return this.#container
			.allChildren()
			.filter((child) => child.isElement())
			.map((c) => {
				if (clone) {
					const child = c.clone();
					child.removeClass('data-label-background');
					return child;
				}
				return c;
			});
	}

	focusEditor() {
		this.#statusEditor?.focus();
	}

	onActivate(activated: boolean) {
		super.onActivate(activated);
		if (!isEngine(this.editor) || this.editor.readonly) return;
		if (activated) this.renderEditor();
		else this.#statusEditor?.destroy();
	}

	renderEditor() {
		if (!this.#statusEditor) return;
		const value = this.getValue();
		if (!value || !value.id) return;
		this.#position?.destroy();
		const defaultColor = this.getDefaultColor();
		const currentColor = this.getColor();
		this.#editorContainer = this.#statusEditor.render(
			value.id,
			value.text || '',
			{
				...defaultColor,
				...currentColor,
			},
		);
		if (!this.#container) return;
		this.#position?.bind(this.#editorContainer, this.#container);
	}

	render() {
		if (this.#container) {
			this.updateContent();
			return;
		}
		this.#container = $(`<span class="data-label-container"></span>`);
		this.updateContent();
		if (isEngine(this.editor)) {
			this.#container.attributes('draggable', 'true');
		}
		return this.#container;
	}

	didRender(): void {
		super.didRender();
		this.updateMaxWidth();
		window.addEventListener('resize', this.onWindowResize);
		this.editor.on('editor:resize', this.onWindowResize);
	}

	destroy() {
		this.#statusEditor?.destroy();
		this.#position?.destroy();
		window.removeEventListener('resize', this.onWindowResize);
		this.editor.off('editor:resize', this.onWindowResize);
	}
}

export default Status;
