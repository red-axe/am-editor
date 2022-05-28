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
import type { RequestData, RequestHeaders } from '@aomao/engine';
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
	data?: RequestData;
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
	headers?: RequestHeaders;
	/**
	 * 文件接收的格式，默认 "*"
	 */
	accept?: string | string[] | Record<string, string>;
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
		data?: RequestData;
		/**
		 * 请求头
		 */
		headers?: RequestHeaders;
		/**
		 * 请求类型，默认 multipart/form-data;
		 */
		contentType?: string;
	};
}

const DROP_FILES = 'drop:files';
const PASTE_EVENT = 'paste:event';
const PASTE_EACH = 'paste:each';
export default class<
	T extends VideoUploaderOptions = VideoUploaderOptions,
> extends Plugin<T> {
	protected cardComponents: { [key: string]: VideoComponent<VideoValue> } =
		{};

	static get pluginName() {
		return 'video-uploader';
	}

	extensionNames: string[] | Record<string, string> = { mp4: 'video/mp4' };

	init() {
		const editor = this.editor;
		if (isEngine(editor)) {
			editor.on(DROP_FILES, this.dropFiles);
			editor.on(PASTE_EVENT, this.pasteFiles);
			editor.on(PASTE_EACH, this.pasteEach);
		}
		let { accept } = this.options.file || {};
		if (typeof accept === 'string') accept = accept.split(',');
		if (Array.isArray(accept)) {
			const names: string[] = [];
			(accept || []).forEach((name) => {
				name = name.trim();
				const newName = name.split('.').pop();
				if (newName) names.push(newName);
			});
			if (names.length > 0) this.extensionNames = names;
		} else if (typeof accept === 'object') {
			this.extensionNames = accept;
		}
	}

	isVideo(file: File) {
		const name = getExtensionName(file);
		const names = Array.isArray(this.extensionNames)
			? this.extensionNames
			: Object.keys(this.extensionNames);
		return names.indexOf('*') >= 0 || names.indexOf(name) >= 0;
	}

	async execute(files?: Array<File> | MouseEvent | string, ...args: any) {
		if (typeof files === 'string') {
			switch (files) {
				case 'query':
					return this.query(args[0], args[1], args[2]);
			}
			return;
		}
		const editor = this.editor;
		const { request, card, language } = editor;
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
			const accepts = Array.isArray(this.extensionNames)
				? '.' + this.extensionNames.join(',.')
				: Object.values(this.extensionNames).join(',');
			files = await request.getFiles({
				event: files,
				accept: isAndroid
					? 'video/*'
					: accepts.length > 0
					? accepts
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
				headers,
				onBefore: (file) => {
					if (file.size > limitSize) {
						editor.messageError(
							'upload-limit',
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
						!isEngine(editor) ||
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
									: language.get<string>(
											'video',
											'uploadError',
									  ),
						});
					}
					//成功
					else {
						editor.card.update<VideoValue>(
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
							language.get<string>('video', 'uploadError'),
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
		const { request, language } = this.editor;

		const { query, parse } = this.options;
		if (!query || !video_id) return success();

		const { action, type, contentType, data, headers } = query;
		request.ajax({
			url: action,
			contentType: contentType || '',
			type: type === undefined ? 'json' : type,
			headers,
			data:
				typeof data === 'function'
					? async () => {
							const newData = await data();
							return { ...newData, id: video_id };
					  }
					: {
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
							result.data || language.get('video', 'loadError'),
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
				failed(error.message || language.get('video', 'loadError'));
			},
			method: 'GET',
		});
	}

	dropFiles = (files: File[]) => {
		const editor = this.editor;
		if (!isEngine(editor)) return;
		files = files.filter((file) => this.isVideo(file));
		if (files.length === 0) return;
		editor.command.execute('video-uploader', files);
		return false;
	};

	pasteFiles = ({ files }: Record<'files', File[]>) => {
		const editor = this.editor;
		if (!isEngine(editor)) return;
		files = files.filter((file) => this.isVideo(file));
		if (files.length === 0) return;
		editor.command.execute(
			'video-uploader',
			files.filter((file) => this.isVideo(file)),
			files,
		);
		return false;
	};

	pasteEach = (node: NodeInterface) => {
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
	};

	destroy() {
		const editor = this.editor;
		editor.off(DROP_FILES, this.dropFiles);
		editor.off(PASTE_EVENT, this.pasteFiles);
		editor.off(PASTE_EACH, this.pasteEach);
	}
}
