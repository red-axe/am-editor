import { CardInterface, isEngine, Plugin } from '@aomao/engine';
import ImageComponent, { ImageValue } from './component';
import ImageUploader from './uploader';
import locales from './locales';

export default class extends Plugin {
	static get pluginName() {
		return 'image';
	}

	private components: Array<ImageComponent> = [];

	init() {
		super.init();
		this.editor.language.add(locales);
	}

	execute(status: 'uploading' | 'done' | 'error', src: string): void {
		const value: ImageValue = {
			status,
			src,
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
}

export { ImageComponent, ImageUploader };
