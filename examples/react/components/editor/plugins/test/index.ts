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
		// 监听解析成html的事件
		this.editor.on('parse:html', this.parseHtml);
		// 监听粘贴时候设置schema规则的入口
		this.editor.on('paste:schema', this.pasteSchema);
		// 监听粘贴时候的节点循环
		this.editor.on('paste:each', this.pasteHtml);
	}
	// 执行方法
	execute() {
		if (!isEngine(this.editor) || this.editor.readonly) return;
		const { card } = this.editor;
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
		if (!isEngine(this.editor) || this.editor.readonly) return;
		if (node.isElement()) {
			const type = node.attributes('data-type');
			if (type === TestComponent.cardName) {
				const value = node.attributes('data-value');
				const cardValue = decodeCardValue(value);
				this.editor.card.replaceNode(
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
		// 监听解析成html的事件
		this.editor.off('parse:html', this.parseHtml);
		// 监听粘贴时候设置schema规则的入口
		this.editor.off('paste:schema', this.pasteSchema);
		// 监听粘贴时候的节点循环
		this.editor.off('paste:each', this.pasteHtml);
	}
}
export { TestComponent };
export type { TestValue };
