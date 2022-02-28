import { VideoOptions } from '@/types';
import {
	CardToolbarItemOptions,
	ToolbarItemOptions,
	NodeInterface,
	ResizerInterface,
	CardValue,
	removeUnit,
	CardActiveTrigger,
} from '@aomao/engine';
import {
	$,
	Card,
	CardType,
	escape,
	getFileSize,
	isEngine,
	sanitizeUrl,
	Resizer,
} from '@aomao/engine';
import './index.css';

export type VideoStatus = 'uploading' | 'transcoding' | 'done' | 'error';

export interface VideoValue extends CardValue {
	/**
	 * 视频唯一标识
	 */
	video_id?: string;
	/**
	 *  视频名称
	 */
	name: string;
	/**
	 *  视频地址
	 */
	url: string;
	/**
	 * 下载地址
	 */
	download?: string;
	/**
	 * 视频封面地址
	 */
	cover?: string;
	/**
	 * 状态
	 * uploading 上传中
	 * done 上传成功
	 */
	status?: VideoStatus;
	/**
	 * 上传进度
	 */
	percent?: number;
	/**
	 * 视频大小
	 */
	size?: number;
	/**
	 * 宽度
	 */
	width?: number;
	/**
	 * 高度
	 */
	height?: number;
	/**
	 * 真实宽度
	 */
	naturalWidth?: number;
	/**
	 * 真实高度
	 */
	naturalHeight?: number;
	/**
	 * 错误状态下的错误信息
	 */
	message?: string;
}

class VideoComponent<T extends VideoValue = VideoValue> extends Card<T> {
	maxWidth: number = 0;
	resizer?: ResizerInterface;
	video?: NodeInterface;
	rate: number = 1;
	isLoad: boolean = false;
	container?: NodeInterface;
	videoContainer?: NodeInterface;
	title?: NodeInterface;
	static get cardName() {
		return 'video';
	}

	static get cardType() {
		return CardType.BLOCK;
	}

	static get autoSelected() {
		return false;
	}

	getLocales() {
		return this.editor.language.get<{ [key: string]: string }>('video');
	}

