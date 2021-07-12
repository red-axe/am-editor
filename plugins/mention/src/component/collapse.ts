import Keymaster from 'keymaster';
import { omit } from 'lodash-es';
import {
	$,
	DATA_ELEMENT,
	EngineInterface,
	isServer,
	NodeInterface,
	UI,
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

	constructor(engine: EngineInterface, options: Options) {
		this.otpions = options;
		this.engine = engine;
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
		let activeNode = this.root.find('.data-mention-item-active');
		const activeIndex = items.findIndex((item) => item.equal(activeNode));

		let index = direction === 'up' ? activeIndex - 1 : activeIndex + 1;
		if (index < 0) {
			index = items.length - 1;
		}
		if (index >= items.length) index = 0;
		activeNode = items[index];
		this.select(index);
		let offset = 0;
		this.root.find('.data-mention-item').each((node) => {
			if (activeNode.equal(node)) return false;
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
		window.removeEventListener('scroll', this.updatePosition, true);
		window.removeEventListener('resize', this.updatePosition, true);
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
		window.addEventListener('scroll', this.updatePosition, true);
		window.addEventListener('resize', this.updatePosition, true);
	}

	remove() {
		if (!this.root || this.root.length === 0) return;
		this.unbindEvents();
		this.root.remove();
		this.root = undefined;
	}

	updatePosition = () => {
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
			display: 'block',
		});
	};

	renderTemplate({ key, name, avatar }: MentionItem) {
		return `<div class="data-mention-item" data-key="${escape(
			key,
		)}" data-name="${escape(name)}">
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
			`<div class="data-mention-component-list" ${DATA_ELEMENT}="${UI}"/>`,
		);
		$(document.body).append(this.root);
		const { onSelect } = this.otpions;
		data.forEach((data) => {
			const itemNode = $(this.renderTemplate(data));
			itemNode.on('click', (event: MouseEvent) => {
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
				this.root
					?.find('.data-mention-item-active')
					.removeClass('data-mention-item-active');
				itemNode.addClass('data-mention-item-active');
			});
			this.root?.append(itemNode);
		});
		if (data.length === 0) {
			this.root.append(
				`<div class="data-mention-item"><span class="data-mention-item-text">Empty Data</span></div>`,
			);
		}
		this.target = target;
		this.updatePosition();
		this.select(0);
		this.bindEvents();
	}
}

export default CollapseComponent;
