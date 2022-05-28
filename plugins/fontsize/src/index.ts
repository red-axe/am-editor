import {
	NodeInterface,
	MarkPlugin,
	isEngine,
	PluginOptions,
} from '@aomao/engine';

export interface FontsizeOptions extends PluginOptions {
	hotkey?: { key: string; args: Array<string> };
	defaultSize?: string;
	filter?: (fontSize: string) => string | boolean;
}

const PASTE_EACH = 'paste:each';

export default class<
	T extends FontsizeOptions = FontsizeOptions,
> extends MarkPlugin<T> {
	static get pluginName() {
		return 'fontsize';
	}

	readonly mergeLeval = 4;

	tagName = 'span';

	style = {
		'font-size': '@var0',
	};

	variable = {
		'@var0': {
			required: true,
			value: /[\d\.]+(pt|px)$/,
		},
	};

	#styleName = 'font-size';

	defaultSize =
		this.options.defaultSize ||
		this.editor.container.css('font-size') ||
		'14px';

	init() {
		super.init();
		const editor = this.editor;
		if (isEngine(editor)) {
			editor.on(PASTE_EACH, this.pasteEach);
		}
		if (this.options.defaultSize)
			editor.container.css('font-size', this.defaultSize);
	}

	isTrigger(size: string, defaultSize: string = this.defaultSize) {
		return size !== defaultSize;
	}

	hotkey() {
		return this.options.hotkey || [];
	}

	convertToPX(value: string) {
		const match = /([\d\.]+)(pt|px)$/i.exec(value);
		if (match && match[2] === 'pt') {
			return (
				String(Math.round((parseInt(match[1], 10) * 96) / 72)) + 'px'
			);
		}
		return value;
	}

	pasteEach = (node: NodeInterface) => {
		if (node.name === this.tagName) {
			const source = node.css(this.#styleName);
			if (!source) return;
			const fontsize = this.convertToPX(source);
			if (source.endsWith('pt')) node.css(this.#styleName, fontsize);
			if (fontsize !== this.defaultSize) {
				const { filter } = this.options;
				if (filter) {
					const result = filter(fontsize);
					if (result === false) {
						node.css(this.#styleName, '');
					} else if (typeof result === 'string') {
						node.css(this.#styleName, result);
					}
				} else node.css(this.#styleName, '');
				const nodeApi = this.editor.node;
				if (!nodeApi.isMark(node)) nodeApi.unwrap(node);
			}
		}
	};

	destroy(): void {
		const editor = this.editor;
		if (isEngine(editor)) {
			editor.off(PASTE_EACH, this.pasteEach);
		}
	}
}