	renderTemplate(value: VideoValue) {
		const { name, status, size, message, percent } = value;
		const locales = this.getLocales();

		const icons = {
			video: `<div class="data-video-icon">
                <svg width="32px" height="24px" viewBox="0 0 32 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"> <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" fill-opacity="0.25"><g transform="translate(-704.000000, -550.000000)" fill="#000000" fill-rule="nonzero">  <g transform="translate(704.000000, 550.000000)">    <g>      <path d="M13.09375,17.30625 L20.65625,12.375 C20.95,12.16875 20.95,11.809375 20.65625,11.603125 L13.09375,6.696875 C12.66875,6.4 12,6.6375 12,7.084375 L12,16.921875 C12,17.365625 12.671875,17.603125 13.09375,17.30625 Z" id="Path"></path>      <path d="M30,0 L2,0 C0.896875,0 0,0.896875 0,2 L0,22 C0,23.103125 0.896875,24 2,24 L30,24 C31.103125,24 32,23.103125 32,22 L32,2 C32,0.896875 31.103125,0 30,0 Z M5.25,21.25 C5.25,21.525 5.025,21.75 4.75,21.75 L2.5,21.75 C2.225,21.75 2,21.525 2,21.25 L2,18.5 C2,18.225 2.225,18 2.5,18 L4.75,18 C5.025,18 5.25,18.225 5.25,18.5 L5.25,21.25 Z M5.25,13.375 C5.25,13.65 5.025,13.875 4.75,13.875 L2.5,13.875 C2.225,13.875 2,13.65 2,13.375 L2,10.625 C2,10.35 2.225,10.125 2.5,10.125 L4.75,10.125 C5.025,10.125 5.25,10.35 5.25,10.625 L5.25,13.375 Z M5.25,5.5 C5.25,5.775 5.025,6 4.75,6 L2.5,6 C2.225,6 2,5.775 2,5.5 L2,2.75 C2,2.475 2.225,2.25 2.5,2.25 L4.75,2.25 C5.025,2.25 5.25,2.475 5.25,2.75 L5.25,5.5 Z M24.75,21.75 L7.25,21.75 L7.25,2.25 L24.75,2.25 L24.75,21.75 Z M30,21.25 C30,21.525 29.775,21.75 29.5,21.75 L27.25,21.75 C26.975,21.75 26.75,21.525 26.75,21.25 L26.75,18.5 C26.75,18.225 26.975,18 27.25,18 L29.5,18 C29.775,18 30,18.225 30,18.5 L30,21.25 Z M30,13.375 C30,13.65 29.775,13.875 29.5,13.875 L27.25,13.875 C26.975,13.875 26.75,13.65 26.75,13.375 L26.75,10.625 C26.75,10.35 26.975,10.125 27.25,10.125 L29.5,10.125 C29.775,10.125 30,10.35 30,10.625 L30,13.375 Z M30,5.5 C30,5.775 29.775,6 29.5,6 L27.25,6 C26.975,6 26.75,5.775 26.75,5.5 L26.75,2.75 C26.75,2.475 26.975,2.25 27.25,2.25 L29.5,2.25 C29.775,2.25 30,2.475 30,2.75 L30,5.5 Z" id="Shape"></path>    </g>  </g></g> </g></svg></div>`,
			spin: `<i class="data-video-anticon"><svg viewBox="0 0 1024 1024" class="data-video-anticon-spin" data-icon="loading" width="1em" height="1em" fill="currentColor" aria-hidden="true"> <path d="M988 548c-19.9 0-36-16.1-36-36 0-59.4-11.6-117-34.6-171.3a440.45 440.45 0 0 0-94.3-139.9 437.71 437.71 0 0 0-139.9-94.3C629 83.6 571.4 72 512 72c-19.9 0-36-16.1-36-36s16.1-36 36-36c69.1 0 136.2 13.5 199.3 40.3C772.3 66 827 103 874 150c47 47 83.9 101.8 109.7 162.7 26.7 63.1 40.2 130.2 40.2 199.3.1 19.9-16 36-35.9 36z"></path></svg></i>`,
			warn: `<div class="data-video-icon"><svg width="41px" height="29px" viewBox="0 0 41 29" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"> <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"><g transform="translate(-704.000000, -550.000000)">  <g id="Group-2" transform="translate(704.000000, 550.000000)">    <g id="video" fill="#000000" fill-rule="nonzero" opacity="0.449999988">      <path d="M13.09375,17.30625 C12.671875,17.603125 12,17.365625 12,16.921875 L12,7.084375 C12,6.6375 12.66875,6.4 13.09375,6.696875 L20.65625,11.603125 C20.95,11.809375 20.95,12.16875 20.65625,12.375 L13.09375,17.30625 Z M30,0 C31.103125,0 32,0.896875 32,2 L32,22 C32,23.103125 31.103125,24 30,24 L2,24 C0.896875,24 0,23.103125 0,22 L0,2 C0,0.896875 0.896875,0 2,0 L30,0 Z M5.25,21.25 L5.25,18.5 C5.25,18.225 5.025,18 4.75,18 L2.5,18 C2.225,18 2,18.225 2,18.5 L2,21.25 C2,21.525 2.225,21.75 2.5,21.75 L4.75,21.75 C5.025,21.75 5.25,21.525 5.25,21.25 Z M5.25,13.375 L5.25,10.625 C5.25,10.35 5.025,10.125 4.75,10.125 L2.5,10.125 C2.225,10.125 2,10.35 2,10.625 L2,13.375 C2,13.65 2.225,13.875 2.5,13.875 L4.75,13.875 C5.025,13.875 5.25,13.65 5.25,13.375 Z M5.25,5.5 L5.25,2.75 C5.25,2.475 5.025,2.25 4.75,2.25 L2.5,2.25 C2.225,2.25 2,2.475 2,2.75 L2,5.5 C2,5.775 2.225,6 2.5,6 L4.75,6 C5.025,6 5.25,5.775 5.25,5.5 Z M24.75,21.75 L24.75,2.25 L7.25,2.25 L7.25,21.75 L24.75,21.75 Z M30,21.25 L30,18.5 C30,18.225 29.775,18 29.5,18 L27.25,18 C26.975,18 26.75,18.225 26.75,18.5 L26.75,21.25 C26.75,21.525 26.975,21.75 27.25,21.75 L29.5,21.75 C29.775,21.75 30,21.525 30,21.25 Z M30,13.375 L30,10.625 C30,10.35 29.775,10.125 29.5,10.125 L27.25,10.125 C26.975,10.125 26.75,10.35 26.75,10.625 L26.75,13.375 C26.75,13.65 26.975,13.875 27.25,13.875 L29.5,13.875 C29.775,13.875 30,13.65 30,13.375 Z M30,5.5 L30,2.75 C30,2.475 29.775,2.25 29.5,2.25 L27.25,2.25 C26.975,2.25 26.75,2.475 26.75,2.75 L26.75,5.5 C26.75,5.775 26.975,6 27.25,6 L29.5,6 C29.775,6 30,5.775 30,5.5 Z" id="Combined-Shape"></path>    </g>    <g id="error-fill" transform="translate(21.000000, 10.000000)">      <rect id="Rectangle" fill="#000000" opacity="0" x="0" y="0" width="20" height="20"></rect>      <path d="M19.0267927,16.510301 L19.0272631,16.5111171 C19.4269215,17.2064579 18.9263267,18.0729167 18.125,18.0729167 L1.875,18.0729167 C1.07367326,18.0729167 0.573078461,17.2064579 0.973207261,16.510301 L9.0970084,2.44988987 C9.28650026,2.11750251 9.63068515,1.92708333 10,1.92708333 C10.368224,1.92708333 10.7098796,2.11659543 10.9017927,2.447801 L19.0267927,16.510301 Z" id="Path" stroke="#FFFFFF" stroke-width="0.833333333" fill="#FFFFFF"></path>      <path d="M18.6660156,16.71875 L10.5410156,2.65625 C10.4199219,2.44726562 10.2109375,2.34375 10,2.34375 C9.7890625,2.34375 9.578125,2.44726562 9.45898438,2.65625 L1.33398438,16.71875 C1.09375,17.1367188 1.39453125,17.65625 1.875,17.65625 L18.125,17.65625 C18.6054688,17.65625 18.90625,17.1367188 18.6660156,16.71875 Z M9.375,8.125 C9.375,8.0390625 9.4453125,7.96875 9.53125,7.96875 L10.46875,7.96875 C10.5546875,7.96875 10.625,8.0390625 10.625,8.125 L10.625,11.71875 C10.625,11.8046875 10.5546875,11.875 10.46875,11.875 L9.53125,11.875 C9.4453125,11.875 9.375,11.8046875 9.375,11.71875 L9.375,8.125 Z M10,15 C9.48242188,15 9.0625,14.5800781 9.0625,14.0625 C9.0625,13.5449219 9.48242188,13.125 10,13.125 C10.5175781,13.125 10.9375,13.5449219 10.9375,14.0625 C10.9375,14.5800781 10.5175781,15 10,15 Z" id="Shape" fill="#FAAD14" fill-rule="nonzero"></path></g></g></g> </g></svg></div>`,
			error: '<span class="data-error-icon">X</span>',
		};

		if (status === 'error') {
			return `
            <div class="data-video">
                <div class="data-video-content data-video-error">
                    <div class="data-video-center">
                        <div class="data-video-name">${escape(name)}</div>
                        <div class="data-video-message">
                            ${icons.error}
                            ${message || locales['loadError']}
                        </div>
                    </div>
                </div>
            </div>`;
		}

		const fileSize: string = size ? getFileSize(size) : '';
		const titleElement = name
			? `<div class="data-video-title">${escape(name)}</div>`
			: '';
		if (status === 'uploading') {
			return `
            <div class="data-video">
                <div class="data-video-content data-video-uploading">
                    <div class="data-video-center">
                        ${icons.video}
                        <div class="data-video-name">
                        ${escape(name)} (${escape(fileSize)})
                        </div>
                        <div class="data-video-progress">
                            ${icons.spin}
                            <span class="percent">${percent || 0}%<span>
                        </div>
                    </div>
                </div>
            </div>`;
		}
		const isLoading = typeof status === 'undefined';
		if (status === 'transcoding' || isLoading) {
			return `
            <div class="data-video">
                <div class="data-video-content data-video-uploaded">
                    <div class="data-video-center">
                        ${icons.video}
                        <div class="data-video-name">
                        ${escape(name)} (${escape(fileSize)})
                        </div>
                        <div class="data-video-transcoding">
                            ${icons.spin}
                            <span class="transcoding">${
								isLoading
									? locales['loading']
									: locales['transcoding']
							}%<span>
                        </div>
                    </div>
                </div>
            </div>
            `;
		}
		const videoPlugin = this.editor.plugin.components['video'];
		return `
        <div class="data-video">
            <div class="data-video-content data-video-done"></div>
			${
				videoPlugin && (videoPlugin.options as any).showTitle !== false
					? titleElement
					: ''
			}
        </div>
        `;
	}

