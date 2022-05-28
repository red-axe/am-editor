import {
	$,
	Plugin,
	NodeInterface,
	CARD_KEY,
	isEngine,
	SchemaInterface,
	PluginOptions,
	decodeCardValue,
	encodeCardValue,
	READY_CARD_KEY,
} from '@aomao/engine';
import TestComponent from './component';
import type { TestValue } from './component';

export interface Options extends PluginOptions {
	hotkey?: string | Array<string>;
}
export default class extends Plugin<Options> {
	static get pluginName() {
		return 'test';
	}
	// 插件初始化
	init() {
		const editor = this.editor;
		// 监听解析成html的事件
		editor.on('parse:html', this.parseHtml);
		// 监听粘贴时候设置schema规则的入口
		editor.on('paste:schema', this.pasteSchema);
		// 监听粘贴时候的节点循环
		editor.on('paste:each', this.pasteHtml);
	}
	// 执行方法
	execute() {
		const editor = this.editor;
		if (!isEngine(editor) || editor.readonly) return;
		const { card } = editor;
		card.insert<TestValue>(TestComponent.cardName, {
			text: 'This is card value',
		});
	}
	// 快捷键
	hotkey() {
		return this.options.hotkey || 'mod+shift+f';
	}
	// 粘贴的时候添加需要的 schema
	pasteSchema = (schema: SchemaInterface) => {
		schema.add({
			type: 'block',
			name: 'div',
			attributes: {
				'data-type': {
					required: true,
					value: TestComponent.cardName,
				},
				'data-value': '*',
			},
		});
	};
	// 解析粘贴过来的html
	pasteHtml = (node: NodeInterface) => {
		const editor = this.editor;
		if (!isEngine(editor) || editor.readonly) return;
		if (node.isElement()) {
			const type = node.attributes('data-type');
			if (type === TestComponent.cardName) {
				const value = node.attributes('data-value');
				const cardValue = decodeCardValue(value);
				editor.card.replaceNode(
					node,
					TestComponent.cardName,
					cardValue,
				);
				node.remove();
				return false;
			}
		}
		return true;
	};
	// 解析成html
	parseHtml = (root: NodeInterface) => {
		root.find(
			`[${CARD_KEY}="${TestComponent.cardName}"],[${READY_CARD_KEY}="${TestComponent.cardName}"]`,
		).each((cardNode) => {
			const node = $(cardNode);
			const card = this.editor.card.find<TestValue, TestComponent>(node);
			const value = card?.getValue();
			if (value) {
				node.empty();
				const div = $(
					`<div data-type="${
						TestComponent.cardName
					}" data-value="${encodeCardValue(value)}">${
						value.text
					}</div>`,
				);
				node.replaceWith(div);
			} else node.remove();
		});
	};

	destroy() {
		const editor = this.editor;
		// 监听解析成html的事件
		editor.off('parse:html', this.parseHtml);
		// 监听粘贴时候设置schema规则的入口
		editor.off('paste:schema', this.pasteSchema);
		// 监听粘贴时候的节点循环
		editor.off('paste:each', this.pasteHtml);
	}
}
export { TestComponent };
export type { TestValue };
