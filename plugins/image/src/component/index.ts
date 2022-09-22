import type { ImageOptions } from '@/types';
import {
	Card,
	CardToolbarItemOptions,
	CardType,
	CardValue,
	isEngine,
	isMobile,
	NodeInterface,
	ToolbarItemOptions,
} from '@aomao/engine';
import Image, { Size } from './image';

export interface ImageValue extends CardValue {
	/**
	 *  图片地址
	 */
	src: string;
	/**
	 * 位置
	 */
	align?: string;
	/**
	 * 状态
	 * uploading 上传中
	 * done 上传成功
	 */
	status?: 'uploading' | 'done' | 'error';
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
	 * 上传进度
	 */
	percent?: number;
	/**
	 * 错误状态下的错误信息
	 */
	message?: string;
	/**
	 * 图片大小
	 */
	size?: {
		/**
		 * 图片展示宽度
		 */
		width: number;
		/**
		 * 图片展示高度
		 */
		height: number;
		/**
		 * 图片真实宽度
		 */
		naturalWidth: number;
		/**
		 * 图片真实高度
		 */
		naturalHeight: number;
	};
}

class ImageComponent<T extends ImageValue = ImageValue> extends Card<T> {
	protected image?: Image;
	protected widthInput?: NodeInterface;
	protected heightInput?: NodeInterface;
	protected isLocalError?: boolean;

	static get cardName() {
		return 'image';
	}

	static get cardType() {
		return CardType.INLINE;
	}

	static get collab() {
		return false;
	}
	// static get autoSelected() {
	// 	return false;
	// }

	/**
	 * 设置上传进度
	 * @param percent 进度百分比
	 */
	setProgressPercent(percent: number) {
		this.image?.setProgressPercent(percent);
		this.setValue({
			percent,
		} as T);
	}

	setSize(size: Size, loaded?: boolean) {
		if (!size.width || !size.height) return;
		const value = this.getValue();
		if (
			!loaded ||
			!value.size ||
			!value.size.height ||
			!value.size.width ||
			!value.size.naturalWidth ||
			!value.size.naturalHeight
		)
			this.setValue({ size } as T);
		if (this.widthInput) {
			this.widthInput.get<HTMLInputElement>()!.value =
				size.width.toString();
		}
		if (this.heightInput) {
			this.heightInput.get<HTMLInputElement>()!.value =
				size.height.toString();
		}
	}

	onInputChange(width: string | number, height: string | number) {
		const value = this.getValue();
		if (typeof width === 'string') {
			if (!/^[1-9]+(\d+)?$/.test(width) && this.widthInput) {
				width = value?.size?.width || value?.size?.naturalWidth || 0;
				this.widthInput.get<HTMLInputElement>()!.value =
					width.toString();
			}
			width = parseInt(width.toString(), 10);
		}
		if (typeof height === 'string') {
			if (!/^[1-9]+(\d+)?$/.test(height) && this.heightInput) {
				height = value?.size?.height || value?.size?.naturalHeight || 0;
				this.heightInput.get<HTMLInputElement>()!.value =
					height.toString();
			}
			height = parseInt(height.toString(), 10);
		}
		this.image?.changeSize(parseInt(width.toString(), 10), height);
	}

