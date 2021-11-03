import {
	$,
	EditorInterface,
	NodeInterface,
	RangeInterface,
	EventListener,
	DATA_ELEMENT,
	UI,
} from '@aomao/engine';

class Button {
	#editor: EditorInterface;
	#container: NodeInterface;

	constructor(editor: EditorInterface) {
		this.#editor = editor;
		this.#container = this.init();
	}

	init() {
		const { root } = this.#editor;
		const container = $(
			`<div class="data-comment-button-container" ${DATA_ELEMENT}="${UI}"><span class="data-icon data-icon-comment"></span></div>`,
		);
		root.append(container);
		return container;
	}

	show(range: RangeInterface) {
		const { root } = this.#editor;
		const rangeRect = range.getClientRect();
		const rootRect = root.get<HTMLElement>()!.getBoundingClientRect();
		const top = rangeRect.y - rootRect.y;
		this.#container.css('top', `${top}px`);
		this.#container.css('right', `16px`);
		this.#container.show('flex');
	}

	hide() {
		this.#container.hide();
	}

	on(eventType: string, listener: EventListener) {
		this.#container.on(eventType, listener);
	}

	off(eventType: string, listener: EventListener) {
		this.#container.off(eventType, listener);
	}
}

export default Button;
