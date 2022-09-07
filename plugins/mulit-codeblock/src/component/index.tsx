import {
	$,
	Card,
	CardToolbarItemOptions,
	CardType,
	isEngine,
	NodeInterface,
	ToolbarItemOptions,
	CardActiveTrigger,
} from '@aomao/engine';
import React from 'react';
import ReactDOM from 'react-dom';
import MulitCodeComponent from './mulitcodeblock';
import renderThemeSelect from './common/themeSelect';
import type { MulitCodeblockValue, MulitCodeblockOptions } from './type';
import { Editor } from 'codemirror';

class MulitCode extends Card<MulitCodeblockValue> {
	static get cardName() {
		return 'mulit_codeblock';
	}

	static get cardType() {
		return CardType.BLOCK;
	}

	static get autoSelected() {
		return false;
	}

	static get singleSelectable() {
		return false;
	}

	static get lazyRender() {
		return true;
	}

	#mulitCode?: Editor;

	#container?: NodeInterface;

	defaultFocus = false;

	toolbar(): Array<ToolbarItemOptions | CardToolbarItemOptions> {
		if (!isEngine(this.editor) || this.editor.readonly) {
			return [];
		}

		const language = this.editor.language.get('mulitCodeblock');
		const value = this.getValue();
		const { wrap, theme } = value;

		return [
			{ type: 'dnd' },
			{ type: 'copy' },
			{ type: 'delete' },
			{
				key: 'select',
				type: 'node',
				node: $('<div />'),
				didMount: (node) => {
					setTimeout(() => {
						renderThemeSelect({
							theme,
							onChange: (newtheme) => {
								this.themeChangeRefreshHtml(newtheme);
							},
							container: node?.get?.() as HTMLElement,
						});
					}, 10);
				},
			},
			{
				key: 'switch',
				type: 'switch',
				content: language['wrap'],
				checked: wrap,
				getState: () => Boolean(this.getValue()?.wrap),
				onClick: () => {
					this.wrapChangeRefreshHtml();
				},
			},
		];
	}

	themeChangeRefreshHtml(theme?: string) {
		// const value = this.getValue();
		const CM = this.#mulitCode;
		CM?.setOption('theme', theme);
		this.setValue({ theme });

		setTimeout(() => {
			CM?.focus();
		}, 16);
	}

	wrapChangeRefreshHtml() {
		const value = this.getValue();
		const CM = this.#mulitCode;
		const { wrap } = value;
		CM?.setOption('lineWrapping', !wrap);
		this.setValue({ wrap: !wrap });

		setTimeout(() => {
			CM?.focus();
		}, 16);
	}

	createOption(): MulitCodeblockOptions {
		const { editor } = this;

		return {
			onUpdateValue: (newValue) => {
				const value = this.getValue();
				this.setValue({
					...value,
					...newValue,
				});
			},
			onMouseDown: () => {
				if (!this.activated) {
					editor.card.activate(
						this.root,
						CardActiveTrigger.MOUSE_DOWN,
					);
				}
			},
			onUpFocus: (event: KeyboardEvent) => {
				if (!isEngine(editor)) {
					return;
				}
				event.preventDefault();
				const { change, card } = editor;
				const range = change.range.get().cloneRange();
				const prev = this.root.prev();
				const cardComponent = prev ? card.find(prev) : undefined;
				if (cardComponent?.onSelectUp) {
					cardComponent.onSelectUp(event);
				} else if (prev) {
					card.focusPrevBlock(this, range, false);
					change.range.select(range);
				} else {
					this.focus(range, true);
					change.range.select(range);
					return;
				}
				this.activate(false);
				this.toolbarModel?.hide();
			},
			onDownFocus: (event: KeyboardEvent) => {
				if (!isEngine(editor)) {
					return;
				}
				event.preventDefault();
				const { change, card } = editor;
				const range = change.range.get().cloneRange();
				const next = this.root.next();
				const cardComponent = next ? card.find(next) : undefined;
				if (cardComponent?.onSelectDown) {
					cardComponent.onSelectDown(event);
				} else if (next) {
					card.focusNextBlock(this, range, false);
					change.range.select(range);
				} else {
					this.focus(range, false);
					change.range.select(range);
					return;
				}
				this.activate(false);
				this.toolbarModel?.hide();
			},
			onLeftFocus: (event: KeyboardEvent) => {
				if (!isEngine(editor)) {
					return;
				}
				event.preventDefault();
				const { change } = editor;
				const range = change.range.get().cloneRange();
				this.focus(range, true);
				change.range.select(range);
				this.activate(false);
				this.toolbarModel?.hide();
			},
			onRightFocus: (event: KeyboardEvent) => {
				if (!isEngine(editor)) {
					return;
				}
				event.preventDefault();
				const { change } = editor;
				const range = change.range.get().cloneRange();
				this.focus(range, false);
				change.range.select(range);
				this.activate(false);
				this.toolbarModel?.hide();
			},
		};
	}

	render(focus?: boolean) {
		this.#container = $('<div>Loading</div>');
		this.defaultFocus = focus ?? false;
		return this.#container;
	}

	didRender() {
		super.didRender();
		const value = this.getValue();
		const { editor } = this;

		ReactDOM.render(
			<MulitCodeComponent
				init={(CM) => {
					this.#mulitCode = CM;
					if (this.defaultFocus) CM.focus();
				}}
				value={value}
				editor={editor}
				options={this.createOption()}
			/>,
			this.#container?.get?.() as HTMLElement,
		);
	}

	destroy() {
		super.destroy();
		const container = this.#container?.get<HTMLElement>();
		if (container) ReactDOM.unmountComponentAtNode(container);
	}
}
export default MulitCode;

export type { MulitCodeblockValue };
