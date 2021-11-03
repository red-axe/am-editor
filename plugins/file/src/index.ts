import {
	$,
	CardEntry,
	CardInterface,
	CARD_KEY,
	decodeCardValue,
	encodeCardValue,
	isEngine,
	NodeInterface,
	Plugin,
	PluginEntry,
	SchemaInterface,
} from '@aomao/engine';
import FileComponent, { FileValue } from './component';
import FileUploader from './uploader';
import locales from './locales';

export default class extends Plugin {
	static get pluginName() {
		return 'file';
	}

	init() {
		this.editor.language.add(locales);
		if (!isEngine(this.editor)) return;
		this.editor.on('parse:html', (node) => this.parseHtml(node));
		this.editor.on('paste:each', (child) => this.pasteHtml(child));
		this.editor.on('paste:schema', (schema: SchemaInterface) =>
			this.pasteSchema(schema),
		);
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
		this.editor.card.insert('file', value) as FileComponent;
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
					FileComponent.cardName &&
				(component as FileComponent).getValue()?.status === 'uploading'
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
			type: 'mark',
			name: 'a',
			attributes: {
				'data-type': {
					required: true,
					value: FileComponent.cardName,
				},
				'data-value': '*',
			},
		});
	}

	pasteHtml(node: NodeInterface) {
		if (!isEngine(this.editor)) return;
		if (node.isElement()) {
			const type = node.attributes('data-type');
			if (type === FileComponent.cardName) {
				const value = node.attributes('data-value');
				const cardValue = decodeCardValue(value);
				if (!cardValue.url) return;
				this.editor.card.replaceNode(
					node,
					FileComponent.cardName,
					cardValue,
				);
				node.remove();
				return false;
			}
		}
		return true;
	}

	parseHtml(root: NodeInterface) {
		root.find(`[${CARD_KEY}=${FileComponent.cardName}`).each((cardNode) => {
			const node = $(cardNode);
			const card = this.editor.card.find(node) as FileComponent;
			const value = card?.getValue();
			if (value?.url && value.status === 'done') {
				const html = `<a data-type="${
					FileComponent.cardName
				}" data-value="${encodeCardValue(value)}" href="${
					value.url
				}" style="word-wrap: break-word;color: #096DD9;touch-action: manipulation;background-color: rgba(0,0,0,0);text-decoration: none;outline: none;cursor: pointer;transition: color .3s;"><span style="font-size: 14px;">\ud83d\udcce</span>${
					value.name
				}</a>`;
				node.empty();
				node.replaceWith($(html));
			} else node.remove();
		});
	}
}

export { FileComponent, FileUploader };
