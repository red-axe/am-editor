import {
	EditorInterface,
	isEngine,
	isSafari,
	NodeInterface,
	Plugin,
	PluginOptions,
} from '@aomao/engine';
import { CollapseItemProps } from '../types';
import locales from '../locales';
import ToolbarComponent from './component';

type Config = Array<{
	title: string;
	items: Array<Omit<CollapseItemProps, 'engine'> | string>;
}>;
export interface Options extends PluginOptions {
	config: Config;
}

const defaultConfig = (editor: EditorInterface): Config => {
	return [
		{
			title: editor.language.get<string>(
				'toolbar',
				'commonlyUsed',
				'title',
			),
			items: [
				'image-uploader',
				'codeblock',
				'table',
				'file-uploader',
				'video-uploader',
				'math',
				'status',
			],
		},
	];
};

class ToolbarPlugin extends Plugin<Options> {
	static get pluginName() {
		return 'toolbar';
	}

	init() {
		if (isEngine(this.editor)) {
			this.editor.on('keydown:slash', (event) => this.onSlash(event));
			this.editor.on('paser:value', (node) => this.paserValue(node));
		}
		this.editor.language.add(locales);
	}

	paserValue(node: NodeInterface) {
		if (
			node.isCard() &&
			node.attributes('name') === ToolbarComponent.cardName
		) {
			return false;
		}
		return true;
	}

	onSlash(event: KeyboardEvent) {
		if (!isEngine(this.editor)) return;
		const { change, history } = this.editor;
		let range = change.getRange();
		const block = this.editor.block.closest(range.startNode);
		const text = block.text().trim();
		if (text === '/' && isSafari) {
			block.empty();
		}

		if (
			'' === text ||
			('/' === text && isSafari) ||
			event.ctrlKey ||
			event.metaKey
		) {
			range = change.getRange();
			if (range.collapsed) {
				event.preventDefault();
				history.startCache();
				const data = this.options.config || defaultConfig(this.editor);
				const card = this.editor.card.insert(
					ToolbarComponent.cardName,
					{
						data,
					},
				);
				this.editor.card.activate(card.root);
				range = change.getRange();
				history.destroyCache();
				//选中关键词输入节点
				const keyword = card.find('.data-toolbar-component-keyword');
				range.select(keyword, true);
				range.collapse(false);
				change.select(range);
			}
		}
	}

	execute(...args: any): void {
		throw new Error('Method not implemented.');
	}
}
export { ToolbarComponent };
export default ToolbarPlugin;
