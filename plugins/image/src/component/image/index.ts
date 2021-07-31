import { PswpInterface } from '@/types';
import {
	$,
	EditorInterface,
	getWindow,
	isEngine,
	escape,
	NodeInterface,
	sanitizeUrl,
	Tooltip,
	isMobile,
} from '@aomao/engine';
import Pswp from '../pswp';
import Resizer from '../resizer';
import './index.css';

export type Status = 'uploading' | 'done' | 'error';

export type Size = {
	width: number;
	height: number;
	naturalWidth: number;
	naturalHeight: number;
};

export type Options = {
	/**
	 * 卡片根节点
	 */
	root: NodeInterface;
	/**
	 * 容器
	 */
	container: NodeInterface;
	/**
	 * 状态
	 * uploading 上传中
	 * done 上传完成
	 * error 错误
	 */
	status: Status;
	/**
	 * 图标链接
	 */
	src: string;
	/**
	 * 标题
	 */
	alt?: string;
	/**
	 * 链接
	 */
	link?: {
		href: string;
		target?: string;
	};
	/**
	 * 错误消息
	 */
	message?: string;
	/**
	 * 样式名称，多个以空格隔空
	 */
	className?: string;
	/**
	 * 图片大小
	 */
	size?: Size;
	/**
	 * 上传进度
	 */
	percent?: number;
	/**
	 * 图片渲染前调用
	 * @param status 状态
	 * @param src 图片地址
	 * @returns 图片地址
	 */
	onBeforeRender?: (status: 'uploading' | 'done', src: string) => string;
	onChange?: (size?: Size) => void;
	onError?: () => void;
};

export const winPixelRatio = getWindow().devicePixelRatio;
let pswp: PswpInterface | undefined = undefined;
class Image {
	private editor: EditorInterface;
	private options: Options;
	private root: NodeInterface;
	private progress: NodeInterface;
	private image: NodeInterface;
	private detail: NodeInterface;
	private meta: NodeInterface;
	private maximize: NodeInterface;
	private resizer?: Resizer;
	private pswp: PswpInterface;
	src: string;
	status: Status;
	size: Size;
	maxWidth: number;
	rate: number = 1;
	isLoad: boolean = false;
	message: string | undefined;

	constructor(editor: EditorInterface, options: Options) {
		this.editor = editor;
		this.options = options;
		this.src = this.options.src;
		this.size = this.options.size || {
			width: 0,
			height: 0,
			naturalHeight: 0,
			naturalWidth: 0,
		};
		this.status = this.options.status;
		this.root = $(this.renderTemplate());
		this.progress = this.root.find('.data-image-progress');
		this.image = this.root.find('img');
		this.detail = this.root.find('.data-image-detail');
		this.meta = this.root.find('.data-image-meta');
		this.maximize = this.root.find('.data-image-maximize');
		this.maxWidth = this.getMaxWidth();
		this.pswp = pswp || new Pswp(this.editor);
		this.message = this.options.message;
		pswp = this.pswp;
	}

	renderTemplate(message?: string) {
		const { link, percent, className, onBeforeRender } = this.options;

		if (this.status === 'error') {
			return `<span class="data-image-error" style="max-width:${
				this.maxWidth
			}px"><span class="data-icon data-icon-error"></span>${
				message || this.options.message
			}<span class="data-icon data-icon-copy"></span></span>`;
		}
		const src = onBeforeRender
			? onBeforeRender(this.status, this.options.src)
			: this.options.src;
		const progress = `<span class="data-image-progress">
                            <i class="data-anticon">
                                <svg viewBox="0 0 1024 1024" class="data-anticon-spin" data-icon="loading" width="1em" height="1em" fill="currentColor" aria-hidden="true">
                                    <path d="M988 548c-19.9 0-36-16.1-36-36 0-59.4-11.6-117-34.6-171.3a440.45 440.45 0 0 0-94.3-139.9 437.71 437.71 0 0 0-139.9-94.3C629 83.6 571.4 72 512 72c-19.9 0-36-16.1-36-36s16.1-36 36-36c69.1 0 136.2 13.5 199.3 40.3C772.3 66 827 103 874 150c47 47 83.9 101.8 109.7 162.7 26.7 63.1 40.2 130.2 40.2 199.3.1 19.9-16 36-35.9 36z"></path>
                                </svg>
                            </i>
                            <span class="percent">${percent || 0}%</span>
                        </span>`;

		const alt = escape(this.options.alt || '');
		const attr = !!alt ? ` alt="${alt}" title="${alt}" ` : '';
		//加上 data-drag-image 样式可以拖动图片
		let img = `<img src="${sanitizeUrl(src)}" class="${
			className || ''
		} data-drag-image" ${attr}/>`;
		//只读渲染加载链接
		if (link && !isEngine(this.editor)) {
			const target = link.target || '_blank';
			img = `<a href="${sanitizeUrl(
				link.href,
			)}" target="${target}">${img}</a>`;
		}
		//全屏图标
		let maximize =
			'<span class="data-image-maximize" style="display: none;"><span class="data-icon data-icon-maximize"></span></span>';

		return `
        <span class="data-image">
            <span class="data-image-content data-image-loading">
                <span class="data-image-detail">
                    <span class="data-image-meta">
                        ${img}
                        ${progress}
                        ${maximize}
                    </span>
                </span>
            </span>
        </span>`;
	}

