import {
	$,
	Plugin,
	NodeInterface,
	CARD_KEY,
	isEngine,
	PluginEntry,
	SchemaInterface,
	PluginOptions,
	CARD_VALUE_KEY,
	decodeCardValue,
} from '@aomao/engine';
import HrComponent, { HrValue } from './component';

export interface HrOptions extends PluginOptions {
	hotkey?: string | Array<string>;
	markdown?: boolean;
}
export default class<T extends HrOptions = HrOptions> extends Plugin<T> {
	static get pluginName() {
		return 'hr';
	}

	init() {
		this.editor.on('parse:html', (node) => this.parseHtml(node));
		this.editor.on('paste:schema', (schema) => this.pasteSchema(schema));
		this.editor.on('paste:each', (child) => this.pasteHtml(child));
		if (isEngine(this.editor)) {
			this.editor.on('keydown:enter', (event) => this.markdown(event));
			this.editor.on(
				'paste:markdown-check',
				(child) => !this.checkMarkdown(child)?.match,
			);
			this.editor.on('paste:markdown', (child) =>
				this.pasteMarkdown(child),
			);
		}
	}

	execute() {
		if (!isEngine(this.editor)) return;
		const { card } = this.editor;
		card.insert(HrComponent.cardName);
	}

	hotkey() {
		return this.options.hotkey || 'mod+shift+e';
	}

	markdown(event: KeyboardEvent) {
		if (!isEngine(this.editor) || this.options.markdown === false) return;
		const { change, command, node } = this.editor;
		const range = change.range.get();

		if (!range.collapsed || change.isComposing() || !this.markdown) return;
		const blockApi = this.editor.block;
		const block = blockApi.closest(range.startNode);

		if (!node.isRootBlock(block)) {
			return;
		}

		const chars = blockApi.getLeftText(block);
		const match = /^[-]{3,}$/.exec(chars);

		if (match) {
			event.preventDefault();
			blockApi.removeLeftText(block);
			command.execute((this.constructor as PluginEntry).pluginName);
			return false;
		}
		return;
	}

	checkMarkdown(node: NodeInterface) {
		if (!isEngine(this.editor) || !this.markdown || !node.isText()) return;

		const text = node.text();
		const reg = /(^|\r\n|\n)((-\s*){3,})\s?(\r\n|\n|$)/;
		const match = reg.exec(text);
		return {
			reg,
			match,
		};
	}

	pasteMarkdown(node: NodeInterface) {
		const result = this.checkMarkdown(node);
		if (!result) return;
		let { reg, match } = result;
		if (!match) return;

		let newText = '';
		let textNode = node.clone(true).get<Text>()!;
		const { card } = this.editor;
		while (
			textNode.textContent &&
			(match = reg.exec(textNode.textContent))
		) {
			//从匹配到的位置切断
			let regNode = textNode.splitText(match.index);
			newText += textNode.textContent;
			//从匹配结束位置分割
			textNode = regNode.splitText(match[0].length);

			const cardNode = card.replaceNode($(regNode), 'hr');
			regNode.remove();
			//  match[1] 把之前的换行符补上
			newText += match[1] + cardNode.get<Element>()?.outerHTML + '\n';
		}
		newText += textNode.textContent;
		node.text(newText);
	}

	pasteSchema(schema: SchemaInterface) {
		schema.add([
			{
				type: 'block',
				name: 'hr',
				isVoid: true,
			},
		]);
	}

	pasteHtml(node: NodeInterface) {
		if (!isEngine(this.editor)) return;
		if (node.name === 'hr') {
			this.editor.card.replaceNode(node, HrComponent.cardName);
			return false;
		}
		return true;
	}

	parseHtml(
		root: NodeInterface,
		callback?: (node: NodeInterface, value: HrValue) => NodeInterface,
	) {
		root.find(`[${CARD_KEY}=${HrComponent.cardName}`).each((hrNode) => {
			const node = $(hrNode);
			let hr = node.find('hr');
			hr.css({
				'background-color': '#e8e8e8',
				border: '1px solid transparent',
				margin: '18px 0',
			});
			if (callback) {
				const card = this.editor.card.find(
					node,
				) as HrComponent<HrValue>;
				const value =
					card?.getValue() ||
					decodeCardValue(node.attributes(CARD_VALUE_KEY));
				hr = callback(hr, value);
			}
			node.replaceWith(hr);
		});
	}
}
export { HrComponent };
export type { HrValue };
