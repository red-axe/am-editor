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
import { MentionItem, MentionOptions } from '../types';

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
	render(target: NodeInterface, data: Array<MentionItem> | true): void;
}

class CollapseComponent implements CollapseComponentInterface {
	private engine: EngineInterface;
	private root?: NodeInterface;
	private target?: NodeInterface;
	private otpions: Options;
	private readonly SCOPE_NAME = 'data-mention-component';
	#position?: Position;
	#scrollbar?: Scrollbar;

	renderEmpty: (root: NodeInterface) => string | NodeInterface | void =
		() => {
			return `<div class="data-mention-item"><span class="data-mention-item-text">Empty Data</span></div>`;
		};

	constructor(engine: EngineInterface, options: Options) {
		this.otpions = options;
		this.engine = engine;
		this.#position = new Position(this.engine);
	}

	getPluginOptions = () => {
		const mentionOptions =
			this.engine.plugin.findPlugin<MentionOptions>('mention');
		return mentionOptions?.options;
	};

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
		node.removeAllEvents();
		node.on(
			'click',
			(event: MouseEvent) => {
				if (!key) return;
				event.stopPropagation();
				event.preventDefault();
				if (onSelect) onSelect(event, data);
			},
			{
				once: true,
			},
		);
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

	createRoot() {
		this.root = $(
			`<div class="data-mention-component-list" ${DATA_ELEMENT}="${UI}"><div class="data-mention-component-body"></div></div>`,
		);
	}

	renderRootEmpty() {
		const body = this.getBody();
		const children = body?.children();
		if (
			body &&
			body.length > 0 &&
			(children?.length === 0 ||
				(children?.length === 1 &&
					children.eq(0)?.hasClass('data-scrollbar')))
		) {
			this.root?.addClass('data-mention-component-empty');
		} else {
			this.root?.removeClass('data-mention-component-empty');
		}
	}

	render(target: NodeInterface, data: Array<MentionItem> | true) {
		if (!this.root) this.createRoot();
		if (!this.root) return;

		this.target = target;

		let body = this.getBody();

		let result = null;
		const options = this.getPluginOptions();
		if (typeof data === 'boolean' && data === true) {
			result = options?.onLoading
				? options.onLoading(this.root)
				: this.engine.trigger('mention:loading', this.root);
			body = this.getBody();
			if (result) body?.empty().append(result);
		} else if (data.filter((item) => !!item.key).length === 0) {
			const result =
				this.engine.trigger('mention:empty', this.root) ||
				(options?.onEmpty
					? options?.onEmpty(this.root)
					: this.renderEmpty(this.root));
			body = this.getBody();
			if (result) body?.empty().append(result);
		} else if (
			options?.onRender ||
			(result = this.engine.trigger(
				'mention:render',
				this.root,
				data,
				this.bindItem,
			))
		) {
			(options?.onRender
				? options.onRender(this.root, data, this.bindItem)
				: result
			).then((content: any) => {
				const body = this.getBody();
				if (content) body?.empty().append(content);
				this.#scrollbar?.destroy();
				if (body)
					this.#scrollbar = new Scrollbar(body, false, true, false);
				this.select(0);
				this.bindEvents();
				this.#scrollbar?.refresh();
			});
			this.renderRootEmpty();
			return;
		} else {
			if (!body || body.length === 0) {
				this.createRoot();
				body = this.getBody();
			}
			body?.empty();
			data.forEach((data) => {
				const triggerResult = this.engine.trigger(
					'mention:render-item',
					data,
					this.root!,
				);
				const result = triggerResult
					? triggerResult
					: options?.onRenderItem
					? options.onRenderItem(data, this.root!)
					: this.renderTemplate(data);
				if (!result) return;

				body?.append(this.bindItem($(result), data as any));
			});
			this.select(0);
		}
		this.renderRootEmpty();
		if (body) this.#scrollbar = new Scrollbar(body, false, true, false);
		this.bindEvents();
		this.#scrollbar?.refresh();
	}
}

export default CollapseComponent;
