import type { FileOptions } from '../types';
import {
	$,
	Card,
	CardType,
	NodeInterface,
	escape,
	sanitizeUrl,
	CardToolbarItemOptions,
	ToolbarItemOptions,
	getFileSize,
	isEngine,
	Tooltip,
	SelectStyleType,
	CardValue,
} from '@aomao/engine';
import './index.css';

export interface FileValue extends CardValue {
	/**
	 *  文件名称
	 */
	name: string;
	/**
	 * 文件大小
	 */
	size?: number;
	/**
	 * 状态
	 * uploading 上传中
	 * done 上传成功
	 */
	status?: 'uploading' | 'done' | 'error';
	/**
	 * 文件地址
	 */
	url?: string;
	/**
	 * 预览地址
	 */
	preview?: string;
	/**
	 * 下载地址
	 */
	download?: string;
	/**
	 * 上传进度
	 */
	percent?: number;
	/**
	 * 错误状态下的错误信息
	 */
	message?: string;
}

export default class FileCard<V extends FileValue = FileValue> extends Card<V> {
	static get cardName() {
		return 'file';
	}

	static get cardType() {
		return CardType.INLINE;
	}

	static get selectStyleType() {
		return SelectStyleType.BACKGROUND;
	}

	static get autoSelected() {
		return false;
	}

	private container?: NodeInterface;

	getLocales() {
		return this.editor.language.get<{ [key: string]: string }>('file');
	}

	getMaxWidth = () => {
		const block = this.editor.block.closest(this.root);
		const sizeElement = this.root.find('.data-file-size');
		return (
			block.get<Element>()!.clientWidth -
			36 -
			(sizeElement?.get<Element>()?.clientWidth || 0)
		);
	};

	onWindowResize = () => {
		this.updateMaxWidth();
	};

	updateMaxWidth = () => {
		const maxWidth = this.getMaxWidth();
		this.root
			.find('.data-file-title')
			.css('max-width', Math.max(maxWidth, 0) + 'px');
	};

	onBeforeRender = (action: 'preview' | 'download', url: string) => {
		const filePlugin = this.editor.plugin.findPlugin<FileOptions>('file');
		if (filePlugin) {
			const { onBeforeRender } = filePlugin.options || {};
			if (onBeforeRender) return onBeforeRender(action, url);
		}
		return url;
	};

	previewFile = () => {
		const value = this.getValue();
		if (!value?.preview) return;
		const { preview } = value;
		window.open(sanitizeUrl(this.onBeforeRender('preview', preview)));
	};

	downloadFile = () => {
		const value = this.getValue();
		if (!value?.download) return;
		const { download } = value;
		window.open(sanitizeUrl(this.onBeforeRender('download', download)));
	};

	toolbar() {
		const items: Array<CardToolbarItemOptions | ToolbarItemOptions> = [];
		const value = this.getValue();
		if (!value) return items;
		const { status, preview, download } = value;
		const locale = this.getLocales();
		if (status === 'done') {
			if (!!preview) {
				items.push({
					type: 'button',
					content: '<span class="data-icon data-icon-preview" />',
					title: locale.preview,
					onClick: this.previewFile,
				});
			}

			if (!!download) {
				items.push({
					type: 'button',
					content: '<span class="data-icon data-icon-download" />',
					title: locale.download,
					onClick: this.downloadFile,
				});
			}

			if (
				!(!isEngine(this.editor) || this.editor.readonly) &&
				items.length > 0
			) {
				items.push({
					type: 'separator',
				});
			}
		}

		if (!(!isEngine(this.editor) || this.editor.readonly)) {
			items.push({
				type: 'delete',
			});
		}
		return items;
	}

	renderTemplate(value: FileValue) {
		const { name, status, message, percent, size } = value;
		const locales = this.getLocales();
		if (status === 'error') {
			return `<span class="data-file-error"><span class="data-icon data-icon-error"></span>${
				message || locales['loadError']
			}<span class="data-icon data-icon-copy"></span></span>`;
		}

		let icon = '<span class="data-icon data-icon-attachment"></span>';

		if (status === 'uploading') {
			icon = `<i class="data-anticon">
                        <svg viewBox="0 0 1024 1024" class="data-anticon-spin" data-icon="loading" width="1em" height="1em" fill="currentColor" aria-hidden="true">
                            <path d="M988 548c-19.9 0-36-16.1-36-36 0-59.4-11.6-117-34.6-171.3a440.45 440.45 0 0 0-94.3-139.9 437.71 437.71 0 0 0-139.9-94.3C629 83.6 571.4 72 512 72c-19.9 0-36-16.1-36-36s16.1-36 36-36c69.1 0 136.2 13.5 199.3 40.3C772.3 66 827 103 874 150c47 47 83.9 101.8 109.7 162.7 26.7 63.1 40.2 130.2 40.2 199.3.1 19.9-16 36-35.9 36z"></path>
                        </svg>
                    </i>
                    `;
		}

		let fileSizeHtml = '';
		const fileSize: string = size ? getFileSize(size) : '';

		if (!!fileSize) {
			fileSizeHtml = `<span class="data-file-size">(${escape(
				fileSize,
			)})</span>`;
		}

		let percentHtml = '';
		if (status === 'uploading')
			percentHtml = `<span class="percent">${percent || 0}%</span>`;

		return `
        <span class="data-file data-file-${status}">
            <span class="data-file-icon">${icon}</span>
            ${percentHtml}
            <span class="data-file-title">${escape(name)}</span>
            ${fileSizeHtml}
        </span>
        `;
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
		copyNode.on('click', (event: MouseEvent) => {
			event.stopPropagation();
			event.preventDefault();
			Tooltip.hide();
			this.editor.clipboard.copy(
				this.getValue()?.message || 'Error message',
			);
			this.editor.messageSuccess(
				this.editor.language.get('copy', 'success').toString(),
			);
		});
	}

	setProgressPercent(percent: number) {
		this.container?.find('.percent').html(`${percent}%`);
		this.setValue({
			percent,
		} as V);
	}

	onActivate(activated: boolean) {
		if (activated) this.container?.addClass('data-file-active');
		else this.container?.removeClass('data-file-active');
	}

	render(): string | void | NodeInterface {
		const value = this.getValue();
		if (!value) return;
		if (!this.container || this.container.length === 0) {
			this.container = $(this.renderTemplate(value));
			this.getCenter().empty().append(this.container);
		} else {
			this.container = this.getCenter().first()!;
		}

		if (isEngine(this.editor)) {
			this.container.attributes('draggable', 'true');
		} else {
			this.renderView();
		}
		if (value.status === 'error') {
			this.bindErrorEvent(this.root);
		}
		this.container?.find('.percent').html(`${value.percent}%`);
		this.updateMaxWidth();
		window.addEventListener('resize', this.onWindowResize);
		this.editor.on('editor:resize', this.onWindowResize);
	}

	renderView() {
		// 默认点击都是下载
		this.container?.on('click', this.downloadFile);
	}

	didUpdate() {
		super.didUpdate();
		this.toolbarModel?.getContainer()?.remove();
		this.toolbarModel?.create();
	}

	destroy = () => {
		super.destroy();
		this.container = undefined;
		window.removeEventListener('resize', this.onWindowResize);
		this.editor.off('editor:resize', this.onWindowResize);
	};
}
