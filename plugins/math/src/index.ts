import {
	$,
	CARD_KEY,
	NodeInterface,
	Plugin,
	CardEntry,
	PluginOptions,
	CardInterface,
	PluginEntry,
	isEngine,
	SchemaInterface,
	decodeCardValue,
	encodeCardValue,
	AjaxInterface,
	READY_CARD_KEY,
	CARD_VALUE_KEY,
} from '@aomao/engine';
import MathComponent, { MathValue } from './component';
import locales from './locales';
import { MathOptions } from './types';

const PARSE_HTML = 'parse:html';
const PASTE_SCHEMA = 'paste:schema';
const PASTE_EACH = 'paste:each';

export default class Math<
	T extends MathOptions = MathOptions,
> extends Plugin<T> {
	static get pluginName() {
		return 'math';
	}
	/**
	 * 不同卡片的当前请求
	 */
	#request: Record<string, AjaxInterface> = {};

	init() {
		const editor = this.editor;
		editor.language.add(locales);
		editor.on(PARSE_HTML, this.parseHtml);
		editor.on(PASTE_EACH, this.pasteHtml);
		editor.on(PASTE_SCHEMA, this.pasteSchema);
	}

	execute(...args: any): void {
		const { card } = this.editor;
		const cardComponent = card.insert<MathValue, MathComponent<MathValue>>(
			MathComponent.cardName,
			{
				code: args[0] || '',
				url: args[1] || '',
			},
		);
		card.activate(cardComponent.root);
		window.setTimeout(() => {
			cardComponent.focusTextarea();
		}, 10);
	}

	action(action: string, ...args: any) {
		switch (action) {
			case 'query':
				const [key, code, success, failed] = args;
				return this.query(key, code, success, failed);
		}
	}

	query(
		key: string,
		code: string,
		success: (url: string) => void,
		failed: (message: string) => void,
	) {
		const { request, language } = this.editor;
		const { action, type, contentType, parse, headers } = this.options;
		const data = this.options.data;
		this.#request[key]?.abort();
		this.#request[key] = request.ajax({
			url: action,
			method: 'POST',
			contentType: contentType || 'application/json',
			type: type === undefined ? 'json' : type,
			headers,
			data:
				typeof data === 'function'
					? async () => {
							const newData = await data();
							return { ...newData, content: code };
					  }
					: {
							...data,
							content: code,
					  },
			success: (response) => {
				const url =
					response.url || (response.data && response.data.url);

				const result = parse
					? parse(response)
					: !!url
					? { result: true, data: url }
					: { result: false };
				if (result.result) {
					const isUrl =
						result.data.indexOf('http') === 0 ||
						result.data.indexOf('/') === 0;
					let url = result.data;
					if (!isUrl) {
						url = this.exConvertToPx(result.data);
						url =
							(url.indexOf('data:') < 0
								? 'data:image/svg+xml,'
								: '') +
							encodeURIComponent(url)
								.replace(/'/g, '%27')
								.replace(/"/g, '%22');
					}
					success(url);
				} else {
					failed(result.data);
				}
			},
			error: (error) => {
				failed(error.message || language.get('image', 'uploadError'));
			},
		});
	}

	exConvertToPx(svg: string) {
		const regWidth = /width="([\d\.]+ex)"/;
		const widthMaths = regWidth.exec(svg);
		const exWidth = widthMaths ? widthMaths[1] : null;

		const regHeight = /height="([\d\.]+ex)"/;
		const heightMaths = regHeight.exec(svg);
		const exHeight = heightMaths ? heightMaths[1] : null;

		if (exWidth) {
			const pxWidth =
				parseFloat(exWidth.substring(0, exWidth.length - 2)) * 9;
			svg = svg.replace(`width="${exWidth}"`, `width="${pxWidth}px"`);
		}

		if (exHeight) {
			const pxHeight =
				parseFloat(exHeight.substring(0, exHeight.length - 2)) * 9;
			svg = svg.replace(`height="${exHeight}"`, `height="${pxHeight}px"`);
		}
		return svg;
	}

	async waiting(
		callback?: (
			name: string,
			card?: CardInterface,
			...args: any
		) => boolean | number | void,
	): Promise<void> {
		const { card } = this.editor;
		// 检测单个组件
		const check = (component: CardInterface) => {
			return (
				component.root.inEditor() &&
				component.name === MathComponent.cardName &&
				(component as MathComponent<MathValue>).isSaving
			);
		};
		// 找到不合格的组件
		const find = (): CardInterface | undefined => {
			return card.components.find(check);
		};

		const waitCheck = (component: CardInterface): Promise<void> => {
			let time = 60000;
			return new Promise((resolve, reject) => {
				if (callback) {
					const result = callback(
						(this.constructor as PluginEntry).pluginName,
						component,
					);
					if (result === false) {
						return reject({
							name: (this.constructor as PluginEntry).pluginName,
							card: component,
						});
					} else if (typeof result === 'number') {
						time = result;
					}
				}
				const beginTime = new Date().getTime();
				const now = new Date().getTime();
				const timeout = () => {
					if (now - beginTime >= time) return resolve();
					setTimeout(() => {
						if (check(component)) timeout();
						else resolve();
					}, 10);
				};
				timeout();
			});
		};
		return new Promise(async (resolve, reject) => {
			const component = find();
			const wait = (component: CardInterface) => {
				waitCheck(component)
					.then(() => {
						const next = find();
						if (next) wait(next);
						else resolve();
					})
					.catch(reject);
			};
			if (component) wait(component);
			else resolve();
		});
	}

	pasteSchema = (schema: SchemaInterface) => {
		schema.add({
			type: 'inline',
			name: 'span',
			attributes: {
				'data-type': {
					required: true,
					value: MathComponent.cardName,
				},
				'data-value': '*',
			},
		});
	};

	pasteHtml = (node: NodeInterface) => {
		const editor = this.editor;
		if (!isEngine(editor)) return;
		if (node.isElement()) {
			const attributes = node.attributes();
			const type = attributes['data-type'];
			if (type && type === MathComponent.cardName) {
				const value = attributes['data-value'];
				const cardValue = decodeCardValue(value);
				if (!cardValue.url) return;
				editor.card.replaceNode(
					node,
					MathComponent.cardName,
					cardValue,
				);
				node.remove();
				return false;
			}
		}
		return true;
	};

	parseHtml = (
		root: NodeInterface,
		callback?: (node: NodeInterface, value: MathValue) => NodeInterface,
	) => {
		const results: NodeInterface[] = [];
		root.find(
			`[${CARD_KEY}="${MathComponent.cardName}"],[${READY_CARD_KEY}="${MathComponent.cardName}"]`,
		).each((cardNode) => {
			const node = $(cardNode);
			const card = this.editor.card.find<
				MathValue,
				MathComponent<MathValue>
			>(node);
			const value =
				card?.getValue() ||
				decodeCardValue(node.attributes(CARD_VALUE_KEY));
			if (value) {
				let img = $('<img />');
				node.empty();
				img.attributes('src', value.url);
				img.css('visibility', 'visible');
				img.css('vertical-align', 'middle');
				const span = $(
					`<span data-type="${
						MathComponent.cardName
					}" data-value="${encodeCardValue(value)}"></span>`,
				);
				if (callback) {
					img = callback(img, value);
				}
				span.append(img);
				node.replaceWith(span);
				results.push(span);
			} else node.remove();
		});
		return results;
	};

	destroy() {
		const editor = this.editor;
		editor.off(PARSE_HTML, this.parseHtml);
		editor.off(PASTE_EACH, this.pasteHtml);
		editor.off(PASTE_SCHEMA, this.pasteSchema);
	}
}

export { MathComponent };
export type { MathValue, MathOptions };
