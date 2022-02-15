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

export interface MathOptions extends PluginOptions {
	/**
	 * 请求生成公式svg地址
	 */
	action: string;
	/**
	 * 数据返回类型，默认 json
	 */
	type?: '*' | 'json' | 'xml' | 'html' | 'text' | 'js';
	/**
	 * 额外携带数据上传
	 */
	data?: {};
	/**
	 * 请求类型，默认 application/json;
	 */
	contentType?: string;
	/**
	 * 解析上传后的Respone，返回 result:是否成功，data:成功：公式数据，失败：错误信息
	 */
	parse?: (response: any) => {
		result: boolean;
		data: string;
	};
}

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
		this.editor.language.add(locales);
		this.editor.on('parse:html', (node) => this.parseHtml(node));
		this.editor.on('paste:each', (child) => this.pasteHtml(child));
		this.editor.on('paste:schema', (schema: SchemaInterface) =>
			this.pasteSchema(schema),
		);
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
		const { request } = this.editor;
		const { action, type, contentType, data, parse } = this.options;
		this.#request[key]?.abort();
		this.#request[key] = request.ajax({
			url: action,
			method: 'POST',
			contentType: contentType || 'application/json',
			type: type === undefined ? 'json' : type,
			data: {
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
				failed(
					error.message ||
						this.editor.language.get('image', 'uploadError'),
				);
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

	pasteSchema(schema: SchemaInterface) {
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
	}

	pasteHtml(node: NodeInterface) {
		if (!isEngine(this.editor)) return;
		if (node.isElement()) {
			const attributes = node.attributes();
			const type = attributes['data-type'];
			if (type === MathComponent.cardName) {
				const value = attributes['data-value'];
				const cardValue = decodeCardValue(value);
				if (!cardValue.url) return;
				this.editor.card.replaceNode(
					node,
					MathComponent.cardName,
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
		callback?: (node: NodeInterface, value: MathValue) => NodeInterface,
	) {
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
			} else node.remove();
		});
	}
}

export { MathComponent };
export type { MathValue };
