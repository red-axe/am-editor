import React from 'react';
import ReactDOM from 'react-dom';
import ConfigProvider from 'antd/es/config-provider';
import {
	$,
	EngineInterface,
	NodeInterface,
	isMobile,
	Position,
} from '@aomao/engine';
import Editor from './editor';
import Preview from './preview';

class Toolbar {
	private engine: EngineInterface;
	private root?: NodeInterface;
	private target?: NodeInterface;
	private mouseInContainer: boolean = false;
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

	editor(text: string, href: string) {
		return (
			<Editor
				language={this.engine.language}
				defaultText={text}
				defaultLink={href}
				onLoad={() => (this.mouseInContainer = true)}
				onOk={(text: string, link: string) => this.onOk(text, link)}
			/>
		);
	}

	preview(href: string) {
		return (
			<Preview
				language={this.engine.language}
				onEdit={() => {
					if (!this.target) return;
					this.mouseInContainer = false;
					this.hide(undefined, false);
					this.show(this.target, true);
				}}
				onRemove={() => {
					if (!this.target) return;
					const { change, inline } = this.engine;
					const range = change.getRange();
					range.select(this.target, true);
					inline.repairRange(range);
					change.select(range);
					change.cacheRangeBeforeCommand();
					inline.unwrap();
					this.mouseInContainer = false;
					this.target = undefined;
					this.hide();
				}}
				href={href}
			/>
		);
	}

	show(target: NodeInterface, forceEdit?: boolean) {
		this.target = target;
		this.create();
		const text = target.text().replace(/\u200B/g, '');
		const href = target.attributes('href');
		const container = this.root!.get<HTMLDivElement>()!;
		ReactDOM.render(
			<ConfigProvider autoInsertSpaceInButton={false}>
				{!href || forceEdit
					? this.editor(text, href)
					: this.preview(href)}
			</ConfigProvider>,
			container,
			() => {
				if (!this.root || !this.target) return;
				this.#position?.bind(this.root, this.target);
			},
		);
	}

	hide(target?: NodeInterface, clearTarget?: boolean) {
		if (target && this.target && target.equal(this.target)) return;
		const elment = this.root?.get<Element>();
		if (elment && !this.mouseInContainer) {
			ReactDOM.unmountComponentAtNode(elment);
			this.#position?.destroy();
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
