import {
	$,
	CARD_KEY,
	CARD_VALUE_KEY,
	decodeCardValue,
	escape,
	encodeCardValue,
	isEngine,
	NodeInterface,
	Plugin,
	PluginOptions,
	READY_CARD_KEY,
	SchemaInterface,
} from '@aomao/engine';
import EmbedComponent, {
	EmbedRenderBeforeEvent,
	EmbedValue,
} from './component';
import locales from './locales';

export interface EmbedOptions extends PluginOptions {
	renderBefore?: EmbedRenderBeforeEvent;
}

class Embed<T extends EmbedOptions = EmbedOptions> extends Plugin<T> {
	static get pluginName() {
		return 'embed';
	}

	init() {
		this.editor.language.add(locales);
		this.editor.on('parse:html', (node) => this.parseHtml(node));
		this.editor.on('paste:schema', (schema) => this.pasteSchema(schema));
		this.editor.on('paste:each', (child) => this.pasteHtml(child));
	}

	hotkey() {
		return this.options.hotkey || '';
	}

	execute(...args: any): void {
		const { renderBefore } = this.options;
		const { card } = this.editor;
		const cardComponent = card.insert<EmbedValue>(
			EmbedComponent.cardName,
			{
				url: args[0] || '',
				ico: args[1],
				title: args[2],
				collapsed: args[3],
				isResize: args[4],
			},
			renderBefore,
		);
		card.activate(cardComponent.root);
	}

	pasteSchema(schema: SchemaInterface) {
		schema.add({
			type: 'block',
			name: 'div',
			attributes: {
				'data-type': {
					required: true,
					value: EmbedComponent.cardName,
				},
				'data-value': '*',
			},
		});
	}

	pasteHtml(node: NodeInterface) {
		if (!isEngine(this.editor)) return;
		if (node.isElement()) {
			const attributes = node.attributes();
			const type = attributes['data-type'];
			if (type === EmbedComponent.cardName) {
				const value = attributes['data-value'];
				const cardValue = decodeCardValue(value);
				if (!cardValue.url) return;
				this.editor.card.replaceNode(
					node,
					EmbedComponent.cardName,
					cardValue,
				);
				node.remove();
				return false;
			}
		}
		return true;
	}

	parseHtml(
		root: NodeInterface,
		callback?: (node: NodeInterface, value: EmbedValue) => NodeInterface,
	) {
		root.find(
			`[${CARD_KEY}="${EmbedComponent.cardName}"],[${READY_CARD_KEY}="${EmbedComponent.cardName}"]`,
		).each((cardNode) => {
			const node = $(cardNode);
			const card = this.editor.card.find<EmbedValue>(node);
			const value =
				card?.getValue() ||
				decodeCardValue<EmbedValue>(node.attributes(CARD_VALUE_KEY));
			if (value && value.url) {
				const iframe = $(
					`<iframe frameborder="0" allowfullscreen="true" style="height: ${value?.height}px;width: 100%;margin:0;padding:0;"></iframe>`,
				);
				node.empty();
				const url = value?.url || '';
				const header =
					$(`<div style="background: #fafafa;border-bottom-left-radius: 0; border-bottom-right-radius: 0;position: relative;border-radius: 2px;border: 1px solid #e8e8e8;display: flex;justify-content: space-between;align-items: center;padding: 4px 8px;">
               		<span style="flex: 1 0;;margin: 0 8px;"><a target="_blank" href="${url}">${escape(
						value.title || '',
					)}</a></span>
                </div>`);
				let contianer = $(
					`<div data-type="${
						EmbedComponent.cardName
					}" data-value="${encodeCardValue(value)}"></span>`,
				);
				iframe.attributes('src', url);
				contianer.append(header);
				const body = $(
					`<div style="border: 1px solid #e8e8e8; border-top: 0; border-bottom-left-radius: 2px; border-bottom-right-radius: 2px;"></div>`,
				);
				body.append(iframe);
				if (!value.collapsed) contianer.append(body);
				if (callback) {
					contianer = callback(contianer, value);
				}
				node.replaceWith(contianer);
			} else node.remove();
		});
	}
}

export default Embed;
export { EmbedComponent };
export type { EmbedValue };
