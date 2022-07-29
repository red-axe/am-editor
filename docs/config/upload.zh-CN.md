---
toc: menu
---

# 上传配置

编辑器默认实现了上传逻辑

我们可以在引擎实例中的 `request.upload` 访问到

`request.upload` 内部实用 `XMLHttpRequest` 上传文件，好处是可以获取到上传进度

```ts
engine.request.upload(options: UploaderOptions, files: Array<File>, name?: string)
// 上传可选项类型
export type UploaderOptions = {
    // 上传地址
 url: string;
    // 请求类型，默认 json
 type?: string;
    // 内容类型
 contentType?: string;
    // 额外数据
 data?: Record<string, RequestDataValue> | FormData | (() => Promise<Record<string, RequestDataValue> | FormData>)
    // 跨域
 crossOrigin?: boolean;
    // 请求头
 headers?: { [key: string]: string };
    // 上传前，可以做文件大小限制判断
 onBefore?: (file: File) => Promise<boolean | void>;
    // 开始上传
 onReady?: (fileInfo: FileInfo, file: File) => Promise<void>;
    // 上传中
 onUploading?: (file: File, progress: { percent: number }) => void;
    // 上传错误
 onError?: (error: Error, file: File) => void;
    // 上传成功
 onSuccess?: (response: any, file: File) => void;
};
// FileInfo 类型
export type FileInfo = {
 uid: string;
 src: string | ArrayBuffer | null;
 name: string;
 size: number;
 type: string;
 ext: string;
};
```

除了 upload 外，还有 `getFiles(options?: OpenDialogOptions)` 实用方法，可以弹出本地文件选择器

```ts
export type OpenDialogOptions = {
	event?: MouseEvent;
	accept?: string;
	multiple?: boolean | number;
};
```

下面的插件都是依赖 `engine.request.upload` 实现上传的

我们只需要按照对应插件的说明简单配置后就可以实现上传

-   ImageUploader
-   FileUploader
-   VideoUploader

## 自定义上传

### 单个插件上传

以 ImageUploader 为例

