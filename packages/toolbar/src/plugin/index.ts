import React from 'react';
import {
	DATA_TRANSIENT_ELEMENT,
	EditorInterface,
	isEngine,
	isSafari,
	NodeInterface,
	Plugin,
	PluginOptions,
} from '@aomao/engine';
import { CollapseItemProps } from '../collapse/item';
import ToolbarComponent from './component';
import locales from '../locales';

type Config = Array<{
	title: React.ReactNode;
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
				//'mind'
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
			this.editor.on('parse:value', (node) => this.paserValue(node));
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
		const { change } = this.editor;
		let range = change.range.get();
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
			range = change.range.get();
			if (range.collapsed) {
				event.preventDefault();
				const data = this.options.config || defaultConfig(this.editor);
				const card = this.editor.card.insert(
					ToolbarComponent.cardName,
					{},
					data,
				) as ToolbarComponent;
				card.setData(data);
				card.root.attributes(DATA_TRANSIENT_ELEMENT, 'true');
				this.editor.card.activate(card.root);
				range = change.range.get();
				//选中关键词输入节点
				const keyword = card.find('.data-toolbar-component-keyword');
				range.select(keyword, true);
				range.collapse(false);
				change.range.select(range);
			}
		}
	}

	execute(...args: any): void {
		throw new Error('Method not implemented.');
	}
}
export { ToolbarComponent };
export default ToolbarPlugin;
