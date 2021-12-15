import { EventEmitter2 } from 'eventemitter2';
import PhotoSwipe from 'photoswipe';
import PhotoSwipeUI from 'photoswipe/dist/photoswipe-ui-default';
import {
	$,
	EditorInterface,
	isHotkey,
	isMobile,
	NodeInterface,
} from '@aomao/engine';
import { PswpInterface } from '@/types';
import Zoom from './zoom';
import 'photoswipe/dist/photoswipe.css';
import './index.css';

class Pswp extends EventEmitter2 implements PswpInterface {
	private editor: EditorInterface;
	private options: PhotoSwipeUI.Options;
	private timeouts: Array<NodeJS.Timeout> = [];
	private pswpUI?: PhotoSwipe<PhotoSwipeUI.Options>;
	private zoom?: number;
	private isDestroy: boolean = true;
	private zoomUI: Zoom;
	root: NodeInterface;
	barUI: NodeInterface;
	closeUI: NodeInterface;

	constructor(editor: EditorInterface, options?: PhotoSwipeUI.Options) {
		super();
		this.editor = editor;
		this.options = {
			shareEl: false,
			fullscreenEl: false,
			zoomEl: false,
			history: false,
			closeOnScroll: false,
			preloaderEl: false,
			captionEl: false,
			counterEl: false,
			clickToCloseNonZoomable: false,
			showAnimationDuration: 0,
			hideAnimationDuration: 0,
			closeOnVerticalDrag: isMobile,
			tapToClose: true,
			bgOpacity: 0.8,
			barsSize: {
				top: 44,
				bottom: 80,
			},
			...options,
		};

		this.isDestroy = true;
		this.root = this.renderTemplate();
		this.barUI = this.root.find('.data-pswp-custom-top-bar');
		this.closeUI = this.root.find('.data-pswp-button-close');
		$(document.body).append(this.root);
		this.zoomUI = new Zoom(this.editor, this);
		this.zoomUI.render();
		if (!isMobile) {
			this.bindKeyboardEvnet();
			this.hoverControllerFadeInAndOut();
		}
		this.bindClickEvent();
	}

	renderTemplate() {
		const root = $(`
        <div class="pswp" tabindex="-1" role="dialog" aria-hidden="true">
            <div class="pswp__bg"></div>
            <div class="pswp__scroll-wrap">
                <div class="pswp__container">
                    <div class="pswp__item"></div>
                    <div class="pswp__item"></div>
                    <div class="pswp__item"></div>
                </div>
                <div class="pswp__ui pswp__ui--hidden">
                    <button class="pswp__button data-pswp-button-close" title="Close (Esc)"></button>
                    <div class="data-pswp-custom-top-bar"></div>
                </div>
            </div>
        </div>`);
		root.addClass(isMobile ? 'data-pswp-mobile' : 'data-pswp-pc');
		return root;
	}

	hoverControllerFadeInAndOut() {
		this.barUI.on('mouseenter', () => {
			this.removeFadeOut(this.barUI, 'barFadeInAndOut');
			this.removeFadeOut(this.closeUI, 'closeFadeInAndOut');
		});

		this.barUI.on('mouseleave', () => {
			this.fadeOut(this.barUI, 'barFadeInAndOut');
			this.fadeOut(this.closeUI, 'closeFadeInAndOut');
		});

		this.closeUI.on('mouseenter', () => {
			this.removeFadeOut(this.barUI, 'barFadeInAndOut');
			this.removeFadeOut(this.closeUI, 'closeFadeInAndOut');
		});

		this.closeUI.on('mouseleave', () => {
			this.fadeOut(this.barUI, 'barFadeInAndOut');
			this.fadeOut(this.closeUI, 'closeFadeInAndOut');
		});
	}

	removeFadeOut(node: NodeInterface, id: string) {
		if (this.timeouts[id]) {
			clearTimeout(this.timeouts[id]);
		}
		node.removeClass('pswp-fade-out');
	}

	fadeOut(node: NodeInterface, id: string) {
		if (this.timeouts[id]) {
			clearTimeout(this.timeouts[id]);
		}
		this.timeouts[id] = setTimeout(() => {
			node.addClass('pswp-fade-out');
		}, 3000);
	}

	bindClickEvent() {
		const onClick = (event: MouseEvent | TouchEvent) => {
			const node =
				window.TouchEvent && event instanceof TouchEvent
					? $(event.touches[0].target)
					: $(event.target || []);
			if (node.hasClass('pswp__img')) {
				setTimeout(() => {
					this.zoom = undefined;
					this.afterZoom();
				}, 366);
			}
			if (
				node.hasClass('pswp__bg') ||
				node.hasClass('data-pswp-tool-bar')
			) {
				this.close();
			}
		};
		this.root.on('click', onClick);
		this.closeUI.on('click', this.close);
	}

	prev() {
		this.pswpUI?.prev();
	}

	next() {
		this.pswpUI?.next();
	}

