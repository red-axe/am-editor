import {
	$,
	File,
	isAndroid,
	isEngine,
	NodeInterface,
	Plugin,
	random,
	READY_CARD_KEY,
	getExtensionName,
	SchemaInterface,
	PluginOptions,
	CARD_VALUE_KEY,
	decodeCardValue,
	encodeCardValue,
	removeUnit,
	CardType,
} from '@aomao/engine';
import { ImageOptions } from '.';
import ImageComponent, { ImageValue } from './component';

export interface ImageUploaderOptions extends PluginOptions {
	/**
	 * 文件上传配置
	 */
	file: {
		/**
		 * 文件上传地址
		 */
		action: string;
		/**
		 * 数据返回类型，默认 json
		 */
		type?: '*' | 'json' | 'xml' | 'html' | 'text' | 'js';
		/**
		 * 图片文件上传时 FormData 的名称，默认 file
		 */
		name?: string;
		/**
		 * 额外携带数据上传
		 */
		data?: {};
		/**
		 * 请求类型，默认 multipart/form-data;
		 */
		contentType?: string;
		/**
		 * 图片接收的格式，默认 "svg","png","bmp","jpg","jpeg","gif","tif","tiff","emf","webp"
		 */
		accept?: string | Array<string>;
		/**
		 * 是否跨域
		 */
		crossOrigin?: boolean;
		/**
		 * https://developer.mozilla.org/zh-CN/docs/Web/API/XMLHttpRequest/withCredentials
		 */
		withCredentials?: boolean;
		/**
		 * 请求头
		 */
		headers?:
			| { [key: string]: string }
			| (() => { [key: string]: string })
			| (() => { [key: string]: string });
		/**
		 * 文件选择限制数量
		 */
		multiple?: boolean | number;
		/**
		 * 上传大小限制，默认 1024 * 1024 * 5 就是5M
		 */
		limitSize?: number;
	};
	remote: {
		/**
		 * 是否跨域
		 */
		crossOrigin?: boolean;
		/**
		 * https://developer.mozilla.org/zh-CN/docs/Web/API/XMLHttpRequest/withCredentials
		 */
		withCredentials?: boolean;
		/**
		 * 请求头
		 */
		headers?: { [key: string]: string } | (() => { [key: string]: string });
		/**
		 * 上传地址
		 */
		action: string;
		/**
		 * 数据返回类型，默认 json
		 */
		type?: '*' | 'json' | 'xml' | 'html' | 'text' | 'js';
		/**
		 * 额外携带数据上传
		 */
		data?: {};
		/**
		 * 图片地址上传时请求参数的名称，默认 url
		 */
		name?: string;
		/**
		 * 请求类型，默认 multipart/form-data;
		 */
		contentType?: string;
	};
	/**
	 * Markdown
	 */
	markdown?: boolean;
	/**
	 * 解析上传后的Respone，返回 result:是否成功，data:成功：图片地址，失败：错误信息
	 */
	parse?: (response: any) => {
		result: boolean;
		data: string;
	};
	/**
	 * 是否是第三方图片地址，如果是，那么地址将上传服务器下载图片
	 */
	isRemote?: (src: string) => boolean;
}

export default class<
	T extends ImageUploaderOptions = ImageUploaderOptions,
