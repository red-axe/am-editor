import Keymaster, { setScope, unbind, deleteScope } from 'keymaster';
import {
	$,
	DATA_ELEMENT,
	EngineInterface,
	NodeInterface,
	UI,
	Position,
	Scrollbar,
	unescape,
	escape,
} from '@aomao/engine';
import { MentionItem } from '../types';

export type Options = {
	onCancel?: () => void;
	onSelect?: (event: MouseEvent, data: { [key: string]: string }) => void;
};

export interface CollapseComponentInterface {
	select(index: number): void;
	scroll(direction: 'up' | 'down'): void;
	unbindEvents(): void;
	bindEvents(): void;
	remove(): void;
	render(target: NodeInterface, data: Array<MentionItem>): void;
}

class CollapseComponent implements CollapseComponentInterface {
	private engine: EngineInterface;
	private root?: NodeInterface;
	private target?: NodeInterface;
	private otpions: Options;
	private readonly SCOPE_NAME = 'data-mention-component';
	#position?: Position;
	#scrollbar?: Scrollbar;
	static renderItem?: (
		item: MentionItem,
		root: NodeInterface,
	) => string | NodeInterface | void;

	static renderEmpty: (root: NodeInterface) => string | NodeInterface | void =
		() => {
			return `<div class="data-mention-item"><span class="data-mention-item-text">Empty Data</span></div>`;
		};

	static renderLoading?: (
		root: NodeInterface,
	) => string | NodeInterface | void;

	static render?: (
		root: NodeInterface,
		data: MentionItem[],
		bindItem: (
			node: NodeInterface,
			data: { [key: string]: string },
		) => NodeInterface,
	) => Promise<string | NodeInterface | void>;

	constructor(engine: EngineInterface, options: Options) {
		this.otpions = options;
		this.engine = engine;
		this.#position = new Position(this.engine);
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
			?.find('.data-mention-item-active')
			.removeClass('data-mention-item-active');
		this.root
			?.find('.data-mention-item')
			.eq(index)
			?.addClass('data-mention-item-active');
	}

	scroll(direction: 'up' | 'down') {
		if (!this.root) return;
		const items = this.root.find('.data-mention-item').toArray();
		if (items.length === 0) return;
		let activeNode: NodeInterface | null =
			items.find((item) => item.hasClass('data-mention-item-active')) ||
			items[0];
		let startNode = activeNode;
		activeNode = direction === 'up' ? activeNode.prev() : activeNode.next();
		while (true) {
			if (!activeNode)
				activeNode =
					direction === 'up' ? items[items.length - 1] : items[0];
			if (
				!!activeNode.attributes('data-key') ||
				startNode.equal(activeNode)
			)
				break;
			else
				activeNode =
					direction === 'up' ? activeNode.prev() : activeNode.next();
		}
		if (!activeNode || !activeNode.attributes('data-key')) {
			this.select(-1);
			return;
		}
		this.select(items.findIndex((n) => n.equal(activeNode!)));
		let offset = 0;
		this.root.find('.data-mention-item').each((node) => {
			if (activeNode?.equal(node)) return false;
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
		this.#position?.destroy();
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
			const active = this.root?.find('.data-mention-item-active');
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
		if (!this.root || !this.target) return;
		this.#position?.bind(this.root, this.target);
	}

	remove() {
		if (!this.root || this.root.length === 0) return;
		this.#scrollbar?.destroy();
		this.unbindEvents();
		this.root.remove();
		this.root = undefined;
	}

	renderTemplate({ name, avatar }: MentionItem) {
		return `<div class="data-mention-item">
            ${
				avatar
					? `<span class="data-mention-item-avatar"><img src="${avatar}" /></span>`
					: ''
			}
            <span class="data-mention-item-text">${unescape(name)}</span>
        </div>`;
	}

	bindItem = (node: NodeInterface, data: { [key: string]: string }) => {
		const { onSelect } = this.otpions;
		node.addClass('data-mention-item');
		const { key, name } = data;
		if (key) {
			node.attributes({ 'data-key': escape(key) });
		} else {
			node.removeAttributes('data-key');
		}
		node.attributes({
			'data-name': escape(name),
		});
		node.on('click', (event: MouseEvent) => {
			if (!key) return;
			event.stopPropagation();
			event.preventDefault();
			if (onSelect) onSelect(event, data);
		});
		node.on('mouseenter', () => {
			if (!key) return;
			this.root
				?.find('.data-mention-item-active')
				.removeClass('data-mention-item-active');
			node.addClass('data-mention-item-active');
		});
		return node;
	};

	getBody() {
		return this.root?.find('.data-mention-component-body');
	}

	render(target: NodeInterface, data: Array<MentionItem>) {
		this.remove();
		this.root = $(
			`<div class="data-mention-component-list" ${DATA_ELEMENT}="${UI}"><div class="data-mention-component-body"></div></div>`,
		);

		this.target = target;

		let body = this.getBody();
		if (CollapseComponent.renderLoading) {
			const result = CollapseComponent.renderLoading(this.root);
			body = this.getBody();
			if (result) body?.append(result);
		} else if (data.filter((item) => !!item.key).length === 0) {
			const result = CollapseComponent.renderEmpty(this.root);
			body = this.getBody();
			if (result) body?.append(result);
		} else if (CollapseComponent.render) {
			CollapseComponent.render(this.root, data, this.bindItem).then(
				(result) => {
					const body = this.getBody();
					if (result) body?.append(result);
					this.#scrollbar?.destroy();
					if (body)
						this.#scrollbar = new Scrollbar(
							body,
							false,
							true,
							false,
						);
					this.scroll('down');
					this.bindEvents();
					this.#scrollbar?.refresh();
				},
			);
			return;
		} else {
			data.forEach((data) => {
				const result = CollapseComponent.renderItem
					? CollapseComponent.renderItem(data, this.root!)
					: this.renderTemplate(data);
				if (!result) return;

				body?.append(this.bindItem($(result), data as any));
			});
			this.select(0);
		}
		if (body) this.#scrollbar = new Scrollbar(body, false, true, false);
		this.bindEvents();
		this.#scrollbar?.refresh();
	}
}

export default CollapseComponent;
