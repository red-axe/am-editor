import {
	$,
	EngineInterface,
	isMobile,
	NodeInterface,
	Position,
} from '@aomao/engine';
import { createApp, App } from 'vue';
import AmEditor from './editor.vue';
import AmPreview from './preview.vue';

class Toolbar {
	private engine: EngineInterface;
	private root?: NodeInterface;
	private target?: NodeInterface;
	private mouseInContainer: boolean = false;
	private vm?: App;
	#position: Position;

	constructor(engine: EngineInterface) {
		this.engine = engine;
		const { change } = this.engine;
		this.#position = new Position(this.engine);
		change.event.onWindow('mousedown', (event: MouseEvent) => {
			if (!event.target) return;
			const target = $(event.target);
			const container = target.closest('.data-link-container');
			this.mouseInContainer = container && container.length > 0;
			if (!target.inEditor() && !this.mouseInContainer) this.hide();
		});
	}

	private create() {
		if (!this.target) return;
		let root = $('.data-link-container');
		if (root.length === 0) {
			root = $(
				`<div class="data-link-container${
					isMobile ? ' data-link-container-mobile' : ''
				}"></div>`,
			);
		}
		this.root = root;
		const rect = this.target.get<Element>()?.getBoundingClientRect();
		if (!rect) return;
		this.root.css({
			top: `${window.pageYOffset + rect.bottom + 4}px`,
			left: `${window.pageXOffset}px`,
			position: 'absolute',
			'z-index': 1,
		});
	}

	private onOk(text: string, link: string) {
		if (!this.target) return;
		const { change, history } = this.engine;
		const range = change.getRange();
		if (!change.rangePathBeforeCommand) {
			if (!range.startNode.inEditor()) {
				range.select(this.target, true);
				change.select(range);
			}
			change.cacheRangeBeforeCommand();
		}

		this.target.attributes('href', link);
		text = text.trim() === '' ? link : text;
		this.target.text(text);
		this.engine.inline.repairCursor(this.target);
		range.setStart(this.target.next()!, 1);
		range.setEnd(this.target.next()!, 1);
		change.apply(range);
		history.submitCache();
		this.mouseInContainer = false;
		this.hide();
	}

	editor(text: string, href: string, callback?: () => void) {
		const vm = createApp(AmEditor, {
			language: this.engine.language,
			defaultText: text,
			defaultLink: href,
			onLoad: () => {
				this.mouseInContainer = true;
				if (callback) callback();
			},
			onOk: (text: string, link: string) => this.onOk(text, link),
		});
		return vm;
	}

	preview(href: string, callback?: () => void) {
		const { change, inline, language } = this.engine;
		const vm = createApp(AmPreview, {
			language,
			href,
			onLoad: () => {
				if (callback) callback();
			},
			onEdit: () => {
				if (!this.target) return;
				this.mouseInContainer = false;
				this.hide(undefined, false);
				this.show(this.target, true);
			},
			onRemove: () => {
				if (!this.target) return;
				const range = change.getRange();
				range.select(this.target, true);
				inline.repairRange(range);
				change.select(range);
				change.cacheRangeBeforeCommand();
				inline.unwrap();
				this.mouseInContainer = false;
				this.target = undefined;
				this.hide();
			},
		});
		return vm;
	}

	show(target: NodeInterface, forceEdit?: boolean) {
		this.target = target;
		this.create();
		const text = target.text().replace(/\u200B/g, '');
		const href = target.attributes('href');
		const container = this.root!.get<HTMLDivElement>()!;

		const name = !href || forceEdit ? 'am-link-editor' : 'am-link-preview';
		if (this.vm && this.vm._component.name === name) {
			if (!this.root || !this.target) return;
			this.#position?.bind(this.root, this.target);
			return;
		} else if (this.vm) {
			this.vm.unmount();
			this.vm = undefined;
			this.#position?.destroy();
		}
		setTimeout(() => {
			this.vm =
				!href || forceEdit
					? this.editor(text, href, () => {
							this.#position?.update();
					  })
					: this.preview(href, () => {
							this.#position?.update();
					  });
			this.vm.mount(container);
		}, 20);
	}

	hide(target?: NodeInterface, clearTarget?: boolean) {
		if (target && this.target && target.equal(this.target)) return;
		const elment = this.root?.get<Element>();
		if (elment && !this.mouseInContainer) {
			if (this.vm) {
				this.vm.unmount();
				this.vm = undefined;
				this.#position?.destroy();
			}
			document.body.removeChild(elment);
			this.root = undefined;
			if (this.target && !this.target.attributes('href')) {
				const { change, inline } = this.engine;
				const range = change.getRange();
				range.select(this.target, true);
				change.select(range);
				inline.unwrap();
				this.engine.history.destroyCache();
			}
			if (clearTarget !== false) this.target = undefined;
		}
	}
}
export default Toolbar;
