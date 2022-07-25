import {
	$,
	CardEntry,
	CardInterface,
	CARD_KEY,
	CARD_VALUE_KEY,
	decodeCardValue,
	encodeCardValue,
	isEngine,
	NodeInterface,
	Plugin,
	PluginEntry,
	PluginOptions,
	READY_CARD_KEY,
	sanitizeUrl,
	SchemaInterface,
} from '@aomao/engine';
import VideoComponent from './component';
import type { VideoValue, VideoStatus } from './component';
import VideoUploader from './uploader';
import type { VideoUploaderOptions } from './uploader';
import locales from './locales';
import { VideoOptions } from './types';

const PARSE_HTML = 'parse:html';
const PASTE_EACH = 'paste:each';
const PASTE_SCHEMA = 'paste:schema';
export default class VideoPlugin<
	T extends VideoOptions = VideoOptions,
> extends Plugin<T> {
	static get pluginName() {
		return 'video';
	}

	init() {
		const editor = this.editor;
		editor.language.add(locales);
		editor.on(PARSE_HTML, this.parseHtml);
		editor.on(PASTE_EACH, this.pasteHtml);
		editor.on(PASTE_SCHEMA, this.pasteSchema);
	}

	execute(
		status: 'uploading' | 'transcoding' | 'done' | 'error',
		url: string,
		name?: string,
		video_id?: string,
		cover?: string,
		size?: number,
		download?: string,
		naturalWidth?: number,
		naturalHeight?: number,
		width?: number,
		height?: number,
	): void {
		const value: VideoValue = {
			status,
			video_id,
			cover,
			url,
			name: name || url,
			size,
			download,
			width,
			height,
			naturalWidth,
			naturalHeight,
		};
		if (status === 'error') {
			value.url = '';
			value.message = url;
		}
		this.editor.card.insert('video', value);
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
				component.name === VideoComponent.cardName &&
				(component as VideoComponent<VideoValue>).getValue()?.status ===
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

	pasteSchema = (schema: SchemaInterface) => {
		schema.add({
			type: 'block',
			name: 'div',
			attributes: {
				'data-value': '*',
				'data-type': {
					required: true,
					value: VideoComponent.cardName,
				},
			},
		});
	};

	pasteHtml = (node: NodeInterface) => {
		const editor = this.editor;
		if (!isEngine(editor)) return;
		if (node.isElement()) {
			const type = node.attributes('data-type');
			if (type === VideoComponent.cardName) {
				const value = node.attributes('data-value');
				const cardValue = decodeCardValue(value) as VideoValue;
				if (!cardValue.url) return;
				editor.card.replaceNode(
					node,
					VideoComponent.cardName,
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
		callback?: (node: NodeInterface, value: VideoValue) => NodeInterface,
	) => {
		const results: NodeInterface[] = [];
		root.find(
			`[${CARD_KEY}="${VideoComponent.cardName}"],[${READY_CARD_KEY}="${VideoComponent.cardName}"]`,
		).each((cardNode) => {
			const node = $(cardNode);
			const card = this.editor.card.find<VideoValue>(node);
			const value =
				card?.getValue() ||
				decodeCardValue(node.attributes(CARD_VALUE_KEY));
			if (value?.url && value.status === 'done') {
				const { onBeforeRender } = this.options;
				const { cover, url } = value;
				const html = `<div data-type="${
					VideoComponent.cardName
				}"  data-value="${encodeCardValue(
					value,
				)}"><video controls src="${sanitizeUrl(
					onBeforeRender
						? onBeforeRender('query', url, this.editor)
						: url,
				)}" poster="${
					!cover
						? 'none'
						: sanitizeUrl(
								onBeforeRender
									? onBeforeRender(
											'cover',
											cover,
											this.editor,
									  )
									: cover,
						  )
				}" webkit-playsinline="webkit-playsinline" playsinline="playsinline" style="outline:none;" /></div>`;
				node.empty();
				let newNode = $(html);
				if (callback) {
					newNode = callback(newNode, value);
				}
				node.replaceWith(newNode);
				results.push(newNode);
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

export { VideoComponent, VideoUploader };
export type { VideoValue, VideoOptions, VideoStatus, VideoUploaderOptions };