	bindErrorEvent(node: NodeInterface) {
		const copyNode = node.find('.data-icon-copy');
		copyNode.on('mouseenter', () => {
			Tooltip.show(
				copyNode,
				this.editor.language
					.get('image', 'errorMessageCopy')
					.toString(),
			);
		});
		copyNode.on('mouseleave', () => {
			Tooltip.hide();
		});
		copyNode.on('mousedown', (event: MouseEvent) => {
			event.stopPropagation();
			event.preventDefault();
			Tooltip.hide();
			this.editor.clipboard.copy(this.options.message || 'Error message');
			this.editor.messageSuccess(
				this.editor.language.get('copy', 'success').toString(),
			);
		});
	}

	setProgressPercent(percent: number) {
		this.progress.find('.percent').html(`${percent}%`);
	}

	imageLoadCallback() {
		const root = this.editor.card.closest(this.root);
		if (!root) {
			return;
		}

		if (this.status === 'done') {
			const contentNode = this.root.find('.data-image-content');
			contentNode.addClass('data-image-loaded');
			contentNode.removeClass('data-image-loading');
		}

		const img = this.image.get<HTMLImageElement>();
		if (!img) return;
		const { naturalWidth, naturalHeight } = img;
		this.rate = naturalHeight / naturalWidth;

		this.size.naturalWidth = naturalWidth;
		this.size.naturalHeight = naturalHeight;

		if (!this.size.width) this.size.width = naturalWidth;
		if (!this.size.height) this.size.height = naturalHeight;

		this.resetSize();

		this.image.css('visibility', 'visible');
		this.image.css('background-color', '');
		this.image.css('background-repeat', '');
		this.image.css('background-position', '');
		this.image.css('background-image', '');
		this.detail.css('width', '');
		this.detail.css('height', '');
		const { onChange } = this.options;
		if (isEngine(this.editor) && onChange) {
			onChange(this.size);
		}
		window.removeEventListener('resize', this.onWindowResize);
		window.addEventListener('resize', this.onWindowResize);
		// 重新调整拖动层尺寸
		if (this.resizer) {
			this.resizer.setSize(img.clientWidth, img.clientHeight);
		}
		this.isLoad = true;
	}

	onWindowResize = () => {
		if (!isEngine(this.editor)) return;
		this.maxWidth = this.getMaxWidth();
		this.resetSize();
		const image = this.image.get<HTMLElement>();
		if (!image) return;
		const { clientWidth, clientHeight } = image;
		if (this.resizer) {
			this.resizer.maxWidth = this.maxWidth;
			this.resizer.setSize(clientWidth, clientHeight);
		}
	};

	imageLoadError() {
		this.status = 'error';
		const { container } = this.options;
		container.empty();
		container.append(
			this.renderTemplate(
				this.editor.language.get('image', 'loadError').toString(),
			),
		);
		this.detail.css('width', '');
		this.detail.css('height', '');
		this.bindErrorEvent(container);
		const { onError } = this.options;
		if (onError) onError();
		this.isLoad = true;
	}

