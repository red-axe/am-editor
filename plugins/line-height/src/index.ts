import {
	isEngine,
	NodeInterface,
	Plugin,
	SchemaGlobal,
	PluginOptions,
} from '@aomao/engine';

export interface LineHeightOptions extends PluginOptions {
	hotkey?: string;
	filter?: (lineHeight: string) => string | boolean;
}

const PASTE_EACH = 'paste:each';
export default class<
	T extends LineHeightOptions = LineHeightOptions,
> extends Plugin<T> {
	static get pluginName() {
		return 'line-height';
	}

	#styleName = 'line-height';

	init() {
		const editor = this.editor;
		editor.schema.add(this.schema());
		if (isEngine(editor)) {
			editor.on(PASTE_EACH, this.pasteEach);
		}
	}

	execute(lineHeight?: string) {
		const editor = this.editor;
		if (!isEngine(editor)) return;
		if (lineHeight === 'default') lineHeight = '';
		const { change, block } = editor;
		const range = change.range.get();
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
		const editor = this.editor;
		if (!isEngine(editor)) return;
		const { change, node } = editor;
		const range = change.range.get();
		if (!range.startNode.inEditor()) return ['default'];
		const { blocks } = change;

		const values: Array<string> = [];
		blocks.forEach((block) => {
			if (node.isNestedBlock(block)) {
				const lineHeightSource =
					block.get<HTMLElement>()?.style.lineHeight || '';
				if (!lineHeightSource) return;
				const lineHeight = this.convertToPX(lineHeightSource);

				const { filter } = this.options;
				if (filter) {
					const result = filter(lineHeight);
					if (result === false) {
						return;
					} else if (typeof result === 'string') {
						values.push(result);
					} else values.push(lineHeight);
				}
			}
		});
		return values.length === 0 ? ['default'] : values;
	}
	/**
	 * 给 Block 节点增加行高
	 * @param block block 节点
	 * @param lineHeight 行高
	 * @returns
	 */
	addLineHeight(block: NodeInterface, lineHeight?: string) {
		const { node } = this.editor;
		if (!node.isNestedBlock(block)) return;
		block.css(this.#styleName, lineHeight || '');
		if (isEngine(this.editor)) this.editor.change.apply();
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

	pasteEach = (node: NodeInterface) => {
		const editor = this.editor;
		//pt 转为px
		if (!node.isCard() && editor.node.isBlock(node)) {
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
			const nodeApi = editor.node;
			if (!nodeApi.isBlock(node)) nodeApi.unwrap(node);
		}
	};

	destroy() {
		this.editor.off(PASTE_EACH, this.pasteEach);
	}
}
