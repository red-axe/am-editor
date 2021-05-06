import { NodeInterface, MarkPlugin } from '@aomao/engine';

export type Options = {
	hotkey?: { key: string; args: Array<string> };
	defaultSize?: string;
	data?: Array<string> | { [key: string]: string };
};

export default class extends MarkPlugin<Options> {
	static get pluginName() {
		return 'fontsize';
	}

	tagName = 'span';

	style = {
		'font-size': {
			value: '@var0',
			format: (value: string) => {
				value = this.convertToPX(value);
				const { data } = this.options;
				if (typeof data === 'object') {
					const key = Object.keys(data).find(
						key => data[key] === value,
					);
					if (!!key) value = key;
				}
				return value;
			},
		},
	};

	variable = {
		'@var0': {
			required: true,
			value: /[\d\.]+(pt|px)$/,
		},
	};

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
		if (node.name === 'span') {
			const fontsize = this.convertToPX(node.css('fontSize'));
			if (!!fontsize && fontsize !== this.options.defaultSize) {
				const { data } = this.options;
				if (Array.isArray(data) && data.indexOf(fontsize) === -1) {
					node.css('font-size', '');
				} else if (typeof data === 'object') {
					if (
						!Object.keys(data).some(key => {
							if (data[key] === fontsize) return true;
							return;
						})
					) {
						node.css('font-size', '');
					}
				}
			}
		}
	}
}
