import Keymaster from 'keymaster';
import { omit } from 'lodash-es';
import {
	$,
	DATA_ELEMENT,
	EngineInterface,
	isServer,
	NodeInterface,
	UI,
	Position,
} from '@aomao/engine';
import { MentionItem } from '../types';

export type Options = {
	onCancel?: () => void;
	onSelect?: (event: MouseEvent, id: string, name: string) => void;
};

export interface CollapseComponentInterface {
	select(index: number): void;
	scroll(direction: 'up' | 'down'): void;
	unbindEvents(): void;
	bindEvents(): void;
	remove(): void;
	render(target: NodeInterface, data: Array<MentionItem>): void;
}

let keymasterMoudle:
	| {
			keymaster: Keymaster;
			setScope(scopeName: string): void;
			getScope(): string;
			deleteScope(scopeName: string): void;

			unbind(key: string): void;
			unbind(key: string, scopeName: string): void;
	  }
	| undefined = undefined;
if (!isServer) {
	import('keymaster').then((moudle) => {
		keymasterMoudle = {
			keymaster: moudle.default,
			...omit(moudle, 'default'),
		};
	});
}

class CollapseComponent implements CollapseComponentInterface {
	private engine: EngineInterface;
	private root?: NodeInterface;
	private target?: NodeInterface;
	private otpions: Options;
	private readonly SCOPE_NAME = 'data-mention-component';
	#position?: Position;
	static renderItem?: (item: MentionItem) => string | NodeInterface;

	static renderEmpty = () => {
		return `<div class="data-mention-item"><span class="data-mention-item-text">Empty Data</span></div>`;
	};

	static renderLoading = () => {
		return `<div class="data-mention-loading"><span class="data-mention-item-text">加载中...</span></div>`;
	};

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
		this.select(
			items.findIndex(
				(n) =>
					n.attributes('data-key') ===
					activeNode?.attributes('data-key'),
			),
		);
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
		if (!keymasterMoudle) return;
		const { deleteScope, unbind } = keymasterMoudle;
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
		if (!keymasterMoudle) return;
		const { setScope, keymaster } = keymasterMoudle;
		setScope(this.SCOPE_NAME);
		//回车
		keymaster('enter', this.SCOPE_NAME, (event) => {
			// Card 已被删除
			if (this.root?.closest('body').length === 0) {
				return;
			}
			event.preventDefault();
			const active = this.root?.find('.data-mention-item-active');
			active?.get<HTMLElement>()?.click();
		});

		keymaster('up', this.SCOPE_NAME, (event) => {
			// Card 已被删除
			if (this.root?.closest('body').length === 0) {
				return;
			}
			event.preventDefault();
			this.scroll('up');
		});
		keymaster('down', this.SCOPE_NAME, (e) => {
			// Card 已被删除
			if (this.root?.closest('body').length === 0) {
				return;
			}
			e.preventDefault();
			this.scroll('down');
		});
		keymaster('esc', this.SCOPE_NAME, (event) => {
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

	render(target: NodeInterface, data: Array<MentionItem>) {
		this.remove();
		this.root = $(
			`<div class="data-mention-component-list" ${DATA_ELEMENT}="${UI}" />`,
		);
		const { onSelect } = this.otpions;
		data.forEach((data) => {
			const itemNode = $(
				CollapseComponent.renderItem
					? CollapseComponent.renderItem(data)
					: this.renderTemplate(data),
			);
			itemNode.addClass('data-mention-item');
			if (data.key) {
				itemNode.attributes({ 'data-key': escape(data.key) });
			} else {
				itemNode.removeAttributes('data-key');
			}
			itemNode.attributes({
				'data-name': escape(data.name),
			});
			itemNode.on('click', (event: MouseEvent) => {
				if (!data.key) return;
				event.stopPropagation();
				event.preventDefault();
				if (onSelect)
					onSelect(
						event,
						itemNode.attributes('data-key'),
						itemNode.attributes('data-name'),
					);
			});
			itemNode.on('mouseenter', () => {
				if (!data.key) return;
				this.root
					?.find('.data-mention-item-active')
					.removeClass('data-mention-item-active');
				itemNode.addClass('data-mention-item-active');
			});
			this.root?.append(itemNode);
		});
		if (data.length === 0) {
			this.root.append(CollapseComponent.renderEmpty());
		}
		this.target = target;
		this.scroll('down');
		this.bindEvents();
	}
}

export default CollapseComponent;
