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
} from '@aomao/engine';
import CodeBlockEditor from './editor';
import renderSelect from './select';
import modeDatas from './mode';
import { CodeBlockEditorInterface } from './types';
import './index.css';

export type CodeBlockValue = {
	mode?: string;
	code?: string;
	autoWrap?: boolean;
};

class CodeBlcok extends Card<CodeBlockValue> {
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

	static get lazyRender() {
		return true;
	}

	static getModes() {
		return modeDatas;
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
				});
			},
			onMouseDown: (event) => {
				if (!this.activated)
					this.editor.card.activate(
						this.root,
						CardActiveTrigger.MOUSE_DOWN,
					);
			},
		});
	}
	#viewAutoWrap?: boolean = undefined;
	toolbar(): Array<CardToolbarItemOptions | ToolbarItemOptions> {
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
								this.codeEditor?.update(mode);
								setTimeout(() => {
									this.codeEditor?.focus();
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
					});
					this.codeEditor?.setAutoWrap(autoWrap);
				},
			},
		];
	}

	focusEditor() {
		this.codeEditor?.focus();
		this.editor.card.activate(this.root);
	}

	render() {
		if (!this.codeEditor) return;
		if (!this.codeEditor.container.inEditor()) {
			this.codeEditor.container = $(this.codeEditor.renderTemplate());
			this.mirror = undefined;
			this.getCenter().append(this.codeEditor.container);
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