	toolbar(): Array<CardToolbarItemOptions | ToolbarItemOptions> {
		const editor = this.editor;
		const getItems = (): Array<
			CardToolbarItemOptions | ToolbarItemOptions
		> => {
			if (!isEngine(editor) || editor.readonly) return [];
			const { language } = editor;
			let value = this.getValue();
			if (this.isLocalError === true || value?.status !== 'done')
				return [
					{
						key: 'delete',
						type: 'delete',
					},
				];

			const items: Array<CardToolbarItemOptions | ToolbarItemOptions> = [
				{
					key: 'copy',
					type: 'copy',
				},
				{
					key: 'delete',
					type: 'delete',
				},
			];
			if (isMobile) return items;
			const resizerItems: (
				| CardToolbarItemOptions
				| ToolbarItemOptions
			)[] = [
				{
					key: 'width',
					type: 'input',
					placeholder: language
						.get('image', 'toolbbarWidthTitle')
						.toString(),
					prefix: 'W:',
					value: value?.size?.width || 0,
					didMount: (node) => {
						this.widthInput = node.find('input[type=input]');
					},
					onChange: (value) => {
						const height = Math.round(
							parseInt(value, 10) * (this.image?.rate || 1),
						);
						this.onInputChange(value, height);
					},
				},
				{
					key: 'height',
					type: 'input',
					placeholder: language
						.get('image', 'toolbbarHeightTitle')
						.toString(),
					prefix: 'H:',
					value: value?.size?.height || 0,
					didMount: (node) => {
						this.heightInput = node.find('input[type=input]');
					},
					onChange: (value) => {
						const width = Math.round(
							parseInt(value, 10) / (this.image?.rate || 1),
						);
						this.onInputChange(width, value);
					},
				},
				{
					key: 'resize',
					type: 'button',
					content:
						'<span class="data-icon data-icon-huanyuan"></span>',
					title: language.get<string>(
						'image',
						'toolbarReductionTitle',
					),
					onClick: () => {
						value = this.getValue();
						this.onInputChange(
							value?.size?.naturalWidth || 0,
							value?.size?.naturalHeight || 0,
						);
					},
				},
			];
			const typeItems: (CardToolbarItemOptions | ToolbarItemOptions)[] = [
				{
					key: 'block',
					type: 'button',
					content:
						'<span class="data-icon data-icon-block-image"></span>',
					title: language.get<string>('image', 'displayBlockTitle'),
					onClick: () => {
						this.type = CardType.BLOCK;
					},
				},
				{
					key: 'inline',
					type: 'button',
					content:
						'<span class="data-icon data-icon-inline-image"></span>',
					title: language.get<string>('image', 'displayInlineTitle'),
					onClick: () => {
						this.type = CardType.INLINE;
					},
				},
			];
			const imagePlugin = editor.plugin.findPlugin<ImageOptions>('image');
			return items.concat([
				...(imagePlugin?.options?.enableResizer === false
					? []
					: resizerItems),
				...(imagePlugin?.options?.enableTypeSwitch === false
					? []
					: typeItems),
			]);
		};
		const options =
			editor.plugin.findPlugin<ImageOptions>('image')?.options;
		if (options?.cardToolbars) {
			return options.cardToolbars(getItems(), this.editor);
		}
		return getItems();
	}

	onActivate(activated: boolean) {
		super.onActivate(activated);
		if (activated && !this.selectedByOther) this.image?.focus();
		else this.image?.blur();
	}

	onSelectByOther(
		selected: boolean,
		value?: {
			color: string;
			rgb: string;
		},
	): NodeInterface | void {
		this.image?.root?.css(
			'outline',
			selected ? '2px solid ' + value!.color : '',
		);
		const className = 'card-selected-other';
		if (selected) this.root.addClass(className);
		else this.root.removeClass(className);
		return this.image?.root;
	}

	writeHistoryOnValueChange() {
		if (this.loading) return false;
		return;
	}

	render(loadingBg?: string): string | void | NodeInterface {
		const value = this.getValue();
		if (!value) return;
		const editor = this.editor;
		if (!this.image || this.image.root.length === 0) {
			const imagePlugin = editor.plugin.findPlugin<ImageOptions>('image');
			this.image = new Image(editor, {
				root: this.root,
				container: this.getCenter(),
				status: value.status || 'done',
				src: value.src,
				size: value.size,
				alt: value.alt,
				link: value.link,
				display: this.type,
				percent: value.percent,
				message: value.message,
				enableResizer: imagePlugin?.options?.enableResizer,
				onBeforeRender: (status, src) => {
					const imagePlugin =
						editor.plugin.findPlugin<ImageOptions>('image');
					if (imagePlugin) {
						const { onBeforeRender } = imagePlugin.options || {};
						if (onBeforeRender)
							return onBeforeRender(status, src, this.editor);
					}
					return src;
				},
				onChange: (size, loaded) => {
					if (isEngine(editor) && !editor.readonly && size)
						this.setSize(size, loaded);
				},
				onError: () => {
					this.isLocalError = true;
					this.didUpdate();
				},
				onLoad: () => {
					if (
						this.image?.size &&
						(!value.size?.naturalHeight ||
							!value.size?.naturalWidth)
					) {
						const { naturalHeight, naturalWidth } = this.image.size;
						this.setSize(
							{
								...value.size,
								naturalHeight,
								naturalWidth,
							} as Size,
							true,
						);
					}
					if (this.activated) this.image?.focus();
				},
				maxHeight: imagePlugin?.options?.maxHeight,
			});
		} else {
			this.image.changeUrl(value.src);
			this.image.status = value.status || 'done';
			this.image.message = value.message;
			this.image.size.width = value.size?.width || 0;
			this.image.size.height = value.size?.height || 0;
			if (value.percent) this.image.setProgressPercent(value.percent);
			this.image.resizer?.destroy();
		}
		this.image.render(loadingBg);
	}

	didUpdate() {
		super.didUpdate();
		this.toolbarModel?.getContainer()?.remove();
		this.toolbarModel?.create();
		this.toolbarModel?.setDefaultAlign('top');
	}

	didRender() {
		const value = this.getValue();
		if (value.status === 'done') super.didRender();
		this.toolbarModel?.setDefaultAlign('top');
	}
}

export default ImageComponent;
