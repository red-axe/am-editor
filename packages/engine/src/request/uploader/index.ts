import {
	UploaderInterface,
	FileInfo,
	UploaderOptions,
	File,
} from '../../types/request';
import { getExtensionName, getFileSize } from './utils';
import Ajax from '../ajax';
import { isFormData } from '../ajax/utils';

class Uploader implements UploaderInterface {
	private options: UploaderOptions;
	private uploadingFiles: Array<FileInfo> = [];

	constructor(options: UploaderOptions) {
		this.options = options;
	}

	createUid(text: string | number) {
		return Date.now() + '-' + text;
	}

	async request(files: Array<File>, name?: string) {
		for (let i = 0; i < files.length; i++) {
			const file = files[i];
			if (!file.uid) file.uid = this.createUid(i);
			if ((await this.handleBefore(file, files)) === false) {
				files.splice(i, 1);
			}
		}
		this.upload(files, name);
	}

	private async upload(files: Array<File>, name: string = 'file') {
		files.forEach(async (file) => {
			const formData = new FormData();
			const {
				url,
				onUploading,
				onSuccess,
				onError,
				withCredentials,
				crossOrigin,
				headers,
			} = this.options;
			let data = this.options.data;
			if (typeof data === 'function') {
				data = await data();
			}
			if (data) {
				if (isFormData(data)) {
					for (const [key, value] of data) {
						formData.append(key, value);
					}
				} else {
					Object.keys(data).forEach((key) => {
						formData.append(key, data![key]);
					});
				}
			}
			if (file.data) {
				Object.keys(file.data).forEach((key) => {
					formData.append(key, file.data![key]);
				});
			}
			formData.append(name, file, file.name);

			await new Ajax({
				xhr: () => {
					const xhr = new window.XMLHttpRequest();
					xhr.upload.addEventListener(
						'progress',
						(evt) => {
							if (evt.lengthComputable) {
								if (onUploading)
									onUploading(file, {
										percent: parseInt(
											(
												(evt.loaded / evt.total) *
												100
											).toString(),
											10,
										),
									});
							}
						},
						false,
					);
					return xhr;
				},
				url,
				data: formData,
				contentType: this.options.contentType,
				type: this.options.type || 'json',
				withCredentials,
				crossOrigin,
				headers,
				success: (response: any) => {
					if (onSuccess) onSuccess(response, file);
				},
				error: (err) => {
					if (onError) onError(err, file);
				},
				method: 'POST',
				processData: true,
			});
		});
	}

	async handleBefore(file: File, files: Array<File>) {
		const { type, uid, name, size } = file;
		const ext = getExtensionName(file);
		const { onBefore } = this.options;
		if (onBefore && (await onBefore(file)) === false) {
			return false;
		}
		return new Promise<boolean>((resolve, reject) => {
			const fileReader = new FileReader();
			fileReader.addEventListener(
				'load',
				() => {
					this.uploadingFiles[uid!] = {
						uid,
						src: fileReader.result,
						name,
						size,
						type,
						ext,
					};
					//全部文件读取完成后再插入编辑器
					if (
						files.every((file) => !!this.uploadingFiles[file.uid!])
					) {
						Promise.all([
							...files.map((file) => {
								return new Promise(async (resolve) => {
									if (this.options.onReady) {
										await this.options.onReady(
											this.uploadingFiles[file.uid!],
											file,
										);
									}
									resolve(true);
								});
							}),
						]).then(() => {
							resolve(true);
						});
					} else {
						resolve(true);
					}
				},
				false,
			);

			fileReader.addEventListener('error', () => {
				reject(false);
			});

			fileReader.readAsDataURL(file);
		});
	}
}

export default Uploader;

export { getExtensionName, getFileSize };
