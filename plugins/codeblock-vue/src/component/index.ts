import {
	$,
	Card,
	CardToolbarItemOptions,
	CardType,
	isEngine,
	isServer,
	isMobile,
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
	static get cardName() {
		return 'codeblock';
	}

	static get cardType() {
		return CardType.BLOCK;
	}

	resize = () => {
		return this.codeEditor!.container.find('.data-codeblock-content');
	};

	codeEditor?: CodeBlockEditorInterface;

	init() {
		if (isServer) return;
		super.init();
		this.codeEditor = new CodeBlockEditor(this.editor, {
			onSave: (mode, value) => {
				this.setValue({
					mode,
					code: value,
				});
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
					//加个延时，不然无法渲染成功
					setTimeout(() => {
						renderSelect(
							node.get<HTMLElement>()!,
							this.codeEditor?.mode || 'plain',
							(mode) => this.codeEditor?.update(mode),
						);
					}, 20);
				},
			},
		];
	}

	focusEditor() {
		this.codeEditor?.focus();
	}

	render() {
		if (!this.codeEditor) return;
		this.getCenter().append(this.codeEditor.container);
		const value = this.getValue();

		const mode = value?.mode || 'plain';
		const code = value?.code || '';
		if (isEngine(this.editor)) {
			setTimeout(() => {
				this.codeEditor?.create(mode, code);
			}, 50);
		} else {
			this.codeEditor.render(mode, code);
		}
	}
}

export default CodeBlcok;
export { CodeBlockEditor, NAME_MAP, SYNTAX_MAP };
