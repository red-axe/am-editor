import React from 'react';
import ReactDOM from 'react-dom';
import { omit } from 'lodash-es';
import { EngineInterface, isServer, NodeInterface } from '@aomao/engine';
import Collapse from '../../collapse';
import { CollapseGroupProps } from '../../collapse/group';

export type Options = {
	onCancel?: () => void;
	onSelect?: (event: React.MouseEvent, name: string) => void;
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
	import('keymaster').then(moudle => {
		keymasterMoudle = {
			keymaster: moudle.default,
			...omit(moudle, 'default'),
		};
	});
}

class CollapseComponent implements CollapseComponentInterface {
	private engine: EngineInterface;
	private root?: NodeInterface;
	private otpions: Options;
	private readonly SCOPE_NAME = 'data-toolbar-component';

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
		const activeIndex = items.findIndex(item => item.equal(activeNode));

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
			.each(node => {
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
	}

	bindEvents() {
		this.unbindEvents();
		if (!keymasterMoudle) return;
		const { setScope, keymaster } = keymasterMoudle;
		setScope(this.SCOPE_NAME);
		//回车
		keymaster('enter', this.SCOPE_NAME, event => {
			// Card 已被删除
			if (this.root?.closest('body').length === 0) {
				return;
			}
			event.preventDefault();
			const active = this.root?.find('.toolbar-collapse-item-active');
			active?.get<HTMLElement>()?.click();
		});

		keymaster('up', this.SCOPE_NAME, event => {
			// Card 已被删除
			if (this.root?.closest('body').length === 0) {
				return;
			}
			event.preventDefault();
			this.scroll('up');
		});
		keymaster('down', this.SCOPE_NAME, e => {
			// Card 已被删除
			if (this.root?.closest('body').length === 0) {
				return;
			}
			e.preventDefault();
			this.scroll('down');
		});
		keymaster('esc', this.SCOPE_NAME, event => {
			event.preventDefault();
			this.unbindEvents();
			const { onCancel } = this.otpions;
			if (onCancel) onCancel();
		});
		this.engine.on('keydown:enter', this.handlePreventDefault);
	}

	remove() {
		if (!this.root || this.root.length === 0) return;
		ReactDOM.unmountComponentAtNode(this.root.get<Element>()!);
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
		this.root = this.engine.$(
			'<div class="data-toolbar-component-list" />',
		);
		container.append(this.root);
		const rootElement = this.root.get<HTMLElement>()!;
		ReactDOM.render(
			<Collapse
				engine={this.engine}
				groups={data}
				onSelect={this.otpions.onSelect}
			/>,
			rootElement,
			() => {
				let [top, left] = [0, 0];
				let rectNode: NodeInterface | undefined = target;
				while (rectNode) {
					const targetRect = rectNode.getBoundingClientRect() || {
						left: 0,
						top: 0,
					};

					const parent: NodeInterface | undefined = rectNode.parent();
					if (!parent) break;
					const parentRect = parent.getBoundingClientRect() || {
						left: 0,
						top: 0,
					};
					top += targetRect.top - parentRect.top;
					left += targetRect.left - parentRect.left;
					if (parent.equal(container)) break;
					rectNode = parent;
				}

				rootElement.style.top = `${top + target.height() / 2}px`;
				rootElement.style.left = `${left}px`;
			},
		);
		this.select(0);
		this.bindEvents();
	}
}

export default CollapseComponent;
