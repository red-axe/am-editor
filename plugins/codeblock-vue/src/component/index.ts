import type { Editor } from 'codemirror';
import {
	$,
	CardActiveTrigger,
	Card,
	CardToolbarItemOptions,
	CardType,
	isEngine,
	isServer,
	ToolbarItemOptions,
	CardValue,
} from '@aomao/engine';
import CodeBlockEditor from './editor';
import renderSelect from './select';
import modeDatas from './mode';
import { CodeBlockEditorInterface } from './types';
import './index.css';

export interface CodeBlockValue extends CardValue {
	mode?: string;
	code?: string;
	autoWrap?: boolean;
}

class CodeBlcok<V extends CodeBlockValue = CodeBlockValue> extends Card<V> {
	mirror?: Editor;
	static get cardName() {
		return 'codeblock';
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

	static getModes() {
		return modeDatas;
	}

	static get lazyRender() {
		return true;
	}

	resize = () => {
		return this.codeEditor?.container.find('.data-codeblock-content');
	};

	codeEditor?: CodeBlockEditorInterface;

	#modeNameMap: { [key: string]: string } = {};
	#modeSynatxMap: { [key: string]: string } = {};

	init() {
		if (isServer) return;
		super.init();
		if (this.codeEditor) return;
		modeDatas.forEach((item) => {
			this.#modeNameMap[item.value] = item.name;
			this.#modeSynatxMap[item.value] = item.syntax;
		});

		this.codeEditor = new CodeBlockEditor(this.editor, {
			synatxMap: this.#modeSynatxMap,
			onSave: (mode, value) => {
				const oldValue = this.getValue();
				if (mode === oldValue?.mode && value === oldValue.code) return;
				this.setValue({
					mode,
					code: value,
				} as V);
			},
			onMouseDown: (event) => {
				if (!this.activated)
					setTimeout(() => {
						this.editor.card.activate(
							this.root,
							CardActiveTrigger.MOUSE_DOWN,
						);
					}, 10);
			},
			onUpFocus: (event) => {
				if (!isEngine(this.editor)) return;
				event.preventDefault();
				const { change, card } = this.editor;
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
			onDownFocus: (event) => {
				if (!isEngine(this.editor)) return;
				event.preventDefault();
				const { change, card } = this.editor;
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
			onLeftFocus: (event) => {
				if (!isEngine(this.editor)) return;
				event.preventDefault();
				const { change } = this.editor;
				const range = change.range.get().cloneRange();
				this.focus(range, true);
				change.range.select(range);
				this.activate(false);
				this.toolbarModel?.hide();
			},
			onRightFocus: (event) => {
				if (!isEngine(this.editor)) return;
				event.preventDefault();
				const { change } = this.editor;
				const range = change.range.get().cloneRange();
				this.focus(range, false);
				change.range.select(range);
				this.activate(false);
				this.toolbarModel?.hide();
			},
		});
	}
	#viewAutoWrap?: boolean = undefined;
	toolbar(): Array<CardToolbarItemOptions | ToolbarItemOptions> {
		if (this.loading) return [];
		if (!isEngine(this.editor) || this.editor.readonly) {
			return [
				{ type: 'copy' },
				{
					type: 'switch',
					content: this.editor.language.get<string>(
						CodeBlcok.cardName,
						'autoWrap',
					),
					getState: () => {
						if (this.#viewAutoWrap === undefined) {
							this.#viewAutoWrap = !!this.getValue()?.autoWrap;
						}
						return this.#viewAutoWrap;
					},
					onClick: () => {
						const autoWrap = !this.#viewAutoWrap;
						this.#viewAutoWrap = autoWrap;
						this.codeEditor?.setAutoWrap(autoWrap);
					},
				},
			];
		}
		return [
			{
				type: 'dnd',
			},
			{
				type: 'copy',
			},
			{
				type: 'delete',
			},
			{
				type: 'node',
				node: $('<div />'),
				didMount: (node) => {
					// 等待编辑插件渲染成功后才能去到mode
					setTimeout(() => {
						renderSelect(
							node.get<HTMLElement>()!,
							(this.constructor as typeof CodeBlcok).getModes(),
							this.codeEditor?.mode || 'plain',
							(mode) => {
								setTimeout(() => {
									this.focusEditor();
									this.codeEditor?.update(mode);
								}, 10);
							},
						);
					}, 100);
				},
			},
			{
				type: 'switch',
				content: this.editor.language.get<string>(
					CodeBlcok.cardName,
					'autoWrap',
				),
				getState: () => {
					return !!this.getValue()?.autoWrap;
				},
				onClick: () => {
					const value = this.getValue();
					const autoWrap = !value?.autoWrap;
					this.setValue({
						autoWrap,
					} as V);
					this.codeEditor?.setAutoWrap(autoWrap);
				},
			},
		];
	}

	focusEditor() {
		this.codeEditor?.focus();
		this.editor.card.activate(this.root);
	}

	onSelectLeft(event: KeyboardEvent) {
		if (!this.codeEditor) return;
		event.preventDefault();
		this.codeEditor.focus();
		this.activate(true);
		this.toolbarModel?.show();
	}

	onSelectRight(event: KeyboardEvent) {
		if (!this.codeEditor) return;
		event.preventDefault();
		this.codeEditor.focus();
		this.activate(true);
		this.toolbarModel?.show();
	}

	onSelectDown(event: KeyboardEvent) {
		if (!this.codeEditor) return;
		event.preventDefault();
		this.codeEditor.focus();
		this.activate(true);
		this.toolbarModel?.show();
	}

	onSelectUp(event: KeyboardEvent) {
		if (!this.codeEditor) return;
		event.preventDefault();
		this.codeEditor.focus();
		this.activate(true);
		this.toolbarModel?.show();
	}

	render() {
		if (!this.codeEditor) return;
		if (!this.codeEditor.container.inEditor()) {
			this.codeEditor.container = $(this.codeEditor.renderTemplate());
			this.mirror = undefined;
			this.getCenter().empty().append(this.codeEditor.container);
		}
		const value = this.getValue();

		const mode = value?.mode || 'plain';
		const code = value?.code || '';
		if (isEngine(this.editor)) {
			if (this.mirror) {
				this.codeEditor.update(mode, code);
				this.codeEditor.setAutoWrap(!!value?.autoWrap);
				return;
			}
			setTimeout(() => {
				this.mirror = this.codeEditor?.create(mode, code, {
					lineWrapping: !!value?.autoWrap,
				});
			}, 50);
		} else {
			this.codeEditor?.create(mode, code, {
				lineWrapping: !!value?.autoWrap,
			});
		}
	}
}

export default CodeBlcok;
export { CodeBlockEditor };