	getMaxWidth(node: NodeInterface = this.options.root) {
		const block = this.editor.block.closest(node).get<HTMLElement>();
		if (!block) return 0;
		return block.clientWidth - 6;
	}

	/**
	 * 重置大小
	 */
	resetSize() {
		this.meta.css({
			'background-color': '',
			width: '',
			height: '',
		});

		this.image.css({
			width: '',
			height: '',
		});

		const img = this.image.get<HTMLImageElement>();
		if (!img) return;

		let { width, height } = this.size;

		if (!height) {
			height = Math.round(this.rate * width);
		} else if (!width) {
			width = Math.round(height / this.rate);
		} else if (width && height) {
			// 修正非正常的比例
			height = Math.round(this.rate * width);
			this.size.height = height;
		} else {
			const { clientWidth, clientHeight } = img;
			width = clientWidth;
			height = clientHeight;
			const { naturalWidth, naturalHeight } = this.size;
			// fix：svg 图片宽度 300px 问题
			if (this.isSvg() && naturalWidth && naturalHeight) {
				width = naturalWidth;
				height = naturalHeight;
			}
		}

		if (width > this.maxWidth) {
			width = this.maxWidth;
			height = Math.round(width * this.rate);
		}

		this.image.css('width', `${width}px`);
		this.image.css('height', `${height}px`);
	}

	changeSize(width: number, height: number) {
		if (width < 24) {
			width = 24;
			height = width * this.rate;
		}

		if (width > this.maxWidth) {
			width = this.maxWidth;
			height = width * this.rate;
		}

		if (height < 24) {
			height = 24;
			width = height / this.rate;
		}

		width = Math.round(width);
		height = Math.round(height);
		this.size.width = width;
		this.size.height = height;
		this.image.css({
			width: `${width}px`,
			height: `${height}px`,
		});

		const { onChange } = this.options;
		if (onChange) onChange(this.size);

		this.destroyEditor();
		this.renderEditor();
	}

	isSvg() {
		return (
			this.src.endsWith('.svg') ||
			this.src.startsWith('data:image/svg+xml')
		);
	}

	openZoom(event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();

		const imageArray: Array<PhotoSwipe.Item> = [];
		const cardRoot = this.editor.card.closest(this.root);
		let rootIndex = 0;

		this.editor.container
			.find('[data-card-key="image"]')
			.toArray()
			.filter((image) => {
				return image.find('img').length > 0;
			})
			.forEach((imageNode, index) => {
				const card = this.editor.card.find(imageNode);
				if (!card) return;
				const image = card.getCenter().find('img');
				const value = card.getValue() || {};
				const imageWidth = parseInt(image.css('width'));
				const imageHeight = parseInt(image.css('height'));
				const naturalWidth =
					value['naturalWidth'] || imageWidth * winPixelRatio;
				const naturalHeight =
					value['naturalHeight'] || imageHeight * winPixelRatio;
				const src = value['src'];

				const msrc = image.attributes('src');
				imageArray.push({
					src,
					msrc,
					w: naturalWidth,
					h: naturalHeight,
				});
				if (cardRoot?.equal(imageNode)) {
					rootIndex = index;
				}
			});
		this.pswp.open(imageArray, rootIndex);
	}

	closeZoom() {
		this.pswp?.close();
	}

	renderEditor() {
		const img = this.image.get<HTMLElement>();
		if (!img) return;
		const { clientWidth, clientHeight } = img;

		if (!clientWidth || !clientHeight) {
			return;
		}
		this.maxWidth = this.getMaxWidth();
		this.rate = clientHeight / clientWidth;
		if (isMobile || !isEngine(this.editor) || this.editor.readonly) return;
		// 拖动调整图片大小
		const resizer = new Resizer({
			src: this.src,
			width: clientWidth,
			height: clientHeight,
			rate: this.rate,
			maxWidth: this.maxWidth,
			onChange: ({ width, height }) => this.changeSize(width, height),
		});
		const resizerNode = resizer.render();
		this.root.find('.data-image-detail').append(resizerNode);
		this.resizer = resizer;
		this.resizer.on('dblclick', (event: MouseEvent) =>
			this.openZoom(event),
		);
	}

