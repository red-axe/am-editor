import {
	isEngine,
	NodeInterface,
	Plugin,
	SchemaGlobal,
	PluginOptions,
} from '@aomao/engine';

export interface Options extends PluginOptions {
	hotkey?: string;
	filter?: (lineHeight: string) => string | boolean;
}

export default class extends Plugin<Options> {
	static get pluginName() {
		return 'line-height';
	}

	#styleName = 'line-height';

	init() {
		this.editor.schema.add(this.schema());
		if (isEngine(this.editor)) {
			this.editor.on('paste:each', (node) => this.pasteEach(node));
		}
	}

	execute(lineHeight?: string) {
		if (!isEngine(this.editor)) return;
		const { change, block } = this.editor;
		const range = change.getRange();
		const blocks = block.findBlocks(range);
		// 没找到目标 block
		if (!blocks) {
			return;
		}
		// 其它情况
		blocks.forEach((block) => {
			this.addLineHeight(block, lineHeight);
		});
	}

	queryState() {
		if (!isEngine(this.editor)) return;
		const { change, node } = this.editor;
		const range = change.getRange();
		if (!range.startNode.inEditor()) return '';
		const { blocks } = change;

		const values: Array<string> = [];
		blocks.forEach((block) => {
			if (node.isSimpleBlock(block)) {
				const lineHeight =
					block.get<HTMLElement>()?.style.lineHeight || '';
				values.push(lineHeight);
			}
		});

		return values;
	}
	/**
	 * 给 Block 节点增加行高
	 * @param block block 节点
	 * @param lineHeight 行高
	 * @returns
	 */
	addLineHeight(block: NodeInterface, lineHeight?: string) {
		const { node } = this.editor;
		if (!node.isSimpleBlock(block)) return;
		block.css(this.#styleName, lineHeight || '');
	}

	schema(): SchemaGlobal {
		return {
			type: 'block',
			attributes: {
				style: {
					[this.#styleName]: '@length',
				},
			},
		};
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
		//pt 转为px
		if (!node.isCard() && this.editor.node.isBlock(node)) {
			const lineHeightSource = node.css(this.#styleName);
			if (!lineHeightSource) return;
			const lineHeight = this.convertToPX(lineHeightSource);
			if (lineHeightSource.endsWith('pt')) {
				node.css(this.#styleName, lineHeight);
			}
			const { filter } = this.options;
			if (filter) {
				const result = filter(lineHeight);
				if (result === false) {
					node.css(this.#styleName, '');
				} else if (typeof result === 'string') {
					node.css(this.#styleName, result);
				}
			} else node.css(this.#styleName, '');
			const nodeApi = this.editor.node;
			if (!nodeApi.isBlock(node)) nodeApi.unwrap(node);
		}
	}
}
