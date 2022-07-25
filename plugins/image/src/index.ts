import {
	$,
	CardInterface,
	CardType,
	CARD_KEY,
	CARD_TYPE_KEY,
	CARD_VALUE_KEY,
	decodeCardValue,
	NodeInterface,
	Plugin,
	PluginEntry,
	READY_CARD_KEY,
} from '@aomao/engine';
import ImageComponent, { ImageValue } from './component';
import ImageUploader from './uploader';
import { ImageUploaderOptions } from './uploader';
import locales from './locales';
import { ImageOptions } from './types';

const PARSE_HTML = 'parse:html';

export default class<T extends ImageOptions = ImageOptions> extends Plugin<T> {
	static get pluginName() {
		return 'image';
	}

	init() {
		const editor = this.editor;
		editor.language.add(locales);
		editor.on(PARSE_HTML, this.parseHtml);
	}

	execute(
		status: 'uploading' | 'done' | 'error',
		src: string,
		alt?: string,
	): void {
		const value: ImageValue = {
			status,
			src,
			alt,
		};
		if (status === 'error') {
			value.src = '';
			value.message = src;
		}
		this.editor.card.insert('image', value);
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
				component.name === ImageComponent.cardName &&
				(component as ImageComponent<ImageValue>).getValue()?.status ===
					'uploading'
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

	parseHtml = (
		root: NodeInterface,
		callback?: (node: NodeInterface, value: ImageValue) => NodeInterface,
	) => {
		const results: NodeInterface[] = [];
		const editor = this.editor;
		root.find(
			`[${CARD_KEY}="${ImageComponent.cardName}"],[${READY_CARD_KEY}="${ImageComponent.cardName}"]`,
		).each((cardNode) => {
			const node = $(cardNode);
			const card = editor.card.find(node) as ImageComponent<ImageValue>;
			const value =
				card?.getValue() ||
				decodeCardValue(node.attributes(CARD_VALUE_KEY));
			if (value?.src && value.status === 'done') {
				const currentImg = node.find('.data-image-meta img');
				let img =
					currentImg.length > 0
						? currentImg.clone(true)
						: $('<img />');
				node.empty();
				let src = value.src;
				const { onBeforeRender } = this.options;
				if (onBeforeRender) {
					src = onBeforeRender(value.status, value.src, this.editor);
				}
				const type = node.attributes(CARD_TYPE_KEY);
				img.attributes('src', src);
				img.css('visibility', 'visible');
				const size = value.size;
				if (size?.width) img.css('width', `${size.width}px`);
				if (size?.height) img.css('height', `${size.height}px`);
				img.removeAttributes('class');
				img.attributes('data-type', type);
				if (callback) {
					img = callback(img, value);
				}
				if (type === CardType.BLOCK) {
					img = editor.node.wrap(
						img,
						$(`<p style="text-align:center;"></p>`),
					);
				}
				node.replaceWith(img);
				results.push(img);
			} else node.remove();
		});
		return results;
	};

	destroy() {
		this.editor.off(PARSE_HTML, this.parseHtml);
	}
}

export { ImageComponent, ImageUploader };
export type { ImageValue, ImageOptions, ImageUploaderOptions };
