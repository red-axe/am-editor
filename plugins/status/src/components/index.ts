import {
	$,
	ActiveTrigger,
	Card,
	CardType,
	isEngine,
	NodeInterface,
	Position,
} from '@aomao/engine';
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
	#position?: Position;

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
				this.#position?.destroy();
			},
		});
	}

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
		if (!isEngine(this.editor) || this.editor.readonly) return;
		if (activated) this.renderEditor();
		else this.#statusEditor?.destroy();
	}

	renderEditor() {
		if (!this.#statusEditor) return;
		const value = this.getValue();
		if (!value) return;
		this.#position?.destroy();
		this.#editorContainer = this.#statusEditor.render(
			value.id,
			value.text || '',
			value.color || this.getDefaultColor(),
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
			this.#container.css('cursor', 'pointer');
			this.#container.attributes('draggable', 'true');
			this.#container.css('user-select', 'none');
		}
		return this.#container;
	}

	destroy() {
		this.#statusEditor?.destroy();
		this.#position?.destroy();
	}
}

export default Status;