	onBeforeRender = (action: 'query' | 'download' | 'cover', url: string) => {
		const videoPlugin =
			this.editor.plugin.findPlugin<VideoOptions>('video');
		if (videoPlugin) {
			const { onBeforeRender } = videoPlugin.options || {};
			if (onBeforeRender) return onBeforeRender(action, url);
		}
		return url;
	};

	initPlayer() {
		const value = this.getValue();
		if (!value) return;

		const url = sanitizeUrl(this.onBeforeRender('query', value.url));
		const video = document.createElement('video');
		video.preload = 'metadata';
		video.setAttribute('src', url);
		video.setAttribute('webkit-playsinline', 'webkit-playsinline');
		video.setAttribute('playsinline', 'playsinline');

		const { cover } = value;

		if (cover) {
			video.poster = sanitizeUrl(this.onBeforeRender('cover', cover));
		}
		this.maxWidth = this.getMaxWidth();
		if (value.naturalHeight && value.naturalWidth)
			this.rate = value.naturalHeight / value.naturalWidth;
		const contentElement = this.container?.find('.data-video-content');
		if (!contentElement) return;
		contentElement.append(video);
		contentElement.append($('<div class="data-video-mask" />'));
		this.videoContainer = this.container?.find('.data-video-content');
		video.oncontextmenu = function () {
			return false;
		};
		video.onloadedmetadata = () => {
			const videoPlugin =
				this.editor.plugin.findPlugin<VideoOptions>('video');
			const fullEditor = videoPlugin?.options.fullEditor;
			const fullWidth =
				this.editor.container.width() -
				removeUnit(this.editor.container.css('padding-left')) -
				removeUnit(this.editor.container.css('padding-right'));

			if (!value.naturalWidth) {
				value.naturalWidth = video.videoWidth || this.video?.width();
				this.setValue({
					naturalWidth: value.naturalWidth,
				} as T);
			}
			if (value.naturalWidth && !value.naturalHeight) {
				this.rate =
					(video.videoHeight || this.video?.height() || 1) /
					value.naturalWidth;
			}
			if (typeof fullEditor === 'number') {
				this.rate = fullEditor / fullWidth;
			} else if (fullEditor !== true) {
				this.rate = video.videoHeight / video.videoWidth;
				this.setValue({
					naturalWidth: video.videoWidth,
					naturalHeight: video.videoHeight,
				} as T);
			}
			if (fullEditor && value.naturalWidth) {
				if (
					value.naturalWidth < fullWidth ||
					typeof fullEditor === 'number'
				) {
					const fullHeight = fullWidth * this.rate;
					this.setValue({
						naturalWidth: fullWidth,
						naturalHeight: fullHeight,
					} as T);
				}
			}
			this.resetSize();
		};
		this.video = $(video);
		this.title = this.container?.find('.data-video-title');
		this.resetSize();
		// 一次渲染时序开启 controls 会触发一次内容为空的 window.onerror，疑似 chrome bug
		setTimeout(() => {
			video.controls = true;
			if (!isEngine(this.editor))
				(video as HTMLMediaElement)['controlsList'] = 'nodownload';
		}, 0);
	}

