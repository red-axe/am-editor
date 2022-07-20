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
import locales from './locale';
import ReminderComponent from './component';
import type { RemindValue } from './component';

export interface Options extends PluginOptions {
	hotkey?: string | Array<string>;
}

export default class extends Plugin<Options> {
	static get pluginName() {
		return 'remind';
	}
	init() {
		const editor = this.editor;

		editor.language.add(locales);
		editor.on('parse:html', this.parseHtml);
		editor.on('paste:schema', this.pasteSchema);
		editor.on('paste:each', this.pasteHtml);
	}

	execute() {
		const editor = this.editor;

		if (!isEngine(editor) || editor.readonly) return;
		const { card } = editor;
		card.insert<RemindValue>(ReminderComponent.cardName, {
			borderColor: '#fed4a4',
			backgroundColor: '#fff5eb',
			colorMatch: {
				border: [
					'#eff0f1',
					'#fbbfbc',
					'#fed4a4',
					'#fff67a',
					'#b7edb1',
					'#bacefd',
					'#cdb2fa',
				],
				background: [
					'#f2f3f5',
					'#fef1f1',
					'#fff5eb',
					'#fefff0',
					'#f0fbef',
					'#f0f4ff',
					'#f6f1fe',
				],
			},
			text: 'light-block',
		});
	}

	hotkey() {
		return this.options.hotkey || 'mod+shift+0';
	}

	pasteSchema = (schema: SchemaInterface) => {
		schema.add({
			type: 'block',
			name: 'div',
			attributes: {
				'data-type': {
					required: true,
					value: ReminderComponent.cardName,
				},
				'data-value': '*',
			},
		});
	};

	pasteHtml = (node: NodeInterface) => {
		const editor = this.editor;
		const cardName = ReminderComponent.cardName;

		if (!isEngine(editor) || editor.readonly) return;
		if (node.isElement()) {
			const type = node.attributes('data-type');
			if (type === cardName) {
				const value = node.attributes('data-value');
				const cardValue = decodeCardValue(value);
				editor.card.replaceNode(node, cardName, cardValue);
				node.remove();
				return false;
			}
		}
		return true;
	};

	parseHtml = (root: NodeInterface) => {
		const cardName = ReminderComponent.cardName;

		root.find(
			`[${CARD_KEY}="${cardName}"],[${READY_CARD_KEY}="${cardName}"]`,
		).each((cardNode) => {
			const node = $(cardNode);
			const card = this.editor.card.find<RemindValue, ReminderComponent>(
				node,
			);
			const value = card?.getValue();
			if (value) {
				node.empty();
				const div = this.renderHtml(value, cardName);
				node.replaceWith(div);
			} else node.remove();
		});
	};

	renderHtml = (value: RemindValue, cardName: string) => {
		const htmlstring = value.text;
		return $(
			`<div data-type="${cardName}" data-value="${encodeCardValue(
				value,
			)}">${htmlstring}</div>`,
		);
	};

	destroy() {
		const editor = this.editor;

		editor.off('parse:html', this.parseHtml);
		editor.off('paste:schema', this.pasteSchema);
		editor.off('paste:each', this.pasteHtml);
	}
}
export { ReminderComponent };
export type { RemindValue };
