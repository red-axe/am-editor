import {
	$,
	isEngine,
	MarkPlugin,
	NodeInterface,
	PluginOptions,
} from '@aomao/engine';

export interface FontfamilyOptions extends PluginOptions {
	hotkey?: { key: string; args: Array<string> };
	filter?: (fontfamily: string) => string | boolean;
}

const PASTE_EACH = 'paste:each';
export default class<
	T extends FontfamilyOptions = FontfamilyOptions,
> extends MarkPlugin<T> {
	static get pluginName() {
		return 'fontfamily';
	}

	tagName = 'span';

	#styleName = 'font-family';

	style = {
		[this.#styleName]: '@var0',
	};

	variable = {
		'@var0': {
			required: true,
			value: '*',
		},
	};

	init() {
		super.init();
		const editor = this.editor;
		if (isEngine(editor)) {
			editor.on(PASTE_EACH, this.pasteEach);
		}
	}

	isTrigger(font: string) {
		const state = this.queryState() as string[] | undefined;
		if (!state) return true;
		if (!font) {
		}
		return !!font;
	}

	execute(font: string) {
		const editor = this.editor;
		if (!isEngine(editor)) return;
		const { change, mark } = editor;
		const markNode = $(`<${this.tagName} />`);
		//获取当前光标位置字体
		const state = this.queryState() as string[] | undefined;
		//如果传入的字体，并且当前光标处没有字体或者，光标处字体与传入字体不一致
		if (font && (!state || font !== state[0])) {
			this.setStyle(markNode, font);
			if (!this.followStyle && change.range.get().collapsed) {
				return;
			}
			mark.wrap(markNode);
			return;
		}
		//未传入有效的字体。如果当前光标处有字体就移除字体
		if (state) {
			this.setStyle(markNode, state[0]);
			mark.unwrap(markNode);
		}
	}

	hotkey() {
		return this.options.hotkey || [];
	}

	pasteEach = (node: NodeInterface) => {
		//pt 转为px
		if (node.name === this.tagName) {
			const styles = node.css();
			const fontFamily = styles[this.#styleName];
			if (!fontFamily) return;
			const { filter } = this.options;
			if (filter) {
				const result = filter(fontFamily);
				if (result === false) {
					node.css(this.#styleName, '');
				} else if (typeof result === 'string') {
					node.css(this.#styleName, result);
				}
			} else node.css(this.#styleName, '');
			const nodeApi = this.editor.node;
			if (!nodeApi.isMark(node)) nodeApi.unwrap(node);
		}
	};

	destroy(): void {
		const editor = this.editor;
		if (isEngine(editor)) {
			editor.off(PASTE_EACH, this.pasteEach);
		}
	}
}