	downloadFile = () => {
		const value = this.getValue();
		if (!value?.download) return;
		window.open(sanitizeUrl(this.onBeforeRender('download', value.url)));
	};

	toolbar() {
		const items: Array<CardToolbarItemOptions | ToolbarItemOptions> = [];
		const value = this.getValue();
		if (!value) return items;
		const { status, download } = value;
		const locale = this.getLocales();
		if (status === 'done') {
			if (!!download) {
				items.push({
					type: 'button',
					content: '<span class="data-icon data-icon-download" />',
					title: locale.download,
					onClick: this.downloadFile,
				});
			}

			if (isEngine(this.editor) && !this.editor.readonly) {
				items.push({
					type: 'copy',
				});
				items.push({
					type: 'separator',
				});
			}
		}

		if (isEngine(this.editor) && !this.editor.readonly) {
			items.push({
				type: 'delete',
			});
		}
		return items;
	}

	setProgressPercent(percent: number) {
		this.container?.find('.percent').html(`${percent}%`);
	}

	getMaxWidth(node: NodeInterface = this.getCenter()) {
		const block = this.editor.block.closest(node).get<HTMLElement>();
		if (!block) return 0;
		return block.clientWidth;
	}

	/**
	 * 重置大小
	 */
	resetSize() {
		if (!this.videoContainer) return;
		const value = this.getValue();
		if (!value) return;
		this.videoContainer.css({
			width: '',
			height: '',
		});
		this.container?.css({
			width: '',
		});

		const video = this.video?.get<HTMLVideoElement>();
		if (!video) return;
		let { width, height, naturalWidth, naturalHeight } = value;
		if (!naturalWidth) {
			naturalWidth = video.videoWidth;
		}
		if (!naturalHeight) {
			naturalHeight = video.videoHeight;
		}

		if (!height) {
			width = naturalWidth;
			height = Math.round(this.rate * width);
		} else if (!width) {
			height = naturalHeight;
			width = Math.round(height / this.rate);
		} else if (width && height) {
			// 修正非正常的比例
			height = Math.round(this.rate * width);
		} else {
			width = naturalWidth;
			height = naturalHeight;
		}

		if (width > this.maxWidth) {
			width = this.maxWidth;
			height = Math.round(width * this.rate);
		}
		this.container?.css({
			width: width > 0 ? `${width}px` : '',
		});
		this.videoContainer.css('width', width > 0 ? `${width}px` : '');
		const videoPlugin =
			this.editor.plugin.findPlugin<VideoOptions>('video');
		const fullEditor = videoPlugin?.options.fullEditor;
		if (typeof fullEditor === 'number')
			this.videoContainer.css('height', height > 0 ? `${height}px` : '');
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
		this.videoContainer?.css({
			width: width > 0 ? `${width}px` : '',
		});
		const videoPlugin =
			this.editor.plugin.findPlugin<VideoOptions>('video');
		const fullEditor = videoPlugin?.options.fullEditor;
		if (typeof fullEditor === 'number') {
			this.videoContainer?.css({
				height: `${height}px`,
			});
		}
		this.container?.css({
			width: width > 0 ? `${width}px` : '',
		});

		this.setValue({
			width,
			height,
		} as T);
		this.resizer?.destroy();
		this.initResizer();
	}

