import domAlign from 'dom-align';
import { EditorInterface, NodeInterface } from '../types';
import { $ } from '../node';
import placements from './placements';
import { isMobile } from '../utils/user-agent';
import { isEngine } from '../utils';

class Position {
	#editor: EditorInterface;
	#container?: NodeInterface;
	#target?: NodeInterface;
	#align: keyof typeof placements = 'bottomLeft';
	#offset: Array<number> = [0, 0];
	#root?: NodeInterface;
	#onUpdate?: (rect: any) => void;
	#updateTimeout?: NodeJS.Timeout;
	#observer?: ResizeObserver;

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
		if (!isMobile) window.addEventListener('scroll', this.updateListener);
		window.addEventListener('resize', this.updateListener);
		if (isEngine(this.#editor) && !isMobile) {
			this.#editor.scrollNode?.on('scroll', this.updateListener);
		}
		if (target && target.length > 0) {
			let size = { width: target.width(), height: target.height() };
			if (typeof ResizeObserver !== 'undefined') {
				this.#observer = new ResizeObserver(() => {
					const width = target.width();
					const height = target.height();

					if (width === size.width && height === size.height) return;
					size = {
						width,
						height,
					};
					this.updateListener();
				});
				this.#observer.observe(target.get<HTMLElement>()!);
			}
		}
		this.update();
	}

	setOffset(offset: Array<number>) {
		this.#offset = offset;
	}

	updateListener = () => {
		if (this.#updateTimeout) clearTimeout(this.#updateTimeout);
		this.#updateTimeout = setTimeout(() => {
			this.update();
		}, 50);
	};

	update = (triggerUpdate: boolean = true) => {
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

		if (this.#onUpdate && triggerUpdate) {
			const align = Object.keys(placements).find((p) => {
				const points = placements[p].points;
				return (
					points[0] === rect.points[0] && points[1] === rect.points[1]
				);
			});
			this.#container.attributes('data-placement', align);
			this.#onUpdate({ ...rect, align });
		}
	};

	destroy() {
		this.#onUpdate = undefined;
		if (!isMobile)
			window.removeEventListener('scroll', this.updateListener);
		window.removeEventListener('resize', this.updateListener);
		if (isEngine(this.#editor) && !isMobile) {
			this.#editor.scrollNode?.off('scroll', this.updateListener);
		}
		this.#observer?.disconnect();
		this.#root?.remove();
	}
}

export default Position;