	renderCounter() {
		this.barUI
			.find('.data-pswp-counter')
			.html(
				`${(this.pswpUI?.getCurrentIndex() || 0) + 1} / ${
					this.pswpUI?.items.length || ''
				}`,
			);
	}

	getCurrentZoomLevel() {
		return (
			(this.zoom && +this.zoom.toFixed(2)) ||
			(this.pswpUI && +this.pswpUI.getZoomLevel().toFixed(2)) ||
			0
		);
	}

	zoomTo(zoom: number) {
		if (!this.pswpUI) return;
		this.pswpUI.zoomTo(
			zoom,
			{
				x: this.pswpUI.viewportSize.x / 2,
				y: this.pswpUI.viewportSize.y / 2,
			},
			100,
		);
		this.zoom = zoom;
		this.afterZoom();
	}

	zoomIn() {
		const zoom = this.getCurrentZoomLevel();
		let newZoom = (zoom || 0) + 0.2;
		if (5 !== zoom) {
			if (newZoom > 5) newZoom = 5;
			this.zoomTo(newZoom);
		}
	}

	zoomOut() {
		const zoom = this.getCurrentZoomLevel();
		if (0.05 !== zoom && zoom !== undefined) {
			let newZoom = zoom - 0.2;
			if (0.05 > newZoom) {
				newZoom = 0.05;
			}
			this.zoomTo(newZoom);
		}
	}

	bindKeyboardEvnet() {
		this.root.on('keydown', (event) => {
			if ((event.metaKey || event.ctrlKey) && 187 === event.keyCode) {
				event.preventDefault();
				this.zoomIn();
			}
			if (isHotkey('mod+-', event)) {
				event.preventDefault();
				this.zoomOut();
			}
		});
	}

	zoomToOriginSize() {
		this.zoomTo(1);
	}

	zoomToBestSize() {
		const zoom = this.getInitialZoomLevel();
		if (!zoom) return;
		this.zoomTo(zoom);
	}

	updateCursor() {
		const { root } = this;
		const currentZoomLevel = this.getCurrentZoomLevel();
		const initialZoomLevel = this.getInitialZoomLevel();
		if (currentZoomLevel === 1) {
			root.addClass('pswp--zoomed-in');
		} else if (initialZoomLevel === initialZoomLevel) {
			root.removeClass('pswp--zoomed-in');
		}
	}

	getInitialZoomLevel() {
		if (!this.pswpUI) return 0;
		return +(this.pswpUI.currItem.initialZoomLevel?.toFixed(2) || 0);
	}

	afterZoom() {
		this.updateCursor();
		this.emit('afterzoom');
	}

	getCount() {
		return this.pswpUI?.items.length || 0;
	}

	afterChange() {
		if (!isMobile) {
			const initialZoomLevel = this.getInitialZoomLevel();
			this.renderCounter();
			this.zoom = initialZoomLevel;
			setTimeout(() => {
				this.afterZoom();
			}, 100);
			this.emit('afterchange');
			this.zoom = this.getInitialZoomLevel();
		}
		this.setWhiteBackground();
	}

	bindPswpEvent() {
		this.pswpUI?.listen('afterChange', () => {
			this.afterChange();
		});
		this.pswpUI?.listen('destroy', () => {
			this.isDestroy = true;
		});
		this.pswpUI?.listen('resize', () => {
			this.emit('resize');
		});
		this.pswpUI?.listen('imageLoadComplete', () => {
			this.setWhiteBackground();
		});
	}

	setWhiteBackground() {
		this.root.find('.pswp__img').each((img) => {
			const node = img as HTMLImageElement;
			if (node.complete) {
				node.style.background = 'white';
				node.style['box-shadow'] = '0 0 10px rgba(0, 0, 0, 0.5)';
			} else {
				node.onload = () => {
					node.style.background = 'white';
					node.style['box-shadow'] = '0 0 10px rgba(0, 0, 0, 0.5)';
				};
			}
		});
	}

	open(items: Array<PhotoSwipe.Item>, index: number) {
		if (true === this.isDestroy) {
			const { root } = this;
			const pswp = new PhotoSwipe(
				this.root.get<HTMLElement>()!,
				PhotoSwipeUI,
				items,
				{
					index,
					...this.options,
				},
			);
			pswp.items = items;
			pswp.init();
			this.pswpUI = pswp;
			this.isDestroy = false;
			if (!isMobile) {
				this.barUI.removeClass('pswp-fade-out');
				this.fadeOut(this.barUI, 'barFadeInAndOut');
				this.closeUI.removeClass('pswp-fade-out');
				this.fadeOut(this.closeUI, 'closeFadeInAndOut');
			}
			root.removeClass('pswp-fade-in');
			root.addClass('pswp-fade-in');
			this.afterChange();
			this.bindPswpEvent();
		}
	}

	close = () => {
		this.pswpUI?.close();
	};

	destroy() {
		this.close();
	}
}

export default Pswp;