	destroyEditor() {
		this.resizer?.destroy();
	}

	destroy() {
		window.removeEventListener('resize', this.onWindowResize);
	}

	focus = () => {
		if (!isEngine(this.editor)) {
			return;
		}
		this.root.addClass('data-image-active');
		if (this.status === 'done') {
			this.destroyEditor();
			this.renderEditor();
		}
	};

	blur = () => {
		if (!isEngine(this.editor)) {
			return;
		}
		this.root.removeClass('data-image-active');
		if (this.status === 'done') {
			this.destroyEditor();
		}
	};

	render() {
		//阅读模式不展示错误
		const { container } = this.options;
		if (this.status === 'error' && isEngine(this.editor)) {
			this.root = $(
				this.renderTemplate(
					this.message ||
						this.editor.language.get<string>(
							'image',
							'uploadError',
						),
				),
			);
			this.bindErrorEvent(this.root);
			container.empty().append(this.root);
			this.progress.remove();
			return;
		}
		if (this.status === 'uploading') {
			this.progress.show();
		} else {
			this.progress.remove();
		}
		if (this.status === 'done' && this.isLoad) {
			const contentNode = this.root.find('.data-image-content');
			contentNode.addClass('data-image-loaded');
			contentNode.removeClass('data-image-loading');
		}
		this.maxWidth = this.getMaxWidth();
		let { width, height } = this.size;
		if (isEngine(this.editor) && !this.isLoad) {
			this.image.css('visibility', 'hidden');
		} else if (width && height) {
			if (width > this.maxWidth) {
				width = this.maxWidth;
				height = Math.round((width * height) / this.size.width);
			}
			this.image.css('width', width + 'px');
			this.image.css('height', height + 'px');
			this.image.css('background-color', '#FAFAFA');
			this.image.css('background-repeat', 'no-repeat');
			this.image.css('background-position', 'center');
			this.image.css(
				'background-image',
				"url('data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB3aWR0aD0iMjhweCIgaGVpZ2h0PSIyMnB4IiB2aWV3Qm94PSIwIDAgMjggMjIiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayI+CiAgICA8IS0tIEdlbmVyYXRvcjogU2tldGNoIDU1LjIgKDc4MTgxKSAtIGh0dHBzOi8vc2tldGNoYXBwLmNvbSAtLT4KICAgIDx0aXRsZT5pbWFnZS1maWxs5aSH5Lu9PC90aXRsZT4KICAgIDxkZXNjPkNyZWF0ZWQgd2l0aCBTa2V0Y2guPC9kZXNjPgogICAgPGcgaWQ9Iuafpeeci+WbvueJh+S8mOWMljQuMCIgc3Ryb2tlPSJub25lIiBzdHJva2Utd2lkdGg9IjEiIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCI+CiAgICAgICAgPGcgaWQ9IuWKoOi9veWbvueJhyIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTU3Mi4wMDAwMDAsIC01MDYuMDAwMDAwKSI+CiAgICAgICAgICAgIDxnIGlkPSJpbWFnZS1maWxs5aSH5Lu9IiB0cmFuc2Zvcm09InRyYW5zbGF0ZSg1NzAuMDAwMDAwLCA1MDEuMDAwMDAwKSI+CiAgICAgICAgICAgICAgICA8cmVjdCBpZD0iUmVjdGFuZ2xlIiBmaWxsPSIjMDAwMDAwIiBvcGFjaXR5PSIwIiB4PSIwIiB5PSIwIiB3aWR0aD0iMzIiIGhlaWdodD0iMzIiPjwvcmVjdD4KICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik0yOSw1IEwzLDUgQzIuNDQ2ODc1LDUgMiw1LjQ0Njg3NSAyLDYgTDIsMjYgQzIsMjYuNTUzMTI1IDIuNDQ2ODc1LDI3IDMsMjcgTDI5LDI3IEMyOS41NTMxMjUsMjcgMzAsMjYuNTUzMTI1IDMwLDI2IEwzMCw2IEMzMCw1LjQ0Njg3NSAyOS41NTMxMjUsNSAyOSw1IFogTTEwLjU2MjUsOS41IEMxMS42NjU2MjUsOS41IDEyLjU2MjUsMTAuMzk2ODc1IDEyLjU2MjUsMTEuNSBDMTIuNTYyNSwxMi42MDMxMjUgMTEuNjY1NjI1LDEzLjUgMTAuNTYyNSwxMy41IEM5LjQ1OTM3NSwxMy41IDguNTYyNSwxMi42MDMxMjUgOC41NjI1LDExLjUgQzguNTYyNSwxMC4zOTY4NzUgOS40NTkzNzUsOS41IDEwLjU2MjUsOS41IFogTTI2LjYyMTg3NSwyMy4xNTkzNzUgQzI2LjU3ODEyNSwyMy4xOTY4NzUgMjYuNTE4NzUsMjMuMjE4NzUgMjYuNDU5Mzc1LDIzLjIxODc1IEw1LjUzNzUsMjMuMjE4NzUgQzUuNCwyMy4yMTg3NSA1LjI4NzUsMjMuMTA2MjUgNS4yODc1LDIyLjk2ODc1IEM1LjI4NzUsMjIuOTA5Mzc1IDUuMzA5Mzc1LDIyLjg1MzEyNSA1LjM0Njg3NSwyMi44MDYyNSBMMTAuNjY4NzUsMTYuNDkzNzUgQzEwLjc1NjI1LDE2LjM4NzUgMTAuOTE1NjI1LDE2LjM3NSAxMS4wMjE4NzUsMTYuNDYyNSBDMTEuMDMxMjUsMTYuNDcxODc1IDExLjA0Mzc1LDE2LjQ4MTI1IDExLjA1MzEyNSwxNi40OTM3NSBMMTQuMTU5Mzc1LDIwLjE4MTI1IEwxOS4xLDE0LjMyMTg3NSBDMTkuMTg3NSwxNC4yMTU2MjUgMTkuMzQ2ODc1LDE0LjIwMzEyNSAxOS40NTMxMjUsMTQuMjkwNjI1IEMxOS40NjI1LDE0LjMgMTkuNDc1LDE0LjMwOTM3NSAxOS40ODQzNzUsMTQuMzIxODc1IEwyNi42NTkzNzUsMjIuODA5Mzc1IEMyNi43NDA2MjUsMjIuOTEyNSAyNi43MjgxMjUsMjMuMDcxODc1IDI2LjYyMTg3NSwyMy4xNTkzNzUgWiIgaWQ9IlNoYXBlIiBmaWxsPSIjRThFOEU4Ij48L3BhdGg+CiAgICAgICAgICAgIDwvZz4KICAgICAgICA8L2c+CiAgICA8L2c+Cjwvc3ZnPg==')",
			);
		}

		this.image.on('load', () => this.imageLoadCallback());
		this.image.on('error', () => this.imageLoadError());
		container.append(this.root);
		if (isEngine(this.editor) || !this.root.inEditor()) {
			if (!isMobile) {
				this.root.on('mouseenter', () => {
					this.maximize.show();
				});
				this.root.on('mouseleave', () => {
					this.maximize.hide();
				});
			}
			if (!isEngine(this.editor)) {
				const link = this.image.closest('a');
				if (link.length === 0) {
					this.image.on('click', (event) => this.openZoom(event));
				}
			}
			// 无链接
			this.image.on('dblclick', (event) => this.openZoom(event));
			this.maximize.on('click', (event) => this.openZoom(event));
		}

		// 避免图片抖动，让加载过程比较好看
		if (!/^data:image\//i.test(this.src)) {
			const isLoaded = !!this.image.get<HTMLElement>()?.clientHeight;
			// 只有在上传过程中加背景
			if (this.status === 'uploading' && !isLoaded) {
				this.detail.css('background-color', '#F5F5F5');
			}
			// 图片比编辑器大
			const { width, height } = this.size;
			if (!width || width > this.maxWidth) {
				this.detail.css('width', `${this.maxWidth}px`);
				// 图片比编辑器小
			} else {
				if (width) {
					this.detail.css('width', `${width}px`);
				} else if (!isLoaded) {
					this.detail.css('width', '300px');
				}

				if (height) {
					this.detail.css('height', `${height}px`);
				} else if (!isLoaded) {
					this.detail.css('height', '200px');
				}
			}
		}
	}
}

export default Image;