> extends Plugin<T> {
	private cardComponents: { [key: string]: ImageComponent<ImageValue> } = {};
	private loadCounts: { [key: string]: number } = {};

	static get pluginName() {
		return 'image-uploader';
	}

	extensionNames = [
		'svg',
		'png',
		'bmp',
		'jpg',
		'jpeg',
		'gif',
		'tif',
		'tiff',
		'emf',
		'webp',
	];

	init() {
		if (isEngine(this.editor)) {
			this.editor.on('keydown:space', (event) => this.markdown(event));
			this.editor.on('drop:files', (files) => this.dropFiles(files));
			this.editor.on('paste:event', ({ files }) =>
				this.pasteFiles(files),
			);
			this.editor.on('paste:schema', (schema) =>
				this.pasteSchema(schema),
			);
			this.editor.on('paste:each', (node) => this.pasteEach(node));
			this.editor.on('paste:after', () => this.pasteAfter());
			this.editor.on(
				'paste:markdown-check',
				(child) => !this.checkMarkdown(child)?.match,
			);
			this.editor.on('paste:markdown', (child) =>
				this.pasteMarkdown(child),
			);
		}
		let { accept } = this.options.file || {};
		const names: Array<string> = [];
		if (typeof accept === 'string') accept = accept.split(',');

		(accept || []).forEach((name) => {
			name = name.trim();
			const newName = name.split('.').pop();
			if (newName) names.push(newName);
		});
		if (names.length > 0) this.extensionNames = names;
	}

	isImage(file: File) {
		const name = getExtensionName(file);
		return this.extensionNames.indexOf(name) >= 0;
	}

	dataURIToFile(dataURI: string) {
		// convert base64/URLEncoded data component to raw binary data held in a string
		let byteString;

		if (dataURI.split(',')[0].indexOf('base64') >= 0) {
			byteString = atob(dataURI.split(',')[1]);
		} else {
			byteString = unescape(dataURI.split(',')[1]);
		}
		// separate out the mime component
		const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]; // write the bytes of the string to a typed array

		const ia = new Uint8Array(byteString.length);

		for (let i = 0; i < byteString.length; i++) {
			ia[i] = byteString.charCodeAt(i);
		}

		return new Blob([ia], {
			type: mimeString,
		});
	}

	getUrl(value: ImageValue) {
		const imagePlugin = this.editor.plugin.components['image'];
		if (imagePlugin) {
			const { onBeforeRender } = (imagePlugin['options'] || {}) as any;
			if (onBeforeRender) return onBeforeRender(value.status, value.src);
		}
		return value.src;
	}

	loadImage(id: string, value: ImageValue) {
		if (!this.loadCounts[id]) this.loadCounts[id] = 1;
		const image = new Image();

		image.src = this.getUrl(value);
		image.onload = () => {
			delete this.loadCounts[id];
			this.editor.card.update(id, value);
		};
		image.onerror = () => {
			if (this.loadCounts[id] <= 3) {
				setTimeout(() => {
					this.loadCounts[id]++;
					this.loadImage(id, value);
				}, 500);
			} else {
				delete this.loadCounts[id];
				value.status = 'error';
				this.editor.card.update(id, value);
			}
		};
	}

	async execute(files?: Array<File> | string | MouseEvent) {
		if (!isEngine(this.editor)) return;
		const { request, card, language } = this.editor;
		const {
			action,
			data,
			type,
			contentType,
			multiple,
			crossOrigin,
			withCredentials,
			headers,
			name,
		} = this.options.file;
		const { parse } = this.options;
		const limitSize = this.options.file.limitSize || 5 * 1024 * 1024;
		if (!Array.isArray(files) && typeof files !== 'string') {
			files = await request.getFiles({
				event: files,
				accept: isAndroid
					? 'image/*'
					: this.extensionNames.length > 0
					? '.' + this.extensionNames.join(',.')
					: '',
				multiple,
			});
		} else if (typeof files === 'string') {
			this.insertRemote(files);
			return;
		}
		if (files.length === 0) return;
		request.upload(
			{
				url: action,
				crossOrigin,
				withCredentials,
				headers: typeof headers === 'function' ? headers() : headers,
				data,
				type,
				contentType,
				onBefore: (file) => {
					if (file.size > limitSize) {
						this.editor.messageError(
							language
								.get('image', 'uploadLimitError')
								.toString()
								.replace(
									'$size',
									(limitSize / 1024 / 1024).toFixed(0) + 'M',
								),
						);
						return false;
					}
					return true;
				},
				onReady: (fileInfo) => {
					if (
						!isEngine(this.editor) ||
						!!this.cardComponents[fileInfo.uid]
					)
						return;
					const src = fileInfo.src || '';
					const base64String =
						typeof src !== 'string'
							? window.btoa(
									String.fromCharCode(...new Uint8Array(src)),
							  )
							: src;
					const insertCard = (value: Partial<ImageValue>) => {
						const imagePlugin =
							this.editor.plugin.findPlugin<ImageOptions>(
								'image',
							);
						const component = card.insert<
							ImageValue,
							ImageComponent<ImageValue>
						>(
							'image',
							{
								...value,
								status: 'uploading',
								type:
									value.type ||
									imagePlugin?.options?.defaultType,
								//fileInfo.src, 再协作中，如果大图片使用base64加载图片预览会造成很大资源浪费
							},
							base64String,
						);
						this.cardComponents[fileInfo.uid] = component;
					};
					return new Promise<void>((resolve) => {
						const image = new Image();
						image.src = base64String;
						image.onload = () => {
							insertCard({
								src: '',
								size: {
									width: image.width,
									height: image.height,
									naturalHeight: image.naturalHeight,
									naturalWidth: image.naturalWidth,
								},
							});
							resolve();
						};
						image.onerror = () => {
							insertCard({ src: '' });
							resolve();
						};
					});
				},
				onUploading: (file, { percent }) => {
					const component = this.cardComponents[file.uid || ''];
					if (!component) return;
					component.setProgressPercent(percent);
				},
				onSuccess: (response, file) => {
					const component = this.cardComponents[file.uid || ''];
					if (!component) return;
					let src =
						response.url ||
						(response.data && response.data.url) ||
						response.src ||
						(response.data && response.data.src);
					const result = parse
						? parse(response)
						: !!src
						? { result: true, data: src }
						: { result: false };
					if (!result.result) {
						card.update<ImageValue>(component.id, {
							status: 'error',
							message:
								result.data ||
								this.editor.language.get<string>(
									'image',
									'uploadError',
								),
						});
					} else {
						src = result.data;
					}
					const value: any = {
						status: 'done',
					};
					if (src) {
						value.src = src;
						this.loadImage(component.id, value);
					}
					delete this.cardComponents[file.uid || ''];
				},
				onError: (error, file) => {
					const component = this.cardComponents[file.uid || ''];
					if (!component) return;
					card.update<ImageValue>(component.id, {
						status: 'error',
						message:
							error.message ||
							this.editor.language.get<string>(
								'image',
								'uploadError',
							),
					});
					delete this.cardComponents[file.uid || ''];
				},
			},
			files,
			name,
		);
		return;
	}

	dropFiles(files: Array<File>) {
		if (!isEngine(this.editor)) return;
		files = files.filter((file) => this.isImage(file));
		if (files.length === 0) return;
		this.editor.command.execute('image-uploader', files);
		return false;
	}

	pasteSchema(schema: SchemaInterface) {
		schema.add({
			type: 'inline',
			name: 'img',
			isVoid: true,
			attributes: {
				src: {
					required: true,
					value: '@url',
				},
				width: '@number',
				height: '@number',
				style: {
					'max-width': '@length',
					'max-height': '@length',
					width: '@length',
					height: '@length',
				},
				alt: '*',
				title: '*',
				'data-size': '@number',
				'data-width': '@number',
				'data-height': '@number',
			},
		});
	}

	pasteFiles(files: Array<File>) {
		if (!isEngine(this.editor)) return;
		files = files.filter((file) => this.isImage(file));
		if (files.length === 0) return;
		this.editor.command.execute('image-uploader', files);
		return false;
	}

	pasteEach(node: NodeInterface) {
		const { isRemote } = this.options;
		//是卡片，并且还没渲染
		if (node.isCard() && node.attributes(READY_CARD_KEY)) {
			if (node.attributes(READY_CARD_KEY) !== 'image') return;
			const value = decodeCardValue(node.attributes(CARD_VALUE_KEY));
			if (!value || !value.src) {
				node.remove();
				return;
			}
			//第三方图片，设置上传状态
			if (isRemote && isRemote(value.src)) {
				value.status = 'uploading';
				value.percent = 0;
				this.editor.card.replaceNode(node, 'image', value);
			} else if (value.status === 'uploading') {
				//如果是上传状态，设置为正常状态
				value.percent = 0;
				node.attributes(
					CARD_VALUE_KEY,
					encodeCardValue({ ...value, status: 'done' }),
				);
			}
			return;
		}
		//图片带链接
		/**
        if(node.name === "a" && node.find("img").length > 0){
            const img = node.find("img")
            const href = node.attributes("href")
            const target = node.attributes("target")
            const src = img.attributes("src") || img.attributes("data-src")
            const alt = img.attributes("alt")
            if(!src) {
                node.remove()
                return
            }
            this.editor.card.replaceNode(node,"image",{
                src,
                status:isRemote && isRemote(src) || /^data:image\//i.test(src) ? "uploading" : "done",
                alt,
                link:{
                    href,
                    target
                },
                percent:0
            })
        } */
		//图片
		if (node.name === 'img') {
			const attributes = node.attributes();
			const src = attributes['src'] || attributes['data-src'];
			const alt = attributes['alt'];
			if (!src) {
				node.remove();
				return;
			}
			const imagePlugin =
				this.editor.plugin.findPlugin<ImageOptions>('image');
			const width = node.css('width');
			const height = node.css('height');
			const dataTypeValue =
				attributes['data-type'] || imagePlugin?.options.defaultType;
			let type = CardType.INLINE;
			if (dataTypeValue === 'block') {
				const parent = node.parent();
				// 移除转换为html的时候加载的额外p标签
				if (parent && parent.name === 'p') {
					this.editor.node.unwrap(node);
				}
				type = CardType.BLOCK;
			}

			this.editor.card.replaceNode(node, 'image', {
				type,
				src,
				status:
					(isRemote && isRemote(src)) || /^data:image\//i.test(src)
						? 'uploading'
						: 'done',
				alt,
				percent: 0,
				size: {
					width: removeUnit(width),
					height: removeUnit(height),
				},
			});
			node.remove();
		}
	}

	uploadAddress(src: string, component: ImageComponent) {
		if (!isEngine(this.editor)) return;
		const {
			action,
			type,
			data,
			contentType,
			crossOrigin,
			withCredentials,
			headers,
			name,
		} = this.options.remote;
		const { parse } = this.options;
		const addressName = name || 'url';
		this.editor.request.ajax({
			url: action,
			method: 'POST',
			contentType: contentType || 'application/json',
			type: type === undefined ? 'json' : type,
			crossOrigin,
			withCredentials,
			headers: typeof headers === 'function' ? headers() : headers,
			data: {
				...data,
				[addressName]: src,
			},
			success: (response) => {
				let src =
					response.url ||
					(response.data && response.data.url) ||
					response.src ||
					(response.data && response.data.src);

				const result = parse
					? parse(response)
					: !!src
					? { result: true, data: src }
					: { result: false };
				if (!result.result) {
					this.editor.card.update<ImageValue>(component.id, {
						status: 'error',
						message:
							result.data ||
							this.editor.language.get<string>(
								'image',
								'uploadError',
							),
					});
				} else {
					src = result.data;
				}

				const value: any = {
					status: 'done',
				};
				if (src) {
					value.src = src;
					this.loadImage(component.id, value);
				}
			},
			error: (error) => {
				this.editor.card.update<ImageValue>(component.id, {
					status: 'error',
					message:
						error.message ||
						this.editor.language.get<string>(
							'image',
							'uploadError',
						),
				});
			},
		});
	}

	insertRemote(src: string, alt?: string) {
		const imagePlugin =
			this.editor.plugin.findPlugin<ImageOptions>('image');
		const value: ImageValue = {
			src,
			alt,
			status: 'uploading',
			type: imagePlugin?.options.defaultType || CardType.INLINE,
		};
		const { isRemote } = this.options;
		//上传第三方图片
		if (isRemote && isRemote(src)) {
			const component = this.editor.card.insert<
				ImageValue,
				ImageComponent<ImageValue>
			>('image', value);
			this.uploadAddress(src, component);
			return;
		}
		//当前图片
		value.status = 'done';
		this.editor.card.insert('image', value);
	}

	pasteAfter() {
		this.editor.container
			.find('[data-card-key=image]')
			.each((node, key) => {
				const component = this.editor.card.find(node) as ImageComponent;
				if (!component || !isEngine(this.editor)) return;
				const value = component.getValue();
				//不是上传状态，或者当前卡片正在执行上传跳过
				if (
					value?.status !== 'uploading' ||
					Object.keys(this.cardComponents).find(
						(key) => this.cardComponents[key].id === component.id,
					)
				) {
					return;
				}

				const { src } = value;
				// 转存 base64 图片
				if (/^data:image\//i.test(src)) {
					const fileBlob = this.dataURIToFile(src);
					const ext = getExtensionName(fileBlob);
					const name = ext ? 'image.'.concat(ext) : 'image';
					const file: File = new globalThis.File([fileBlob], name);
					file.uid = new Date().getTime() + '-' + random();
					this.editor.command.execute('image-uploader', [file]);
					this.cardComponents[file.uid] = component;
					return;
				}
				const { isRemote } = this.options;
				if (isRemote && isRemote(src)) {
					this.uploadAddress(src, component);
				}
			});
	}

	markdown(event: KeyboardEvent) {
		if (!isEngine(this.editor) || this.options.markdown === false) return;
		const { change, node } = this.editor;
		const range = change.range.get();

		if (!range.collapsed || change.isComposing() || !this.markdown) return;
		const cloneRange = range.cloneRange();
		cloneRange.shrinkToTextNode();
		const { startNode } = cloneRange;
		if (!startNode.isText()) return;
		const text = startNode.text();
		const match = /!\[([^\]]{0,})\]\((https?:\/\/[^\)]{5,})\)/.exec(text);
		if (match) {
			cloneRange.setStart(startNode, match.index);
			change.range.select(cloneRange);
			event.preventDefault();
			const splits = match[1].split('|');
			const src = match[2];
			const alignment = splits[1];
			if (alignment === 'center' || alignment === 'right') {
				this.editor.command.execute('alignment', alignment);
			}
			this.insertRemote(src, splits[0]);
		}
	}

	checkMarkdown(node: NodeInterface) {
		if (!isEngine(this.editor) || !this.markdown || !node.isText()) return;

		const text = node.text();
		if (!text) return;
		// 带跳转链接的图片
		let reg =
			/(\[!\[([^\]]{0,})\]\((\S{0,})(https?:\/\/[^\)]{5,})\)\]\(([\S]+?)\))|(!\[([^\]]{0,})\]\((https?:\/\/[^\)]{5,})\))/i;
		let match = reg.exec(text);

		if (!match) {
			// 无跳转链接的图片
			//![aomao-preview](https://user-images.githubusercontent.com/55792257/125074830-62d79300-e0f0-11eb-8d0f-bb96a7775568.png)
			reg = /(!\[([^\]]{0,})\]\((\S{0,})(https?:\/\/[^\)]{5,})\))/i;
			match = reg.exec(text);
		}
		return {
			reg,
			match,
		};
	}

	pasteMarkdown(node: NodeInterface) {
		const result = this.checkMarkdown(node);
		if (!result) return;

		const { isRemote } = this.options;
		let { reg, match } = result;
		if (!match) return;
		let newText = '';
		let textNode = node.clone(true).get<Text>()!;
		const { card } = this.editor;
		while (
			textNode.textContent &&
			(match = reg.exec(textNode.textContent))
		) {
			//从匹配到的位置切断
			let regNode = textNode.splitText(match.index);
			newText += textNode.textContent;
			//从匹配结束位置分割
			textNode = regNode.splitText(match[0].length);
			const isLink = match[0].startsWith('[');
			const alt = match[2] || match[6];
			const src = match[4] || match[8];
			const link = isLink ? match[5] : '';
			const imagePlugin =
				this.editor.plugin.findPlugin<ImageOptions>('image');
			const cardNode = card.replaceNode<ImageValue>($(regNode), 'image', {
				src,
				status:
					(isRemote && isRemote(src)) || /^data:image\//i.test(src)
						? 'uploading'
						: 'done',
				alt,
				percent: 0,
				link: !!link
					? {
							href: link,
							target: isRemote && isRemote(link) ? '_blank' : '',
					  }
					: undefined,
				type: imagePlugin?.options.defaultType || CardType.INLINE,
			});
			regNode.remove();

			newText += cardNode.get<Element>()?.outerHTML;
		}
		newText += textNode.textContent;
		node.text(newText);
	}
}
