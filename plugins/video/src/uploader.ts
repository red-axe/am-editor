import {
	File,
	isAndroid,
	isEngine,
	NodeInterface,
	Plugin,
	READY_CARD_KEY,
	getExtensionName,
} from '@aomao/engine';

import VideoComponent from './component';

export type Options = {
	/**
	 * 视频上传地址
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
	parse?: (
		response: any,
	) => {
		result: boolean;
		data:
			| {
					url: string;
					id?: string;
					cover?: string;
					status?: string;
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
};

export default class extends Plugin<Options> {
	private cardComponents: { [key: string]: VideoComponent } = {};

	static get pluginName() {
		return 'video-uploader';
	}

	private extensionNames = ['mp4'];

	init() {
		if (isEngine(this.editor)) {
			this.editor.on('drop:files', files => this.dropFiles(files));
			this.editor.on('paste:event', ({ files }) =>
				this.pasteFiles(files),
			);
			this.editor.on('paste:each', node => this.pasteEach(node));
		}
		let { accept } = this.options;
		const names: Array<string> = [];
		if (typeof accept === 'string') accept = accept.split(',');

		(accept || []).forEach(name => {
			name = name.trim();
			const newName = name.split('.').pop();
			if (newName) names.push(newName);
		});
		if (names.length > 0) this.extensionNames = names;
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

	isVideo(file: File) {
		const name = getExtensionName(file);
		return this.extensionNames.indexOf(name) >= 0;
	}

	async execute(files?: Array<File> | MouseEvent | string, ...args: any) {
		if (!isEngine(this.editor)) return;
		if (typeof files === 'string') {
			switch (files) {
				case 'query':
					return this.query(args[0], args[1], args[2]);
			}
			return;
		}
		const { request, card, language } = this.editor;
		const { action, data, type, contentType, multiple } = this.options;
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
				onBefore: file => {
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
				onReady: fileInfo => {
					if (
						!isEngine(this.editor) ||
						!!this.cardComponents[fileInfo.uid]
					)
						return;
					const component = card.insert('video', {
						status: 'uploading',
						name: fileInfo.name,
						size: fileInfo.size,
					}) as VideoComponent;
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
					let status: string =
						response.status ||
						(response.data && response.data.status);
					status = status === 'transcoding' ? 'transcoding' : 'done';
					const result = parse
						? parse(response)
						: !!url
						? {
								result: true,
								data: {
									video_id: id,
									url,
									cover,
									download,
									status,
								},
						  }
						: { result: false, data: response.data };
					//失败
					if (!result.result) {
						card.update(component.id, {
							status: 'error',
							message:
								result.data ||
								this.editor.language.get(
									'video',
									'uploadError',
								),
						});
					}
					//成功
					else {
						this.editor.card.update(component.id, {
							...result.data,
						});
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
							this.editor.language.get('video', 'uploadError'),
					});
					delete this.cardComponents[file.uid || ''];
				},
			},
			files,
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
			status?: string;
		}) => void,
		failed: (message: string) => void = () => {},
	) {
		const { request } = this.editor;

		const { query, parse } = this.options;
		if (!query || !video_id) return success();

		const { action, type, contentType, data } = query;

		request.ajax({
			url: action,
			dataType: type || 'json',
			contentType,
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
			error: error => {
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
		files = files.filter(file => this.isVideo(file));
		if (files.length === 0) return;
		this.editor.command.execute('video-uploader', files);
		return false;
	}

	pasteFiles(files: Array<File>) {
		if (!isEngine(this.editor)) return;
		files = files.filter(file => this.isVideo(file));
		if (files.length === 0) return;
		this.editor.command.execute(
			'video-uploader',
			files.filter(file => this.isVideo(file)),
			files,
		);
		return false;
	}

	pasteEach(node: NodeInterface) {
		//是卡片，并且还没渲染
		if (node.isCard() && node.attributes(READY_CARD_KEY)) {
			const card = this.editor.card.find(node) as VideoComponent;
			if (!card || node.attributes(READY_CARD_KEY) !== 'video') return;
			const value = card.getValue();
			if (!value || !value.url) {
				node.remove();
				return;
			}
			if (value.status === 'uploading') {
				//如果是上传状态，设置为正常状态
				value.percent = 0;
				card.setValue({ ...value, status: 'done' });
			}
			return;
		}
	}
}
