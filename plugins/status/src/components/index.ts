import { $, ActiveTrigger, Card, CardType, NodeInterface } from '@aomao/engine';
import StatusEditor from './editor';
import './index.css';

export type StatusValue = {
	text: string;
	color: {
		background: string;
		color: string;
	};
};

class Status extends Card<StatusValue> {
	static get cardName() {
		return 'status';
	}

	static get cardType() {
		return CardType.INLINE;
	}

	static colors: Array<{
		background: string;
		color: string;
		border?: string;
	}> = [
		{
			background: '#FFE8E6',
			color: '#820014',
			border: '#FF4D4F',
		},
		{
			background: '#FCFCCA',
			color: '#614700',
			border: '#FFEC3D',
		},
		{
			background: '#E4F7D2',
			color: '#135200',
			border: '#73D13D',
		},
		{
			background: '#E9E9E9',
			color: '#595959',
			border: '#E9E9E9',
		},
		{
			background: '#D4EEFC',
			color: '#003A8C',
			border: '#40A9FF',
		},
		{
			background: '#DEE8FC',
			color: '#061178',
			border: '#597EF7',
		},
	];

	#container?: NodeInterface;
	#editorContainer?: NodeInterface;
	#statusEditor?: StatusEditor;

	init() {
		const { card } = this.editor;
		this.#statusEditor = new StatusEditor({
			colors: Status.colors,
			onChange: (
				text: string,
				color: {
					background: string;
					color: string;
				},
			) => {
				this.setValue({
					text,
					color,
				});
				this.updateContent();
			},
			onOk: (event: MouseEvent) => {
				event.stopPropagation();
				event.preventDefault();
				card.activate($(document.body), ActiveTrigger.MANUAL);
				card.focus(this);
			},
			onDestroy: () => {
				window.removeEventListener(
					'scroll',
					this.updateEditorPosition,
					true,
				);
				window.removeEventListener(
					'resize',
					this.updateEditorPosition,
					true,
				);
			},
		});
	}

	updateEditorPosition = () => {
		if (!this.#editorContainer || !this.#container) return;
		const targetRect = this.#container
			.get<Element>()
			?.getBoundingClientRect();
		if (!targetRect) return;
		const rootRect = this.#editorContainer
			.get<Element>()
			?.getBoundingClientRect();
		if (!rootRect) return;
		const { top, left, bottom } = targetRect;
		const { height, width } = rootRect;
		const styleLeft =
			left + width > window.innerWidth - 20
				? window.pageXOffset + window.innerWidth - width - 10
				: 20 > left - window.pageXOffset
				? window.pageXOffset + 20
				: window.pageXOffset + left;
		const styleTop =
			bottom + height > window.innerHeight - 20
				? window.pageYOffset + top - height - 4
				: window.pageYOffset + bottom + 4;
		this.#editorContainer.css({
			top: `${styleTop}px`,
			left: `${styleLeft}px`,
		});
	};

	updateContent() {
		if (!this.#container) return;
		const value = this.getValue();
		let { text, color } = value || { text: '', color: undefined };

		let opacity = 1;
		if (!text) {
			text = this.editor.language.get('status')['defaultValue'];
			opacity = 0.45;
		}
		if (!color) {
			color = this.getDefaultColor();
		}
		this.#container.css('background', color.background);
		this.#container.css('color', color.color);
		this.#container.css('opacity', opacity);
		this.#container.html(text);
	}

	getDefaultColor() {
		return Status.colors.length > 0
			? Status.colors[0]
			: {
					background: '#FFFFFF',
					color: '#222222',
			  };
	}

	focusEditor() {
		this.#statusEditor?.focus();
	}

	onActivate(activated: boolean) {
		super.onActivate(activated);
		if (this.readonly) return;
		if (activated) this.renderEditor();
		else this.#statusEditor?.destroy();
	}

	renderEditor() {
		if (!this.#statusEditor) return;
		const value = this.getValue();
		if (!value) return;
		this.#editorContainer = this.#statusEditor.render(
			value.id,
			value.text || '',
			value.color || this.getDefaultColor(),
		);
		$(document.body).append(this.#editorContainer);
		this.updateEditorPosition();
		window.addEventListener('scroll', this.updateEditorPosition, true);
		window.addEventListener('resize', this.updateEditorPosition, true);
	}

	render() {
		this.#container = $(`<span class="data-label-container"></span>`);
		this.updateContent();
		if (!this.readonly) {
			this.#container.css('cursor', 'pointer');
			this.#container.attributes('draggable', 'true');
			this.#container.css('user-select', 'none');
		}
		return this.#container;
	}
}

export default Status;