```ts
import {
	getExtensionName,
	FileInfo,
	File,
	isAndroid,
	isEngine,
} from '@aomao/engine';
import { ImageComponent, ImageUploader } from '@aomao/plugin-image';
import { ImageValue } from 'plugins/image/dist/component';
// 继承原 ImageUploader 类，重写 execute 方法
class CustomizeImageUploader extends ImageUploader {
	// 当前上传中的卡片实例
	private imageComponents: Record<string, ImageComponent> = {};
	// 上传前处理图片，获取图片的base64在上传等待中显示在编辑器中
	handleBefore(uid: string, file: File) {
		const { type, name, size } = file;
		// 获取文件后缀名
		const ext = getExtensionName(file);
		// 异步读取文件
		return new Promise<
			| false
			| {
					file: File;
					info: FileInfo;
					base64: string;
					size: Record<string, number>;
			  }
		>((resolve, reject) => {
			const fileReader = new FileReader();
			fileReader.addEventListener(
				'load',
				() => {
					const values = {
						file,
						info: {
							// 唯一编号
							uid,
							// Blob
							src: fileReader.result,
							// 文件名称
							name,
							// 文件大小
							size,
							// 文件类型
							type,
							// 文件后缀名
							ext,
						},
					};
					// 如果是图片，则获取图片的宽高
					const base64 =
						typeof values.info.src !== 'string'
							? window.btoa(
									String.fromCharCode(
										...new Uint8Array(values.info.src),
									),
							  )
							: values.info.src;
					const image = new Image();
					image.src = values.info.src;
					const imagePlugin =
						this.editor.plugin.findPlugin<ImageOptions>('image');

					image.onload = () => {
						const { naturalWidth, naturalHeight, height, width } =
							image;

						let imageWidth: number = width;
						let imageHeight: number = height;
						const maxHeight: number | undefined =
							imagePlugin?.options?.maxHeight;

						if (
							maxHeight &&
							naturalHeight > naturalWidth &&
							height > maxHeight
						) {
							imageHeight = maxHeight;
							imageWidth =
								naturalWidth * (maxHeight / naturalHeight);
						}
						values.base64 = base64;
						(values.size = {
							width: imageWidth,
							height: imageHeight,
							naturalHeight: image.naturalHeight,
							naturalWidth: image.naturalWidth,
						}),
							resolve(values);
					};
					image.onerror = () => {
						reject(false);
					};
				},
				false,
			);
			fileReader.addEventListener('error', () => {
				reject(false);
			});
			fileReader.readAsDataURL(file);
		});
	}
	// 上传前插入编辑器
	onReady(fileInfo: FileInfo, base64: string, size: Record<string, number>) {
		// 如果当前图片的 ImageComponent 实例存在就不处理
		if (!isEngine(this.editor) || !!this.imageComponents[fileInfo.uid])
			return;
		// 插入ImageComponent 卡片
		const component = this.editor.card.insert(
			ImageComponent.cardName,
			{
				// 设置状态为上传中
				status: 'uploading',
				size,
			},
			// 显示在 handleBefore 中获取的 base64 图片，这样不会导致编辑器区域空白
			base64,
		) as ImageComponent;
		// 记录当前上传文件的 卡片实例
		this.imageComponents[fileInfo.uid] = component;
	}
	// 上传中
	onUploading(uid: string, { percent }: { percent: number }) {
		// 获取file 对应的 ImageComponent 实例
		const component = this.imageComponents[uid];
		if (!component) return;
		// 设置当前上传进度百分比
		component.setProgressPercent(percent);
	}
	// 上传成功
	onSuccess(response: any, uid: string) {
		// 获取file 对应的 ImageComponent 实例
		const component = this.imageComponents[uid];
		if (!component) return;
		// 获取上传成功后的图片地址
		let src = '';
		// 处理服务端返回的 response，如果上传出错就更新对应 file 对应的 ImageComponent 实例的状态值
		if (!response.result) {
			// 更新卡片的值
			this.editor.card.update(component.id, {
				status: 'error',
				message:
					response.message ||
					this.editor.language.get('image', 'uploadError'),
			});
		} else {
			// 上传成功
			src = response.data;
		}
		// 设置为file 对应的 ImageComponent 实例的状态值为 done
		const value: ImageValue = {
			status: 'done',
			src,
		};
		// 有获取的上传图片后的url
		if (src) {
			// 调用 ImageUploader 当前实例的方法去加载这个 url 图片，如果加载失败，就设置状态为error并显示无法加载，否则就正常加载图片
			this.loadImage(component.id, value);
		}
		// 删除当前的临时记录
		delete this.imageComponents[uid];
	}

	// 上传出错
	onError(error: Error, uid: string) {
		const component = this.imageComponents[uid];
		if (!component) return;
		// 更新卡片状态为 error，并显示错误信息
		this.editor.card.update(component.id, {
			status: 'error',
			message:
				error.message ||
				this.editor.language.get('image', 'uploadError'),
		});
		// 删除当前的临时记录
		delete this.imageComponents[uid];
	}

	async execute(files?: Array<File> | string | MouseEvent) {
		// 是阅读器View就不处理
		if (!isEngine(this.editor)) return;
		// 获取当前传入的可选项值
		const { request, language } = this.editor;
		const { multiple } = this.options.file;
		// 上传大小限制
		const limitSize = this.options.file.limitSize || 5 * 1024 * 1024;
		// 传入的files不是数组获取不是图片地址，那就是 MouseEvent 弹出文件选择器
		if (!Array.isArray(files) && typeof files !== 'string') {
			// 弹出文件选择器，让用户选择文件
			files = await request.getFiles({
				// 用户目标的单击事件
				event: files,
				// 可选取的文件后缀名称。this.extensionNames 是 ImageUploader 插件内默认支持的后缀和可选项传进来的后缀合并后的值
				accept: isAndroid
					? 'image/*'
					: this.extensionNames.length > 0
					? '.' + this.extensionNames.join(',.')
					: '',
				// 最多可选取数量
				multiple,
			});
		}
		// 如果传入的文件地址，那就执行图片地址的上传，insertRemote 如果判断是非本站第三方网站图片地址就会请求api到服务端下载然后服务端存储后再返回新的图片地址
		// 因为非本站第三方网站的图片可能存在跨域或者无法访问的情况，建议进行后端下载处理
		else if (typeof files === 'string') {
			this.insertRemote(files);
			return;
		}
		// 如果没有任何文件就不处理
		if (files.length === 0) return;
		const promiseList = [];
		for (let f = 0; f < files.length; f++) {
			const file = files[f];
			// 当前上传文件唯一标识
			const uid = Date.now() + '-' + f;
			// 判断文件大小
			if (file.size > limitSize) {
				// 显示错误
				this.editor.messageError(
					language
						.get<string>('image', 'uploadLimitError')
						.replace(
							'$size',
							(limitSize / 1024 / 1024).toFixed(0) + 'M',
						),
				);
				return;
			}
			promiseList.push(this.handleBefore(uid, file));
		}
		//全部图片读取完成后再插入编辑器
		Promise.all(promiseList).then((values) => {
			if (values.some((value) => value === false)) {
				this.editor.messageError('read image failed');
				return;
			}
			const files = values as {
				file: File;
				info: FileInfo;
				base64: string;
				size: Record<string, number>;
			}[];
			files.forEach((v) => {
				// 插入编辑器
				this.onReady(v.info, v.base64, v.size);
			});
			// 处理上传
			this.handleUpload(files);
		});
	}

	/**
	 * 处理文件上传
	 * @param values
	 */
	handleUpload(values: { file: File; info: FileInfo }[]) {
		const files = values.map((v) => {
			v.file.uid = v.info.uid;
			return v.file;
		});
		// 自定义上传方法
		this.editor.request.upload(
			{
				url: this.options.file.action,
				onUploading: (file, percent) => {
					this.onUploading(file.uid || '', percent);
				},
				onSuccess: (response, file) => {
					this.onSuccess(response, file.uid || '');
				},
				onError: (error, file) => {
					this.onError(error, file.uid || '');
				},
			},
			files,
		);
	}
}

export default CustomizeImageUploader;
```