	onWindowResize = () => {
		if (!isEngine(this.editor)) return;
		this.maxWidth = this.getMaxWidth();
		this.resetSize();

		if (this.resizer) {
			this.resizer.maxWidth = this.maxWidth;
			this.resizer.setSize(
				this.videoContainer?.width() || 0,
				this.videoContainer?.height() || 0,
			);
		}
	};

	initResizer() {
		const value = this.getValue();
		if (!value) return;
		let { naturalHeight, naturalWidth, status } = value;
		if (!naturalWidth || status !== 'done') return;
		const { width, height, cover } = value;
		this.maxWidth = this.getMaxWidth();
		if (!naturalHeight) {
			naturalHeight = Math.round(this.rate * naturalWidth);
		} else {
			this.rate = naturalHeight / naturalWidth;
		}
		// 拖动调整视频大小
		const resizer = new Resizer({
			imgUrl: cover,
			width: width || naturalWidth,
			height: height || naturalHeight,
			rate: this.rate,
			maxWidth: this.maxWidth,
			onChange: ({ width, height }) => this.changeSize(width, height),
		});
		this.resizer = resizer;
		const resizerNode = resizer.render();
		this.videoContainer?.append(resizerNode);
	}

	onActivate(activated: boolean) {
		if (activated) {
			this.container?.addClass('data-video-active');
			this.container?.find('.data-video-mask').hide();
			this.initResizer();
		} else {
			this.container?.removeClass('data-video-active');
			this.container?.find('.data-video-mask').show();
			this.resizer?.destroy();
		}
	}

	onSelectByOther(
		selected: boolean,
		value?: {
			color: string;
			rgb: string;
		},
	): NodeInterface | void {
		this.container?.css(
			'outline',
			selected ? '2px solid ' + value!.color : '',
		);
		const className = 'card-selected-other';
		if (selected) this.root.addClass(className);
		else this.root.removeClass(className);
		return this.container;
	}

	checker(
		video_id: string,
		success: (data?: {
			url: string;
			name?: string;
			cover?: string;
			download?: string;
			status?: string;
		}) => void,
		failed: (message: string) => void,
	) {
		const { command } = this.editor;
		const handle = () => {
			command.executeMethod(
				'video-uploader',
				'query',
				video_id,
				(data?: {
					url: string;
					name?: string;
					cover?: string;
					download?: string;
					status?: string;
				}) => {
					if (data && data.status !== 'done')
						setTimeout(handle, 3000);
					else success(data);
				},
				(message: string) => {
					failed(message);
				},
			);
		};
		handle();
	}

