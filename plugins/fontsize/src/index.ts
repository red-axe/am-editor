import { NodeInterface, MarkPlugin, isEngine } from '@aomao/engine';

export type Options = {
	hotkey?: { key: string; args: Array<string> };
	defaultSize?: string;
	filter?: (fontSize: string) => string | boolean;
};

export default class extends MarkPlugin<Options> {
	static get pluginName() {
		return 'fontsize';
	}

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

	init() {
		super.init();
		if (isEngine(this.editor)) {
			this.editor.on('paste:each', (node) => this.pasteEach(node));
		}
	}

	isTrigger(
		size: string,
		defaultSize: string = this.options.defaultSize || '14px',
	) {
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

	pasteEach(node: NodeInterface) {
		if (node.name === this.tagName) {
			const source = node.css(this.#styleName);
			if (!source) return;
			const fontsize = this.convertToPX(source);
			if (source.endsWith('pt')) node.css(this.#styleName, fontsize);
			if (fontsize !== this.options.defaultSize) {
				const { filter } = this.options;
				if (filter) {
					const result = filter(fontsize);
					if (result === false) {
						node.css(this.#styleName, '');
					} else if (typeof result === 'string') {
						node.css(this.#styleName, result);
					}
				} else node.css(this.#styleName, '');
			}
		}
	}
}
