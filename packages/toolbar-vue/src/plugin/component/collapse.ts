import { createApp, App } from 'vue';
import Keymaster, { deleteScope, setScope, unbind } from 'keymaster';
import { $, EngineInterface, NodeInterface, Position } from '@aomao/engine';
import Collapse from '../../components/collapse/collapse.vue';
import { CollapseGroupProps } from '../../types';

export type Options = {
	onCancel?: () => void;
	onSelect?: (event: MouseEvent, name: string) => void;
};

export interface CollapseComponentInterface {
	select(index: number): void;
	scroll(direction: 'up' | 'down'): void;
	unbindEvents(): void;
	bindEvents(): void;
	remove(): void;
	render(
		container: NodeInterface,
		target: NodeInterface,
		data: Array<CollapseGroupProps>,
	): void;
}

class CollapseComponent implements CollapseComponentInterface {
	private engine: EngineInterface;
	private root?: NodeInterface;
	private otpions: Options;
	private vm?: App;
	#position?: Position;
	private readonly SCOPE_NAME = 'data-toolbar-component';

	constructor(engine: EngineInterface, options: Options) {
		this.otpions = options;
		this.engine = engine;
		this.#position = new Position(engine);
	}

	handlePreventDefault = (event: Event) => {
		// Card已被删除
		if (this.root?.closest('body').length !== 0) {
			event.preventDefault();
			return false;
		}
		return;
	};

	select(index: number) {
		this.root
			?.find('.toolbar-collapse-item-active')
			.removeClass('toolbar-collapse-item-active');
		this.root
			?.find('.toolbar-collapse-item')
			.eq(index)
			?.addClass('toolbar-collapse-item-active');
	}

	scroll(direction: 'up' | 'down') {
		if (!this.root) return;
		const items = this.root.find('.toolbar-collapse-item').toArray();
		let activeNode = this.root.find('.toolbar-collapse-item-active');
		const activeIndex = items.findIndex((item) => item.equal(activeNode));

		let index = direction === 'up' ? activeIndex - 1 : activeIndex + 1;
		if (index < 0) {
			index = items.length - 1;
		}
		if (index >= items.length) index = 0;
		activeNode = items[index];
		this.select(index);
		let offset = 0;
		this.root
			.find('.toolbar-collapse-group-title,.toolbar-collapse-item')
			.each((node) => {
				if (activeNode.equal(node)) return false;
				offset += (node as Element).clientHeight;
				return;
			});
		const rootElement = this.root.get<Element>()!;
		rootElement.scrollTop = offset - rootElement.clientHeight / 2;
	}

	unbindEvents() {
		deleteScope(this.SCOPE_NAME);
		unbind('enter', this.SCOPE_NAME);
		unbind('up', this.SCOPE_NAME);
		unbind('down', this.SCOPE_NAME);
		unbind('esc', this.SCOPE_NAME);
		this.engine.off('keydown:enter', this.handlePreventDefault);
	}

	bindEvents() {
		this.unbindEvents();
		setScope(this.SCOPE_NAME);
		//回车
		Keymaster('enter', this.SCOPE_NAME, (event) => {
			// Card 已被删除
			if (this.root?.closest('body').length === 0) {
				return;
			}
			event.preventDefault();
			const active = this.root?.find('.toolbar-collapse-item-active');
			active?.get<HTMLElement>()?.click();
		});

		Keymaster('up', this.SCOPE_NAME, (event) => {
			// Card 已被删除
			if (this.root?.closest('body').length === 0) {
				return;
			}
			event.preventDefault();
			this.scroll('up');
		});
		Keymaster('down', this.SCOPE_NAME, (e) => {
			// Card 已被删除
			if (this.root?.closest('body').length === 0) {
				return;
			}
			e.preventDefault();
			this.scroll('down');
		});
		Keymaster('esc', this.SCOPE_NAME, (event) => {
			event.preventDefault();
			this.unbindEvents();
			const { onCancel } = this.otpions;
			if (onCancel) onCancel();
		});
		this.engine.on('keydown:enter', this.handlePreventDefault);
	}

	remove() {
		if (!this.root || this.root.length === 0) return;
		this.#position?.destroy();
		if (this.vm) this.vm.unmount();
		this.root.remove();
		this.root = undefined;
	}

	render(
		container: NodeInterface,
		target: NodeInterface,
		data: Array<CollapseGroupProps>,
	) {
		this.unbindEvents();
		this.remove();
		this.root = $('<div class="data-toolbar-component-list" />');
		container.append(this.root);

		const rootElement = this.root.get<HTMLElement>()!;

		const { onSelect } = this.otpions;
		if (data.length > 0) {
			this.vm = createApp(Collapse, {
				engine: this.engine,
				groups: data,
				onSelect,
			});
			this.vm.mount(rootElement);
		} else {
			this.root.append(
				`<div class="data-toolbar-component-list-empty">${this.engine.language.get(
					'toolbar',
					'searchEmtpy',
					'title',
				)}</div>`,
			);
		}

		this.select(0);
		this.bindEvents();
		this.#position?.bind(this.root, target);
	}
}

export default CollapseComponent;
