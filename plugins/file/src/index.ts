import { CARD_KEY, NodeInterface, Plugin } from '@aomao/engine';
import FileComponent, { FileValue } from './component';
import FileUploader from './uploader';
import locales from './locales';

export default class extends Plugin {
	static get pluginName() {
		return 'file';
	}

	private components: Array<FileComponent> = [];

	init() {
		this.editor.language.add(locales);
		this.editor.on('paser:html', node => this.parseHtml(node));
	}

	execute(
		status: 'uploading' | 'done' | 'error',
		url: string,
		name: string,
		size: number,
		preview: string,
		download: string,
	): void {
		const value: FileValue = {
			status,
			url,
			name,
			size,
			preview,
			download,
		};
		if (status === 'error') {
			value.url = '';
			value.message = url;
		}
		const component = this.editor.card.insert(
			'file',
			value,
		) as FileComponent;
		this.components.push(component);
	}

	async waiting(): Promise<void> {
		const check = () => {
			return this.components.every((component, index) => {
				const value = component.getValue();
				if (value?.status !== 'uploading') return true;

				const isDestroy = !component.root.inEditor();
				if (isDestroy) this.components.splice(index, 1);

				return isDestroy;
			});
		};
		return check()
			? Promise.resolve()
			: new Promise(resolve => {
					let time = 0;
					const wait = () => {
						setTimeout(() => {
							if (check() || time > 100) resolve();
							else wait();
							time += 1;
						}, 50);
					};
					wait();
			  });
	}

	parseHtml(root: NodeInterface) {
		const { $ } = this.editor;
		root.find(`[${CARD_KEY}=${FileComponent.cardName}`).each(cardNode => {
			const node = $(cardNode);
			const card = this.editor.card.find(node) as FileComponent;
			const value = card?.getValue();
			if (value?.url) {
				const html = `<a href="${value.url}" style="word-wrap: break-word;color: #096DD9;touch-action: manipulation;background-color: rgba(0,0,0,0);text-decoration: none;outline: none;cursor: pointer;transition: color .3s;">
                <span style="font-size: 14px;">\ud83d\udcce</span>${value.name}</a>`;
				node.empty();
				node.replaceWith($(html));
			} else node.remove();
		});
	}
}

export { FileComponent, FileUploader };
