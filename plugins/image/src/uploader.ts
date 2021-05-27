import {
	File,
	isAndroid,
	isEngine,
	NodeInterface,
	Plugin,
	random,
	READY_CARD_KEY,
	getExtensionName,
	SchemaInterface,
} from '@aomao/engine';
import ImageComponent from './component';

export type Options = {
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
	parse?: (
		response: any,
	) => {
		result: boolean;
		data: string;
	};
	/**
	 * 是否是第三方图片地址，如果是，那么地址将上传服务器下载图片
	 */
	isRemote?: (src: string) => boolean;
};

export default class extends Plugin<Options> {
	private cardComponents: { [key: string]: ImageComponent } = {};
	private loadCounts: { [key: string]: number } = {};

	static get pluginName() {
		return 'image-uploader';
	}

	private extensionNames = [
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
			this.editor.on('keydown:enter', event => this.markdown(event));
			this.editor.on('drop:files', files => this.dropFiles(files));
			this.editor.on('paste:event', ({ files }) =>
				this.pasteFiles(files),
			);
			this.editor.on('paste:schema', schema => this.pasteSchema(schema));
			this.editor.on('paste:each', node => this.pasteEach(node));
			this.editor.on('paste:after', () => this.pasteAfter());
			this.editor.on('paste:markdown', child =>
				this.pasteMarkdown(child),
			);
		}
		let { accept } = this.options.file;
		const names: Array<string> = [];
		if (typeof accept === 'string') accept = accept.split(',');

		(accept || []).forEach(name => {
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
		const mimeString = dataURI
			.split(',')[0]
			.split(':')[1]
			.split(';')[0]; // write the bytes of the string to a typed array

		const ia = new Uint8Array(byteString.length);

		for (let i = 0; i < byteString.length; i++) {
			ia[i] = byteString.charCodeAt(i);
		}

		return new Blob([ia], {
			type: mimeString,
		});
	}

	loadImage(id: string, value: { src: string; status: string }) {
		if (!this.loadCounts[id]) this.loadCounts[id] = 1;
		const image = new Image();
		image.src = value.src;
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
				this.editor.card.update(id, value);
			}
		};
	}

	async waiting(): Promise<void> {
		const check = () => {
			return Object.keys(this.cardComponents).every(key => {
				const component = this.cardComponents[key];
				const value = component.getValue();
				return value?.status !== 'uploading';
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

	async execute(files?: Array<File> | string | MouseEvent) {
		if (!isEngine(this.editor)) return;
		const { request, card, language } = this.editor;
		const { action, data, type, contentType, multiple } = this.options.file;
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
				data,
				type,
				contentType,
				onBefore: file => {
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
				onReady: fileInfo => {
					if (
						!isEngine(this.editor) ||
						!!this.cardComponents[fileInfo.uid]
					)
						return;
					const component = card.insert('image', {
						status: 'uploading',
						src: fileInfo.src,
					}) as ImageComponent;
					this.cardComponents[fileInfo.uid] = component;
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
						card.update(component.id, {
							status: 'error',
							message:
								result.data ||
								this.editor.language.get(
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
					card.update(component.id, {
						status: 'error',
						message:
							error.message ||
							this.editor.language.get('image', 'uploadError'),
					});
					delete this.cardComponents[file.uid || ''];
				},
			},
			files,
		);
		return;
	}

	dropFiles(files: Array<File>) {
		if (!isEngine(this.editor)) return;
		this.editor.command.execute('image-uploader', files);
		return false;
	}

	pasteSchema(schema: SchemaInterface) {
		schema.add({
			type: 'inline',
			name: 'img',
			attributes: {
				src: '@url',
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
		this.editor.command.execute(
			'image-uploader',
			files.filter(file => this.isImage(file)),
		);
		return false;
	}

	pasteEach(node: NodeInterface) {
		const { isRemote } = this.options;
		//是卡片，并且还没渲染
		if (node.isCard() && node.attributes(READY_CARD_KEY)) {
			const card = this.editor.card.find(node) as ImageComponent;
			if (!card) return;
			const value = card.getValue();
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
				card.setValue({ ...value, status: 'done' });
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
			const src = node.attributes('src') || node.attributes('data-src');
			const alt = node.attributes('alt');
			if (!src) {
				node.remove();
				return;
			}
			this.editor.card.replaceNode(node, 'image', {
				src,
				status:
					(isRemote && isRemote(src)) || /^data:image\//i.test(src)
						? 'uploading'
						: 'done',
				alt,
				percent: 0,
			});
		}
	}

	uploadAddress(src: string, component: ImageComponent) {
		if (!isEngine(this.editor)) return;
		const { action, type, data, contentType } = this.options.remote;
		const { parse } = this.options;
		this.editor.request.ajax({
			url: action,
			method: 'POST',
			contentType: contentType || 'application/json',
			type: type === undefined ? 'json' : type,
			data: {
				...data,
				url: src,
			},
			success: response => {
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
					this.editor.card.update(component.id, {
						status: 'error',
						message:
							result.data ||
							this.editor.language.get('image', 'uploadError'),
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
			error: error => {
				this.editor.card.update(component.id, {
					status: 'error',
					message:
						error.message ||
						this.editor.language.get('image', 'uploadError'),
				});
			},
		});
	}

	insertRemote(src: string, alt?: string) {
		const value = {
			src,
			alt,
			status: 'uploading',
		};
		const { isRemote } = this.options;
		//上传第三方图片
		if (isRemote && isRemote(src)) {
			const component = this.editor.card.insert(
				'image',
				value,
			) as ImageComponent;
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
						key => this.cardComponents[key].id === component.id,
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
		const { change } = this.editor;
		const range = change.getRange();

		if (!range.collapsed || change.isComposing() || !this.markdown) return;

		const block = this.editor.block.closest(range.startNode);

		if (!this.editor.node.isRootBlock(block)) {
			return;
		}

		const chars = this.editor.block.getLeftText(block);
		const match = /^!\[([^\]]{0,})\]\((https?:\/\/[^\)]{5,})\)$/.exec(
			chars,
		);
		if (match) {
			event.preventDefault();
			const splits = match[1].split('|');
			const src = match[2];
			this.editor.block.removeLeftText(block);
			const alignment = splits[1];
			if (alignment === 'center' || alignment === 'right') {
				this.editor.command.execute('alignment', alignment);
			}
			this.insertRemote(src, splits[0]);
		}
	}

	pasteMarkdown(node: NodeInterface) {
		if (!isEngine(this.editor) || !this.markdown || !node.isText()) return;

		const { isRemote } = this.options;
		const text = node.text();
		if (!text) return;

		const reg = /(!\[([^\]]{0,})\]\((https?:\/\/[^\)]{5,})\))/;

		let match = reg.exec(text);
		if (!match) return;

		let newText = '';
		let textNode = node.clone(true).get<Text>()!;
		const { $, card } = this.editor;
		while (
			textNode.textContent &&
			(match = reg.exec(textNode.textContent))
		) {
			//从匹配到的位置切断
			let regNode = textNode.splitText(match.index);
			newText += textNode.textContent;
			//从匹配结束位置分割
			textNode = regNode.splitText(match[0].length);

			const alt = match[2];
			const src = match[3];

			const cardNode = card.replaceNode($(regNode), 'image', {
				src,
				status:
					(isRemote && isRemote(src)) || /^data:image\//i.test(src)
						? 'uploading'
						: 'done',
				alt,
				percent: 0,
			});
			regNode.remove();

			newText += cardNode.get<Element>()?.outerHTML + '\n';
		}
		newText += textNode.textContent;
		node.text(newText);
	}
}
