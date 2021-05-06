import {
	CARD_KEY,
	CARD_TYPE_KEY,
	CARD_VALUE_KEY,
	NodeInterface,
	Plugin,
} from '@aomao/engine';
import ImageComponent, { ImageValue } from './component';
import ImageUploader from './uploader';
import locales from './locales';

export default class extends Plugin {
	static get pluginName() {
		return 'image';
	}

	private components: Array<ImageComponent> = [];

	init() {
		this.editor.language.add(locales);
		this.editor.on('paser:html', node => this.parseHtml(node));
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
		const component = this.editor.card.insert(
			'image',
			value,
		) as ImageComponent;
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
		root.find(`[${CARD_KEY}=${ImageComponent.cardName}`).each(cardNode => {
			const node = $(cardNode);
			const card = this.editor.card.find(node) as ImageComponent;
			const value = card?.getValue();
			if (value?.src) {
				const img = node.find('.data-image-meta > img');
				node.empty();
				img.attributes('src', value.src);
				img.css('visibility', 'visible');
				node.replaceWith(img);
			} else node.remove();
		});
	}
}

export { ImageComponent, ImageUploader };
