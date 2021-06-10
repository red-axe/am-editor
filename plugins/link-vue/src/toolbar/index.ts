import { $, EngineInterface, isMobile, NodeInterface } from '@aomao/engine';
import { createApp, App } from 'vue';
import AmEditor from './editor.vue';
import AmPreview from './preview.vue';

class Toolbar {
	private engine: EngineInterface;
	private root?: NodeInterface;
	private target?: NodeInterface;
	private mouseInContainer: boolean = false;
	private vm?: App;

	constructor(engine: EngineInterface) {
		this.engine = engine;
		const { change } = this.engine;
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
			document.body.appendChild(root[0]);
		}
		this.root = root;
		const rect = this.target.get<Element>()?.getBoundingClientRect();
		if (!rect) return;
		this.root.css({
			top: `${window.pageYOffset + rect.bottom + 4}px`,
			left: `${window.pageXOffset}px`,
			position: 'absolute',
			'z-index': 1400,
		});
	}

	private update() {
		if (!this.root || !this.target) return;
		const targetRect = this.target.get<Element>()?.getBoundingClientRect();
		if (!targetRect) return;
		const rootRect = this.root.get<Element>()?.getBoundingClientRect();
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
		this.root.css({
			top: `${styleTop}px`,
			left: `${styleLeft}px`,
		});
	}

	private onOk(text: string, link: string) {
		if (!this.target) return;
		const { change, history, inline } = this.engine;
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
		const callback = () => {
			this.update();
		};
		const name = !href || forceEdit ? 'am-link-editor' : 'am-link-preview';
		if (this.vm && this.vm._component.name === name) {
			this.update();
			window.addEventListener('scroll', this.update, true);
			window.addEventListener('resize', this.update, true);
			return;
		} else if (this.vm) {
			this.vm.unmount();
			this.vm = undefined;
			window.removeEventListener('scroll', this.update, true);
			window.removeEventListener('resize', this.update, true);
		}
		setTimeout(() => {
			this.vm =
				!href || forceEdit
					? this.editor(text, href, callback)
					: this.preview(href, callback);
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
				window.removeEventListener('scroll', this.update, true);
				window.removeEventListener('resize', this.update, true);
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
