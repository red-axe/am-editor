import {
	$,
	CardInterface,
	CARD_KEY,
	CARD_VALUE_KEY,
	decodeCardValue,
	encodeCardValue,
	isEngine,
	NodeInterface,
	Plugin,
	READY_CARD_KEY,
	SchemaInterface,
} from '@aomao/engine';
import FileComponent from './component';
import FileUploader from './uploader';
import type { FileUploaderOptions } from './uploader';
import locales from './locales';
import { FileOptions, FileValue } from './types';

const PARSE_HTML = 'parse:html';
const PASTE_SCHEMA = 'paste:schema';
const PASTE_EACH = 'paste:each';
export default class<T extends FileOptions = FileOptions> extends Plugin<T> {
	static get pluginName() {
		return 'file';
	}

	init() {
		const editor = this.editor;
		editor.language.add(locales);
		editor.on(PARSE_HTML, this.parseHtml);
		editor.on(PASTE_EACH, this.pasteHtml);
		editor.on(PASTE_SCHEMA, this.pasteSchema);
	}

	execute(
		status: 'uploading' | 'done' | 'error',
		url: string,
		name?: string,
		size?: number,
		preview?: string,
		download?: string,
	): void {
		const value: FileValue = {
			status,
			url,
			name: name || url,
			size,
			preview,
			download,
		};
		if (status === 'error') {
			value.url = '';
			value.message = url;
		}
		this.editor.card.insert<FileValue>('file', value);
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
				component.name === FileComponent.cardName &&
				(component as FileComponent<FileValue>).getValue()?.status ===
					'uploading'
			);
		};
		// 找到不合格的组件
		const find = () => {
			return card.components.find(check);
		};
		const waitCheck = (component: CardInterface): Promise<void> => {
			let time = 60000;
			return new Promise((resolve, reject) => {
				if (callback) {
					const result = callback(this.name, component);
					if (result === false) {
						return reject({
							name: this.name,
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
					value: FileComponent.cardName,
				},
				'data-value': '*',
			},
		});
	};

	pasteHtml = (node: NodeInterface) => {
		const editor = this.editor;
		if (!isEngine(editor)) return;
		if (node.isElement()) {
			const type = node.attributes('data-type');
			if (type === FileComponent.cardName) {
				const value = node.attributes('data-value');
				const cardValue = decodeCardValue(value);
				if (!cardValue.url) return;
				editor.card.replaceNode(
					node,
					FileComponent.cardName,
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
		callback?: (node: NodeInterface, value: FileValue) => NodeInterface,
	) => {
		const results: NodeInterface[] = [];
		root.find(
			`[${CARD_KEY}="${FileComponent.cardName}"],[${READY_CARD_KEY}="${FileComponent.cardName}"`,
		).each((cardNode) => {
			const node = $(cardNode);
			const card = this.editor.card.find(
				node,
			) as FileComponent<FileValue>;
			const value =
				card?.getValue() ||
				decodeCardValue(node.attributes(CARD_VALUE_KEY));
			if (value?.url && value.status === 'done') {
				const html = `<span data-type="${
					FileComponent.cardName
				}" data-value="${encodeCardValue(
					value,
				)}"><a target="_blank" href="${
					value.url
				}" style="word-wrap: break-word;color: #096DD9;touch-action: manipulation;background-color: rgba(0,0,0,0);text-decoration: none;outline: none;cursor: pointer;transition: color .3s;"><span style="font-size: 14px;">\ud83d\udcce</span>${
					value.name
				}</a></span>`;
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

export { FileComponent, FileUploader };
export type { FileValue, FileOptions, FileUploaderOptions };
