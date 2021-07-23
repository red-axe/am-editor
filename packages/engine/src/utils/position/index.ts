import domAlign from 'dom-align';
import { EditorInterface, isEngine, NodeInterface } from '../../types';
import { $ } from '../../node';
import placements from './placements';

class Position {
	#editor: EditorInterface;
	#container?: NodeInterface;
	#target?: NodeInterface;
	#align: keyof typeof placements = 'bottomLeft';
	#offset: Array<number> = [0, 0];
	#root?: NodeInterface;
	#onUpdate?: (rect: any) => void;

	constructor(editor: EditorInterface) {
		this.#editor = editor;
	}

	bind(
		container: NodeInterface,
		target: NodeInterface,
		defaultAlign: keyof typeof placements = this.#align,
		offset: Array<number> = this.#offset,
		onUpdate?: (rect: any) => void,
	) {
		this.#container = container;
		this.#target = target;
		this.#align = defaultAlign;
		this.#offset = offset;
		this.#root = $(
			`<div style="position: absolute; top: 0px; left: 0px; width: 100%;"></div>`,
		);
		this.#root.append(this.#container);
		this.#editor.root.append(this.#root);
		this.#onUpdate = onUpdate;
		window.addEventListener('scroll', this.update);
		window.addEventListener('resize', this.update);
		if (isEngine(this.#editor)) {
			this.#editor.scrollNode?.on('scroll', this.update);
		}
		this.update();
	}

	setOffset(offset: Array<number>) {
		this.#offset = offset;
	}

	update = () => {
		if (
			!this.#container ||
			this.#container.length === 0 ||
			!this.#target ||
			this.#target.length === 0
		)
			return;
		const rect = domAlign(
			this.#container.get<HTMLElement>(),
			this.#target.get<HTMLElement>(),
			{
				...placements[this.#align],
				targetOffset: this.#offset,
			},
		);

		if (this.#onUpdate) {
			const align = Object.keys(placements).find((p) => {
				const points = placements[p].points;
				return (
					points[0] === rect.points[0] && points[1] === rect.points[1]
				);
			});
			this.#onUpdate({ ...rect, align });
		}
	};

	destroy() {
		this.#onUpdate = undefined;
		window.removeEventListener('scroll', this.update);
		window.removeEventListener('resize', this.update);
		if (isEngine(this.#editor)) {
			this.#editor.scrollNode?.off('scroll', this.update);
		}
		this.#root?.remove();
	}
}

export default Position;
