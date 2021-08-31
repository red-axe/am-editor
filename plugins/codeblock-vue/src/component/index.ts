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
import modeDatas from './mode';
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
					setTimeout(() => {
						this.editor.card.activate(
							this.root,
							ActiveTrigger.MOUSE_DOWN,
						);
					}, 10);
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
					// 等待编辑插件渲染成功后才能去到mode
					setTimeout(() => {
						console.log(32435);
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
				// 创建后更新一下toolbar，不然无法选择语言
				if (this.activated) this.toolbarModel?.show();
			}, 50);
		} else {
			this.codeEditor.render(mode, code);
		}
	}
}

export default CodeBlcok;
export { CodeBlockEditor };
