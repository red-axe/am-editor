import {
	Card,
	CardToolbarItemOptions,
	CardType,
	isEngine,
	isMobile,
	NodeInterface,
	ToolbarItemOptions,
} from '@aomao/engine';
import Image, { Size } from './image';

export type ImageValue = {
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
};

class ImageComponent extends Card<ImageValue> {
	private image?: Image;
	private widthInput?: NodeInterface;
	private heightInput?: NodeInterface;
	private isLocalError?: boolean;

	static get cardName() {
		return 'image';
	}

	static get cardType() {
		return CardType.INLINE;
	}

	static get autoSelected() {
		return false;
	}

	/**
	 * 设置上传进度
	 * @param percent 进度百分比
	 */
	setProgressPercent(percent: number) {
		this.image?.setProgressPercent(percent);
	}

	setSize(size: Size) {
		this.setValue({ size } as ImageValue);
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
		if (!isEngine(this.editor) || this.editor.readonly) return [];
		const { language } = this.editor;
		let value = this.getValue();
		if (this.isLocalError === true || value?.status === 'error')
			return [
				{
					type: 'delete',
				},
			];

		const items: Array<CardToolbarItemOptions | ToolbarItemOptions> = [
			{
				type: 'copy',
			},
			{
				type: 'delete',
			},
		];
		if (isMobile) return items;

		return items.concat([
			{
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
				type: 'button',
				content: '<span class="data-icon data-icon-huanyuan"></span>',
				title: language.get<string>('image', 'toolbarReductionTitle'),
				onClick: () => {
					value = this.getValue();
					this.onInputChange(
						value?.size?.naturalWidth || 0,
						value?.size?.naturalHeight || 0,
					);
				},
			},
			{
				type: 'button',
				content:
					'<span class="data-icon data-icon-block-image"></span>',
				title: language.get<string>('image', 'displayBlockTitle'),
				onClick: () => {
					this.type = CardType.BLOCK;
				},
			},
			{
				type: 'button',
				content:
					'<span class="data-icon data-icon-inline-image"></span>',
				title: language.get<string>('image', 'displayInlineTitle'),
				onClick: () => {
					this.type = CardType.INLINE;
				},
			},
		]);
	}

	onSelect(selected: boolean) {
		//选中时不使用边框样式
		if (!this.activated) super.onSelect(selected);
	}

	onActivate(activated: boolean) {
		super.onActivate(activated);
		if (activated) this.image?.focus();
		else this.image?.blur();
	}

	render(): string | void | NodeInterface {
		const value = this.getValue();
		if (!value) return;
		if (!this.image) {
			this.image = new Image(this.editor, {
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
				onBeforeRender: (status, src) => {
					const imagePlugin = this.editor.plugin.components['image'];
					if (imagePlugin) {
						const { onBeforeRender } = imagePlugin['options'] || {};
						if (onBeforeRender) return onBeforeRender(status, src);
					}
					return src;
				},
				onChange: (size) => {
					if (size) this.setSize(size);
					if (this.type === CardType.BLOCK && this.image) {
						const maxWidth = this.image.getMaxWidth();
						const offset = (maxWidth - this.image.root.width()) / 2;
						this.toolbarModel?.setOffset([
							-offset - 12,
							0,
							-offset - 12,
							0,
						]);
						if (this.activated)
							this.toolbarModel?.showCardToolbar();
					}
				},
				onError: () => {
					this.isLocalError = true;
					this.didUpdate();
				},
			});
		} else {
			this.image.changeUrl(value.src);
			this.image.status = value.status || 'done';
			this.image.message = value.message;
			this.image.size.width = value.size?.width || 0;
			this.image.size.height = value.size?.height || 0;
		}
		this.image.render();
	}

	didUpdate() {
		this.toolbarModel?.getContainer()?.remove();
		this.toolbarModel?.create();
	}

	didRender() {
		if (this.type === CardType.INLINE) {
			this.toolbarModel?.setOffset([-12, 0, -12, 0]);
		}
	}
}

export default ImageComponent;
