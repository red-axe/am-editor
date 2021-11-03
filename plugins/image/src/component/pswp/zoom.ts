import { PswpInterface } from '@/types';
import { $, EditorInterface, Tooltip } from '@aomao/engine';

class Zoom {
	private pswp: PswpInterface;
	private editor: EditorInterface;
	prevStatus: string = 'default';
	nextStatus: string = 'default';
	zoomInStatus: string = 'default';
	zoomOutStatus: string = 'default';
	originSizeStatus: string = 'default';
	bestSizeStatus: string = 'default';

	constructor(editor: EditorInterface, pswp: PswpInterface) {
		this.editor = editor;
		this.pswp = pswp;
	}

	init() {
		this.pswp.on('afterzoom', () => {
			this.afterZoom();
		});

		this.pswp.on('afterchange', () => {
			this.afterChange();
		});

		this.pswp.on('resize', () => {
			setTimeout(() => {
				this.afterChange();
				this.afterZoom();
			}, 333);
		});
		this.render();
	}

	renderTemplate() {
		const root = $(`
        <div class="data-pswp-tool-bar">
            <div class="pswp-toolbar-content"></div>
        </div>
        `);

		const toolbarContent = root.find('.pswp-toolbar-content');

		const lang = this.editor.language.get('image');

		toolbarContent.append(
			this.renderBtn('arrow-left', lang['prev'], this.prevStatus, () => {
				if ('disable' !== this.prevStatus) this.pswp.prev();
			}),
		);

		toolbarContent.append('<span class="data-pswp-counter"></span>');

		toolbarContent.append(
			this.renderBtn('arrow-right', lang['next'], this.nextStatus, () => {
				if ('disable' !== this.nextStatus) this.pswp.next();
			}),
		);

		toolbarContent.append('<span class="separation"></span>');

		toolbarContent.append(
			this.renderBtn('zoom-in', lang['zoomIn'], this.zoomInStatus, () => {
				if ('disable' !== this.zoomInStatus) this.pswp.zoomIn();
			}),
		);

		toolbarContent.append(
			this.renderBtn(
				'zoom-out',
				lang['zoomOut'],
				this.zoomOutStatus,
				() => {
					if ('disable' !== this.zoomOutStatus) this.pswp.zoomOut();
				},
			),
		);

		toolbarContent.append(
			this.renderBtn(
				'origin-size',
				lang['originSize'],
				this.originSizeStatus,
				() => {
					if ('disable' !== this.originSizeStatus)
						this.pswp.zoomToOriginSize();
				},
			),
		);

		toolbarContent.append(
			this.renderBtn(
				'best-size',
				lang['bestSize'],
				this.bestSizeStatus,
				() => {
					if ('disable' !== this.bestSizeStatus)
						this.pswp.zoomToBestSize();
				},
			),
		);

		return root;
	}

	afterZoom() {
		const currentLevel = this.pswp.getCurrentZoomLevel();
		const initLevel = this.pswp.getInitialZoomLevel();
		let status = 'default';
		if (currentLevel === initLevel) {
			status = 'activated';
		}
		if (1 === initLevel) {
			status = 'disable';
		}
		this.zoomOutStatus = 0.05 === currentLevel ? 'disable' : 'default';
		this.zoomInStatus = 5 === currentLevel ? 'disable' : 'default';
		this.originSizeStatus = 1 === currentLevel ? 'activated' : 'default';
		this.bestSizeStatus = status;
		this.render();
	}

	afterChange() {
		const count = this.pswp.getCount();
		this.nextStatus = 1 === count ? 'disable' : 'default';
		this.prevStatus = 1 === count ? 'disable' : 'default';
		this.render();
	}

	renderBtn(
		zoomClass: string,
		title: string,
		status: string,
		onClick: () => void,
	) {
		const btn = $(
			`<span class="data-pswp-${zoomClass} btn ${status}"></span>`,
		);
		btn.on('mouseenter', () => {
			Tooltip.show(btn, title);
		});
		btn.on('mouseleave', () => {
			Tooltip.hide();
		});
		btn.on('mousedown', (e) => {
			e.stopPropagation();
			Tooltip.hide();
		});
		btn.on('click', onClick);
		return btn;
	}

	render() {
		this.pswp.barUI.empty();
		this.pswp.barUI.append(this.renderTemplate());
	}
}

export default Zoom;