	render(): string | void | NodeInterface {
		const value = this.getValue();
		if (!value) return;
		const center = this.getCenter();
		//先清空卡片内容容器
		center.empty();
		const { command, plugin } = this.editor;
		const { video_id, status } = value;
		const locales = this.getLocales();

		this.maxWidth = this.getMaxWidth();
		//阅读模式
		if (!isEngine(this.editor)) {
			if (status === 'done') {
				//设置为加载状态
				this.container = $(
					this.renderTemplate({ ...value, status: undefined }),
				);
				const updateValue = (data?: {
					url: string;
					name?: string;
					cover?: string;
					download?: string;
				}) => {
					const newValue: VideoValue = {
						...value,
						url: !!data?.url ? data.url : value.url,
						name: !!data?.name ? data.name : value.name,
						cover: !!data?.cover ? data.cover : value.cover,
						download: !!data?.download
							? data.download
							: value.download,
					};
					this.container = $(this.renderTemplate(newValue));
					center.empty();
					center.append(this.container);
					this.initPlayer();
				};
				if (plugin.components['video-uploader']) {
					command.executeMethod(
						'video-uploader',
						'query',
						video_id,
						(data?: {
							url: string;
							name?: string;
							cover?: string;
							download?: string;
						}) => {
							updateValue(data);
						},
						(error: string) => {
							this.container = $(
								this.renderTemplate({
									...value,
									status: 'error',
									message: error || locales['loadError'],
								}),
							);
							center.empty();
							center.append(this.container);
						},
					);
				} else {
					updateValue();
				}
				return this.container;
			} else if (status === 'error') {
				return $(
					this.renderTemplate({
						...value,
						message: value.message || locales['loadError'],
					}),
				);
			}
		}
		//转换中
		else if (status === 'transcoding') {
			this.container = $(this.renderTemplate(value));
			if (!video_id) throw 'video id is undefined';
			this.checker(
				video_id,
				(data?: {
					url: string;
					name?: string;
					cover?: string;
					download?: string;
					status?: string;
				}) => {
					const newValue: T = {
						...value,
						url: !!data?.url ? data.url : value.url,
						name: !!data?.name ? data.name : value.name,
						cover: !!data?.cover ? data.cover : value.cover,
						download: !!data?.download
							? data.download
							: value.download,
						status: 'done',
					};
					this.setValue(newValue);
					this.container = $(this.renderTemplate(newValue));
					center.empty();
					center.append(this.container);
					this.initPlayer();
				},
				(error: string) => {
					const newValue: T = {
						...value,
						status: 'error',
						message: error || locales['loadError'],
					};
					this.setValue(newValue);
					this.container = $(this.renderTemplate(newValue));
					center.empty();
					center.append(this.container);
				},
			);
			return this.container;
		}
		//已完成
		else if (status === 'done') {
			//设置为加载状态
			this.container = $(
				this.renderTemplate({ ...value, status: undefined }),
			);
			command.executeMethod(
				'video-uploader',
				'query',
				video_id,
				(data?: {
					url: string;
					name?: string;
					cover?: string;
					download?: string;
				}) => {
					const newValue: VideoValue = {
						...value,
						url: !!data?.url ? data.url : value.url,
						name: !!data?.name ? data.name : value.name,
						cover: !!data?.cover ? data.cover : value.cover,
						download: !!data?.download
							? data.download
							: value.download,
					};
					this.container = $(this.renderTemplate(newValue));
					this.video = this.container.find('video');
					center.empty();
					center.append(this.container);
					this.initPlayer();
				},
				(error: string) => {
					this.container = $(
						this.renderTemplate({
							...value,
							status: 'error',
							message: error || locales['loadError'],
						}),
					);
					center.empty();
					center.append(this.container);
				},
			);
			return this.container;
		} else {
			this.container = $(this.renderTemplate(value));
			return this.container;
		}
	}

	handleClick = (event: MouseEvent) => {
		if (isEngine(this.editor) && !this.activated) {
			this.editor.card.activate(
				this.root,
				CardActiveTrigger.MOUSE_DOWN,
				event,
			);
		}
	};

	didUpdate(): void {
		super.didUpdate();
		this.toolbarModel?.setDefaultAlign('top');
	}

	didRender() {
		super.didRender();
		window.addEventListener('resize', this.onWindowResize);
		this.editor.on('editor:resize', this.onWindowResize);
		this.toolbarModel?.setDefaultAlign('top');
		this.container?.on('mousedown', this.handleClick);
	}

	destroy() {
		super.destroy();
		this.container?.off('mousedown', this.handleClick);
		window.removeEventListener('resize', this.onWindowResize);
		this.editor.off('editor:resize', this.onWindowResize);
	}
}

export default VideoComponent;
