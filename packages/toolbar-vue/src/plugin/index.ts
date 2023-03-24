import {
	CARD_KEY,
	EditorInterface,
	isEngine,
	isSafari,
	Node,
	NodeInterface,
	Plugin,
	PluginOptions,
} from '@aomao/engine';
import { CollapseItemProps, GroupItemProps } from '../types';
import locales from '../locales';
import ToolbarComponent, { ToolbarPopup } from './component';
import type { ToolbarValue } from './component';

type Config = Array<{
	title: string;
	items: Array<Omit<CollapseItemProps, 'engine'> | string>;
}>;
export interface ToolbarOptions extends PluginOptions {
	config?: Config | false;
	popup?: {
		items: GroupItemProps[];
	};
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

class ToolbarPlugin<
	T extends ToolbarOptions = ToolbarOptions
> extends Plugin<T> {
	static get pluginName() {
		return 'toolbar';
	}
	private popup?: ToolbarPopup;

	init() {
		const editor = this.editor;
		if (isEngine(editor)) {
			editor.on('keydown:slash', this.onSlash);
			editor.on('parse:value', this.paserValue);
			editor.on('parse:node', this.paserNode);
		}
		editor.language.add(locales);
		if (this.options.popup) {
			this.popup = new ToolbarPopup(editor, {
				items: this.options.popup.items,
			});
		}
	}

	paserValue = (node: NodeInterface) => {
		if (
			node.isCard() &&
			node.attributes('name') === ToolbarComponent.cardName
		) {
			return false;
		}
		return true;
	};

	paserNode = (node: Node) => {
		if (node[CARD_KEY] === ToolbarComponent.cardName) {
			return false;
		}
		return;
	};

	onSlash = (event: KeyboardEvent) => {
		const editor = this.editor;
		if (!isEngine(editor)) return;
		const { change } = editor;
		let range = change.range.get();
		const block = editor.block.closest(range.startNode);
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
			if (this.options.config === false) return;
			range = change.range.get();
			if (range.collapsed) {
				event.preventDefault();
				const data = this.options.config || defaultConfig(editor);
				const card = editor.card.insert(
					ToolbarComponent.cardName,
					{},
					data,
				) as ToolbarComponent<ToolbarValue>;
				card.setData(data);
				editor.card.activate(card.root);
				range = change.range.get();
				//选中关键词输入节点
				const keyword = card.find('.data-toolbar-component-keyword');
				range.select(keyword, true);
				range.collapse(false);
				change.range.select(range);
			}
		}
	};

	execute(...args: any): void {
		throw new Error('Method not implemented.');
	}

	destroy() {
		this.popup?.destroy();
		const editor = this.editor;
		editor.off('keydown:slash', this.onSlash);
		editor.off('parse:value', this.paserValue);
		editor.off('parse:node', this.paserNode);
	}
}
export { ToolbarComponent };
export type { ToolbarValue };
export default ToolbarPlugin;
