import type { Editor } from 'codemirror';
import {
	$,
	ActiveTrigger,
	Card,
	CardToolbarItemOptions,
	CardType,
	isEngine,
	isServer,
	ToolbarItemOptions,
} from '@aomao/engine';
import CodeBlockEditor from './editor';
import renderSelect from './select';
import { NAME_MAP, SYNTAX_MAP } from './mode';
import { CodeBlockEditorInterface } from './types';
import './index.css';

export type CodeBlockValue = {
	mode?: string;
	code?: string;
};

class CodeBlcok extends Card<CodeBlockValue> {
	mirror?: Editor;
	static get cardName() {
		return 'codeblock';
	}

	static get cardType() {
		return CardType.BLOCK;
	}

	resize = () => {
		return this.codeEditor?.container.find('.data-codeblock-content');
	};

	codeEditor?: CodeBlockEditorInterface;

	init() {
		if (isServer) return;
		super.init();
		if (this.codeEditor) return;
		this.codeEditor = new CodeBlockEditor(this.editor, {
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
						ActiveTrigger.MOUSE_DOWN,
					);
			},
		});
	}

	toolbar(): Array<CardToolbarItemOptions | ToolbarItemOptions> {
		if (!isEngine(this.editor) || this.editor.readonly) {
			return [{ type: 'copy' }];
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
					renderSelect(
						node.get<HTMLElement>()!,
						this.codeEditor?.mode || 'plain',
						(mode) => {
							this.codeEditor?.update(mode);
							setTimeout(() => {
								this.codeEditor?.focus();
							}, 10);
						},
					);
				},
			},
		];
	}

	focusEditor() {
		this.codeEditor?.focus();
	}

	render() {
		if (!this.codeEditor) return;
		if (!this.mirror) this.getCenter().append(this.codeEditor.container);
		const value = this.getValue();

		const mode = value?.mode || 'plain';
		const code = value?.code || '';
		if (isEngine(this.editor)) {
			if (this.mirror) {
				this.codeEditor.update(mode, code);
				return;
			}
			setTimeout(() => {
				this.mirror = this.codeEditor?.create(mode, code);
				this.toolbarModel?.destroy();
				this.toolbarModel?.showCardToolbar();
			}, 50);
		} else {
			this.codeEditor.render(mode, code);
		}
	}
}

export default CodeBlcok;
export { CodeBlockEditor, NAME_MAP, SYNTAX_MAP };
