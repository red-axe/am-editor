import {
	$,
	CARD_KEY,
	NodeInterface,
	Plugin,
	CardEntry,
	PluginOptions,
	CardInterface,
	PluginEntry,
} from '@aomao/engine';
import MathComponent from './component';
import locales from './locales';

export interface Options extends PluginOptions {
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

export default class Math extends Plugin<Options> {
	static get pluginName() {
		return 'math';
	}

	init() {
		this.editor.language.add(locales);
	}

	execute(...args: any): void {
		const { card } = this.editor;
		const cardComponent = card.insert(MathComponent.cardName, {
			code: args[0] || '',
			url: args[1] || '',
		});
		card.activate(cardComponent.root);
		window.setTimeout(() => {
			(cardComponent as MathComponent).focusTextarea();
		}, 10);
	}

	action(action: string, ...args: any) {
		switch (action) {
			case 'query':
				const [code, success, failed] = args;
				return this.query(code, success, failed);
		}
	}

	query(
		code: string,
		success: (url: string) => void,
		failed: (message: string) => void,
	) {
		const { request } = this.editor;
		const { action, type, contentType, data, parse } = this.options;
		request.ajax({
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
				(component.constructor as CardEntry).cardName ===
					MathComponent.cardName &&
				(component as MathComponent).isSaving
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

	parseHtml(root: NodeInterface) {
		root.find(`[${CARD_KEY}=${MathComponent.cardName}`).each((cardNode) => {
			const node = $(cardNode);
			const card = this.editor.card.find(node) as MathComponent;
			const value = card?.getValue();
			if (value) {
				const img = node.find('img');
				node.empty();
				img.attributes('src', value.url);
				img.css('visibility', 'visible');
				img.css('vertical-align', 'middle');
				node.replaceWith(img);
			} else node.remove();
		});
	}
}

export { MathComponent };