### 全局上传

重写编辑器 `engine.request.upload` 方法

```ts
import Engine, {
	EngineInterface,
	FileInfo,
	File,
	getExtensionName,
	UploaderOptions,
} from '@aomao/engine';

export default class {
	// 上传前处理图片，获取文件的Blob在上传等待中显示在编辑器中
	handleBefore(uid: string, file: File) {
		const { type, name, size } = file;
		// 获取文件后缀名
		const ext = getExtensionName(file);
		// 异步读取文件
		return new Promise<false | { file: File; info: FileInfo }>(
			(resolve, reject) => {
				const fileReader = new FileReader();
				fileReader.addEventListener(
					'load',
					() => {
						const values = {
							file,
							info: {
								// 唯一编号
								uid,
								// Blob格式
								src: fileReader.result,
								// 文件名称
								name,
								// 文件大小
								size,
								// 文件类型
								type,
								// 文件后缀名
								ext,
							},
						};
						resolve(values);
					},
					false,
				);
				fileReader.addEventListener('error', () => {
					reject(false);
				});
				fileReader.readAsDataURL(file);
			},
		);
	}

	setGlobalUpload(engine: EngineInterface = new Engine('.container')) {
		// 重写编辑器中 upload 方法
		engine.request.upload = async (options, files, name) => {
			const { onBefore, onReady } = options;
			// 如果没有任何文件就不处理
			if (files.length === 0) return;
			const promiseList = [];
			for (let f = 0; f < files.length; f++) {
				const file = files[f];
				// 当前上传文件唯一标识
				const uid = Date.now() + '-' + f;
				file.uid = uid;
				if (onBefore && (await onBefore(file)) === false) return;
				promiseList.push(this.handleBefore(uid, file));
			}
			//全部文件读取完成后再插入编辑器
			Promise.all(promiseList).then(async (values) => {
				if (values.some((value) => value === false)) {
					engine.messageError('read image failed');
					return;
				}
				const files = values as { file: File; info: FileInfo }[];
				Promise.all([
					...files.map(async (v) => {
						return new Promise(async (resolve) => {
							if (onReady) {
								await onReady(v.info, v.file);
							}
							resolve(true);
						});
					}),
				]).then(() => {
					files.forEach(async (file) => {
						// 处理上传
						this.handleUpload(file.file, options, name);
					});
				});
			});
		};
	}
	/**
	 * 处理上传
	 * @param url 上传地址
	 * @param name formData 参数名称
	 * @param file 文件
	 */
	handleUpload(file: File, options: UploaderOptions, name: string = 'file') {
		// 表单数据
		const formData = new FormData();
		formData.append(name, file, file.name);
		if (file.data) {
			Object.keys(file.data).forEach((key) => {
				formData.append(key, file.data![key]);
			});
		}
		const {
			// 上传地址
			url,
			// 额外数据
			data,
			// 上传中的进度回调
			onUploading,
			// 上传成功回调
			onSuccess,
			// 上传错误回调
			onError,
		} = options;
		if (data) {
			Object.keys(data).forEach((key) => {
				formData.append(key, data![key]);
			});
		}

		// 自定义上传，并调用 onUploading onSuccess onError 回调方法
	}
}
```
