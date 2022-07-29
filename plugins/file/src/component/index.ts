import type { FileOptions, FileValue } from '../types';
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
} from '@aomao/engine';
import './index.css';

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

	static get collab() {
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
			if (onBeforeRender) return onBeforeRender(action, url, this.editor);
		}
		return url;
	};

	toolbar() {
		const editor = this.editor;
		const options =
			editor.plugin.findPlugin<FileOptions>('file')?.options ?? {};
		const getItems = () => {
			const items: Array<CardToolbarItemOptions | ToolbarItemOptions> =
				[];
			const value = this.getValue();
			if (!value) return items;
			const { status, preview, download } = value;
			const locale = this.getLocales();
			if (status === 'done') {
				if (!!preview) {
					const onPreview = () => {
						if (options.onPreview)
							options.onPreview(preview, value);
					};
					items.push({
						key: 'preview',
						type: 'button',
						content: '<span class="data-icon data-icon-preview" />',
						title: locale.preview,
						link: !options.onPreview
							? sanitizeUrl(
									this.onBeforeRender('preview', preview),
							  )
							: undefined,
						onClick: options.onPreview ? onPreview : undefined,
					});
				}

				if (!!download) {
					const onDownload = () => {
						if (options.onDownload)
							options.onDownload(download, value);
					};
					items.push({
						key: 'download',
						type: 'button',
						content:
							'<span class="data-icon data-icon-download" />',
						title: locale.download,
						link: !options.onDownload
							? sanitizeUrl(
									this.onBeforeRender('download', download),
							  )
							: undefined,
						onClick: options.onDownload ? onDownload : undefined,
					});
				}

				if (
					!(!isEngine(editor) || editor.readonly) &&
					items.length > 0
				) {
					items.push({
						key: 'separator',
						type: 'separator',
					});
				}
			}

			if (!(!isEngine(editor) || editor.readonly)) {
				items.push({
					key: 'delete',
					type: 'delete',
				});
			}
			return items;
		};
		if (options?.cardToolbars) {
			return options.cardToolbars(getItems(), this.editor);
		}
		return getItems();
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
        <a class="data-file data-file-${status}">
            <span class="data-file-icon">${icon}</span>
            ${percentHtml}
            <span class="data-file-title">${escape(name)}</span>
            ${fileSizeHtml}
        </a>
        `;
	}

	bindErrorEvent(node: NodeInterface) {
		const editor = this.editor;
		const copyNode = node.find('.data-icon-copy');
		copyNode.on('mouseenter', () => {
			Tooltip.show(
				copyNode,
				editor.language.get('image', 'errorMessageCopy').toString(),
			);
		});
		copyNode.on('mouseleave', () => {
			Tooltip.hide();
		});
		copyNode.on('click', (event: MouseEvent) => {
			event.stopPropagation();
			event.preventDefault();
			Tooltip.hide();
			editor.clipboard.copy(this.getValue()?.message || 'Error message');
			editor.messageSuccess(
				'copy',
				editor.language.get('copy', 'success').toString(),
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

	writeHistoryOnValueChange() {
		if (this.loading) return false;
		return;
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
		const editor = this.editor;
		if (isEngine(editor)) {
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
		editor.on('editor:resize', this.onWindowResize);
	}

	renderView() {
		// 默认点击都是下载
		const value = this.getValue();
		const options =
			this.editor.plugin.findPlugin<FileOptions>('file')?.options ?? {};
		const downloadUrl = sanitizeUrl(
			this.onBeforeRender('download', value.download || ''),
		);
		if (options.onDownload) {
			this.container?.on('click', () => {
				options.onDownload!(downloadUrl, value);
			});
		} else {
			this.container?.attributes('target', '_blank');
			this.container?.attributes('href', downloadUrl);
		}
	}

	didUpdate() {
		const value = this.getValue();
		if (value.status === 'done') super.didUpdate();
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
