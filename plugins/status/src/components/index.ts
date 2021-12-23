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

	static colors: Array<{
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

	init() {
		super.init();
		const { card } = this.editor;
		if (!this.#position) this.#position = new Position(this.editor);
		if (this.#statusEditor) return;
		this.#statusEditor = new StatusEditor({
			colors: Status.colors,
			onChange: (
				text: string,
				color: {
					background: string;
					color: string;
				},
			) => {
				this.setColor(color);
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
		return Status.colors.length > 0
			? Status.colors[0]
			: {
					background: '#FFFFFF',
					color: '#222222',
			  };
	}

	getSelectionNodes() {
		return this.#container ? [this.#container] : [];
	}

	executeMark(mark?: NodeInterface, warp?: boolean) {
		if (!this.#container) return;

		const children = this.#container.children();
		if (!mark) {
			// 移除所有标记
			this.editor.mark.unwrapByNodes(this.queryMarks());
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
				(child) => child.get<HTMLElement>()?.outerHTML || '',
			);
			this.setValue({
				marks,
			} as T);
		} else {
			// 移除标记
			this.editor.mark.unwrapByNodes(this.queryMarks(), mark);
			const marks = this.queryMarks().map(
				(child) => child.get<HTMLElement>()?.outerHTML || '',
			);
			this.setValue({
				marks,
			} as T);
		}
		this.#statusEditor?.updateActive(this.getColor());
	}

	queryMarks() {
		if (!this.#container) return [];
		return this.#container
			.allChildren()
			.filter((child) => child.isElement());
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

	destroy() {
		this.#statusEditor?.destroy();
		this.#position?.destroy();
	}
}

export default Status;
