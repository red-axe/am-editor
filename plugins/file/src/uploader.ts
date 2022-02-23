import {
	File,
	isAndroid,
	isEngine,
	NodeInterface,
	Plugin,
	READY_CARD_KEY,
	getExtensionName,
	PluginOptions,
	decodeCardValue,
	CARD_VALUE_KEY,
	encodeCardValue,
} from '@aomao/engine';

import FileComponent from './component';
import type { FileValue } from './component';

export interface FileUploaderOptions extends PluginOptions {
	/**
	 * 文件上传地址
	 */
	action: string;
	/**
	 * 数据返回类型，默认 json
	 */
	type?: '*' | 'json' | 'xml' | 'html' | 'text' | 'js';
	/**
	 * 文件上传时 FormData 的名称，默认 file
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
	 * 解析上传后的Respone，返回 result:是否成功，data:成功：文件地址，失败：错误信息
	 */
	parse?: (response: any) => {
		result: boolean;
		data:
			| {
					url: string;
					preview?: string;
					download?: string;
					status?: string;
			  }
			| string;
	};
}

export default class<
	T extends FileUploaderOptions = FileUploaderOptions,
> extends Plugin<T> {
	private cardComponents: { [key: string]: FileComponent<FileValue> } = {};

	static get pluginName() {
		return 'file-uploader';
	}

	extensionNames = ['*'];

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

	isFile(file: File) {
		const name = getExtensionName(file) ?? '';
		return (
			this.extensionNames.indexOf('*') >= 0 ||
			this.extensionNames.indexOf(name) >= 0
		);
	}

	async execute(files?: Array<File> | MouseEvent) {
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
		} = this.options;
		const { parse } = this.options;
		const limitSize = this.options.limitSize || 5 * 1024 * 1024;
		if (!Array.isArray(files)) {
			files = await request.getFiles({
				event: files,
				accept:
					isAndroid || this.extensionNames.indexOf('*') > -1
						? '*'
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
								.get('file', 'uploadLimitError')
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
						FileValue,
						FileComponent<FileValue>
					>('file', {
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
					const url =
						response.url || (response.data && response.data.url);
					const preview =
						response.preview ||
						(response.data && response.data.preview);
					const download =
						response.download ||
						(response.data && response.data.download);
					let result: {
						result: boolean;
						data:
							| {
									url: string;
									preview?: string;
									download?: string;
									status?: string;
							  }
							| string;
					} = {
						result: true,
						data: {
							status: 'done',
							url,
							preview,
							download,
						},
					};
					if (parse) {
						const customizeResult = parse(response);
						if (customizeResult.result) {
							let data = result.data as {
								url: string;
								preview?: string;
								download?: string;
								status?: string;
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
								if (customizeResult.data.preview !== undefined)
									data = {
										...data,
										preview: customizeResult.data.preview,
									};
								if (customizeResult.data.download !== undefined)
									data = {
										...data,
										download: customizeResult.data.download,
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
					if (!result.result) {
						card.update<FileValue>(component.id, {
							status: 'error',
							message:
								typeof result.data === 'string'
									? result.data
									: this.editor.language.get<string>(
											'file',
											'uploadError',
									  ),
						});
					} else {
						const value: any =
							typeof result.data === 'string'
								? { url: result.data }
								: {
										...result.data,
								  };
						this.editor.card.update(component.id, value);
					}
					delete this.cardComponents[file.uid || ''];
				},
				onError: (error, file) => {
					const component = this.cardComponents[file.uid || ''];
					if (!component) return;
					card.update<FileValue>(component.id, {
						status: 'error',
						message:
							error.message ||
							this.editor.language.get<string>(
								'file',
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
		files = files.filter((file) => this.isFile(file));
		if (files.length === 0) return;
		this.editor.command.execute('file-uploader', files);
		return false;
	}

	pasteFiles(files: Array<File>) {
		if (!isEngine(this.editor)) return;
		files = files.filter((file) => this.isFile(file));
		if (files.length === 0) return;
		this.editor.command.execute(
			'file-uploader',
			files.filter((file) => this.isFile(file)),
			files,
		);
		return false;
	}

	pasteEach(node: NodeInterface) {
		//是卡片，并且还没渲染
		if (node.isCard() && node.attributes(READY_CARD_KEY)) {
			if (node.attributes(READY_CARD_KEY) !== 'file') return;
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
