import { CARD_KEY, NodeInterface, Plugin } from '@aomao/engine';
import VideoComponent, { VideoValue } from './component';
import VideoUploader from './uploader';
import locales from './locales';

export default class VideoPlugin extends Plugin {
	static get pluginName() {
		return 'video';
	}

	private components: Array<VideoComponent> = [];

	init() {
		this.editor.language.add(locales);
		this.editor.on('paser:html', node => this.parseHtml(node));
	}

	execute(
		status: 'uploading' | 'transcoding' | 'done' | 'error',
		url: string,
		name?: string,
		video_id?: string,
		cover?: string,
		size?: number,
		download?: string,
	): void {
		const value: VideoValue = {
			status,
			video_id,
			cover,
			url,
			name: name || url,
			size,
			download,
		};
		if (status === 'error') {
			value.url = '';
			value.message = url;
		}
		const component = this.editor.card.insert(
			'video',
			value,
		) as VideoComponent;
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
		root.find(`[${CARD_KEY}=${VideoComponent.cardName}`).each(cardNode => {
			const node = $(cardNode);
			const card = this.editor.card.find(node) as VideoComponent;
			const value = card?.getValue();
			if (value?.url && value.status === 'done') {
				const html = `<a href="${value.url}#${value.id}" style="word-wrap: break-word;color: #096DD9;touch-action: manipulation;background-color: rgba(0,0,0,0);text-decoration: none;outline: none;cursor: pointer;transition: color .3s;">
                ${value.name}</a>`;
				node.empty();
				node.replaceWith($(html));
			} else node.remove();
		});
	}
}

export { VideoComponent, VideoUploader };
