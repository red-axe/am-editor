import {
	File,
	isAndroid,
	isEngine,
	NodeInterface,
	Plugin,
	READY_CARD_KEY,
	getExtensionName,
	PluginOptions,
	CARD_VALUE_KEY,
	decodeCardValue,
	encodeCardValue,
} from '@aomao/engine';

import VideoComponent, { VideoValue, VideoStatus } from './component';

export interface VideoUploaderOptions extends PluginOptions {
	/**
	 * 视频上传地址
	 */
	action: string;
	/**
	 * 数据返回类型，默认 json
	 */
	type?: '*' | 'json' | 'xml' | 'html' | 'text' | 'js';
	/**
	 * 视频文件上传时 FormData 的名称，默认 file
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
	 * 文件接收的格式，默认 "*"
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
	/**
	 * 解析上传后的Respone，返回 result:是否成功，data:成功：{id:视频唯一标识,url:视频地址,cover?:视频封面}，失败：错误信息
	 */
	parse?: (response: any) => {
		result: boolean;
		data:
			| {
					url: string;
					id?: string;
					cover?: string;
					status?: VideoStatus;
					name?: string;
					width?: number;
					height?: number;
			  }
			| string;
	};
	/**
	 * 查询地址
	 */
	query?: {
		/**
		 * 查询地址
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
}

export default class<
	T extends VideoUploaderOptions = VideoUploaderOptions,
> extends Plugin<T> {
	private cardComponents: { [key: string]: VideoComponent<VideoValue> } = {};

	static get pluginName() {
		return 'video-uploader';
	}

	extensionNames = ['mp4'];

	init() {
		if (isEngine(this.editor)) {
			this.editor.on('drop:files', (files) => this.dropFiles(files));
			this.editor.on('paste:event', ({ files }) =>
				this.pasteFiles(files),
			);
			this.editor.on('paste:each', (node) => this.pasteEach(node));
		}
		let { accept } = this.options;
		const names: Array<string> = [];
		if (typeof accept === 'string') accept = accept.split(',');

		(accept || []).forEach((name) => {
			name = name.trim();
			const newName = name.split('.').pop();
			if (newName) names.push(newName);
		});
		if (names.length > 0) this.extensionNames = names;
	}

	isVideo(file: File) {
		const name = getExtensionName(file);
		return this.extensionNames.indexOf(name) >= 0;
	}

	async execute(files?: Array<File> | MouseEvent | string, ...args: any) {
		if (typeof files === 'string') {
			switch (files) {
				case 'query':
					return this.query(args[0], args[1], args[2]);
			}
			return;
		}
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
		} = this.options;
		const { parse } = this.options;
		const limitSize = this.options.limitSize || 5 * 1024 * 1024;
		if (!Array.isArray(files)) {
			files = await request.getFiles({
				event: files,
				accept: isAndroid
					? 'video/*'
					: this.extensionNames.length > 0
					? '.' + this.extensionNames.join(',.')
					: '',
				multiple,
			});
		}
		if (files.length === 0) return;
		request.upload(
			{
				url: action,
				data,
				type,
				contentType,
				crossOrigin,
				withCredentials,
				headers: typeof headers === 'function' ? headers() : headers,
				onBefore: (file) => {
					if (file.size > limitSize) {
						this.editor.messageError(
							language
								.get('video', 'uploadLimitError')
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
					const component = card.insert<
						VideoValue,
						VideoComponent<VideoValue>
					>('video', {
						status: 'uploading',
						name: fileInfo.name,
						size: fileInfo.size,
					});
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
					const id: string =
						response.id || (response.data && response.data.id);
					let url: string =
						response.url || (response.data && response.data.url);
					const cover: string =
						response.cover ||
						(response.data && response.data.cover);
					const download: string =
						response.download ||
						(response.data && response.data.download);
					const width: number =
						response.width ||
						(response.data && response.data.width);
					const height: number =
						response.height ||
						(response.data && response.data.height);
					let status: VideoStatus =
						response.status ||
						(response.data && response.data.status);
					status = status === 'transcoding' ? 'transcoding' : 'done';
					let result: {
						result: boolean;
						data:
							| {
									url: string;
									video_id?: string;
									cover?: string;
									download?: string;
									status?: VideoStatus;
									width?: number;
									height?: number;
							  }
							| string;
					} = {
						result: true,
						data: {
							video_id: id,
							url,
							cover,
							download,
							status,
							width,
							height,
						},
					};
					if (parse) {
						const customizeResult = parse(response);
						if (customizeResult.result) {
							let data = result.data as {
								url: string;
								video_id?: string;
								cover?: string;
								download?: string;
								status?: VideoStatus;
								name?: string;
								width?: number;
								height?: number;
							};
							if (typeof customizeResult.data === 'string')
								result.data = {
									...data,
									url: customizeResult.data,
								};
							else {
								data.url = customizeResult.data.url;
								if (customizeResult.data.status !== undefined)
									data = {
										...data,
										status: customizeResult.data.status,
									};
								if (customizeResult.data.id !== undefined)
									data = {
										...data,
										video_id: customizeResult.data.id,
									};
								if (customizeResult.data.cover !== undefined)
									data = {
										...data,
										cover: customizeResult.data.cover,
									};
								if (customizeResult.data.width !== undefined)
									data = {
										...data,
										width: customizeResult.data.width,
									};
								if (customizeResult.data.height !== undefined)
									data = {
										...data,
										height: customizeResult.data.height,
									};
								result.data = { ...data };
							}
						} else {
							result = {
								result: false,
								data: customizeResult.data.toString(),
							};
						}
					} else if (!url) {
						result = { result: false, data: response.data };
					}
					//失败
					if (!result.result) {
						card.update<VideoValue>(component.id, {
							status: 'error',
							message:
								typeof result.data === 'string'
									? result.data
									: this.editor.language.get<string>(
											'video',
											'uploadError',
									  ),
						});
					}
					//成功
					else {
						this.editor.card.update<VideoValue>(
							component.id,
							typeof result.data === 'string'
								? { url: result.data }
								: {
										...result.data,
										naturalWidth: result.data.width,
										naturalHeight: result.data.height,
								  },
						);
					}
					delete this.cardComponents[file.uid || ''];
				},
				onError: (error, file) => {
					const component = this.cardComponents[file.uid || ''];
					if (!component) return;
					card.update<VideoValue>(component.id, {
						status: 'error',
						message:
							error.message ||
							this.editor.language.get<string>(
								'video',
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

	query(
		video_id: string,
		success: (data?: {
			url: string;
			name?: string;
			cover?: string;
			download?: string;
			status?: VideoStatus;
		}) => void,
		failed: (message: string) => void = () => {},
	) {
		const { request } = this.editor;

		const { query, parse } = this.options;
		if (!query || !video_id) return success();

		const { action, type, contentType, data } = query;
		request.ajax({
			url: action,
			contentType: contentType || '',
			type: type === undefined ? 'json' : type,
			data: {
				...data,
				id: video_id,
			},
			success: (response: any) => {
				const { result, data } = response;
				if (!result) {
					failed(data);
				} else {
					const result = parse ? parse(response) : response;
					if (result.result === false) {
						failed(
							result.data ||
								this.editor.language.get('video', 'loadError'),
						);
					} else
						success({
							...result.data,
							status:
								result.data.status !== 'transcoding'
									? 'done'
									: 'transcoding',
						});
				}
			},
			error: (error) => {
				failed(
					error.message ||
						this.editor.language.get('video', 'loadError'),
				);
			},
			method: 'GET',
		});
	}

	dropFiles(files: Array<File>) {
		if (!isEngine(this.editor)) return;
		files = files.filter((file) => this.isVideo(file));
		if (files.length === 0) return;
		this.editor.command.execute('video-uploader', files);
		return false;
	}

	pasteFiles(files: Array<File>) {
		if (!isEngine(this.editor)) return;
		files = files.filter((file) => this.isVideo(file));
		if (files.length === 0) return;
		this.editor.command.execute(
			'video-uploader',
			files.filter((file) => this.isVideo(file)),
			files,
		);
		return false;
	}

	pasteEach(node: NodeInterface) {
		//是卡片，并且还没渲染
		if (node.isCard() && node.attributes(READY_CARD_KEY)) {
			if (node.attributes(READY_CARD_KEY) !== 'video') return;
			const value = decodeCardValue(node.attributes(CARD_VALUE_KEY));
			if (!value || !value.url) {
				node.remove();
				return;
			}
			if (value.status === 'uploading') {
				//如果是上传状态，设置为正常状态
				value.percent = 0;
				node.attributes(
					CARD_VALUE_KEY,
					encodeCardValue({ ...value, status: 'done' }),
				);
			}
			return;
		}
	}
}
