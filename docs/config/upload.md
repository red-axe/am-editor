---
toc: menu
---

# Upload configuration

The editor implements upload logic by default

We can access it in `request.upload` in the engine instance

`request.upload` internally uses `XMLHttpRequest` to upload files, the advantage is that you can get the upload progress

```ts
engine.request.upload(options: UploaderOptions, files: Array<File>, name?: string)
// Upload optional type
export type UploaderOptions = {
    // Upload address
    url: string;
    // Request type, default json
    type?: string;
    // content type
    contentType?: string;
    // additional data
    data?: Record<string, RequestDataValue> | FormData | (() => Promise<Record<string, RequestDataValue> | FormData>)
    // cross domain
    crossOrigin?: boolean;
    // request header
    headers?: {[key: string]: string };
    // Before uploading, you can judge the file size limit
    onBefore?: (file: File) => Promise<boolean | void>;
    // Start upload
    onReady?: (fileInfo: FileInfo, file: File) => Promise<void>;
    // uploading
    onUploading?: (file: File, progress: {percent: number }) => void;
    // upload error
    onError?: (error: Error, file: File) => void;
    // Upload successfully
    onSuccess?: (response: any, file: File) => void;
};
// FileInfo type
export type FileInfo = {
    uid: string;
    src: string | ArrayBuffer | null;
    name: string;
    size: number;
    type: string;
    ext: string;
};
```

In addition to upload, there is a utility method called `getFiles(options?: OpenDialogOptions)` that can pop up a local file selector

```ts
export type OpenDialogOptions = {
	event?: MouseEvent;
	accept?: string;
	multiple?: boolean | number;
};
```

The following plugins all rely on `engine.request.upload` to achieve upload

We only need to follow the instructions of the corresponding plugin and simply configure it to upload.

-   ImageUploader
-   FileUploader
-   VideoUploader

## Custom upload

### Single plugin upload

Take ImageUploader as an example

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
// Inherit the original ImageUploader class and override the execute method
class CustomizeImageUploader extends ImageUploader {
	// The card instance currently being uploaded
	private imageComponents: Record<string, ImageComponent> = {};
	// Process the picture before uploading, and the base64 of the obtained picture will be displayed in the editor while the upload is waiting
	handleBefore(uid: string, file: File) {
		const { type, name, size } = file;
		// Get the file extension
		const ext = getExtensionName(file);
		// read files asynchronously
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
							// unique number
							uid,
							// Blob
							src: fileReader.result,
							// file name
							name,
							// File size
							size,
							// file type
							type,
							// File suffix
							ext,
						},
					};
					// If it is a picture, get the width and height of the picture
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
	// Insert the editor before uploading
	onReady(fileInfo: FileInfo, base64: string, size: Record<string, number>) {
		// If the ImageComponent instance of the current picture exists, it will not be processed
		if (!isEngine(this.editor) || !!this.imageComponents[fileInfo.uid])
			return;
		// Insert ImageComponent card
		const component = this.editor.card.insert(
			ImageComponent.cardName,
			{
				// Set the status to uploading
				status: 'uploading',
				size,
			},
			// Display the base64 image obtained in handleBefore, so as not to cause the editor area to be blank
			base64,
		) as ImageComponent;
		// Record the card instance of the currently uploaded file
		this.imageComponents[fileInfo.uid] = component;
	}
	// uploading
	onUploading(uid: string, { percent }: { percent: number }) {
		// Get the ImageComponent instance corresponding to file
		const component = this.imageComponents[uid];
		if (!component) return;
		// Set the current upload progress percentage
		component.setProgressPercent(percent);
	}
	// Upload successfully
	onSuccess(response: any, uid: string) {
		// Get the ImageComponent instance corresponding to file
		const component = this.imageComponents[uid];
		if (!component) return;
		// Get the image address after the upload is successful
		let src = '';
		// Process the response returned by the server, and update the status value of the ImageComponent instance corresponding to the file if there is an error in the upload
		if (!response.result) {
			// Update the value of the card
			this.editor.card.update(component.id, {
				status: 'error',
				message:
					response.message ||
					this.editor.language.get('image', 'uploadError'),
			});
		} else {
			// Upload successfully
			src = response.data;
		}
		// Set the status value of the ImageComponent instance corresponding to file to done
		const value: ImageValue = {
			status: 'done',
			src,
		};
		// There is a url after the uploaded image is obtained
		if (src) {
			// Call the method of the current instance of ImageUploader to load the url image. If the loading fails, set the status to error and display that it cannot be loaded, otherwise the image will be loaded normally
			this.loadImage(component.id, value);
		}
		// Delete the current temporary record
		delete this.imageComponents[uid];
	}

	// upload error
	onError(error: Error, uid: string) {
		const component = this.imageComponents[uid];
		if (!component) return;
		// Update the card status to error and display the error message
		this.editor.card.update(component.id, {
			status: 'error',
			message:
				error.message ||
				this.editor.language.get('image', 'uploadError'),
		});
		// Delete the current temporary record
		delete this.imageComponents[uid];
	}
	async execute(files?: Array<File> | string | MouseEvent) {
		// It is the reader View that will not handle it
		if (!isEngine(this.editor)) return;
		// Get the currently passed in optional value
		const { request, language } = this.editor;
		const { multiple } = this.options.file;
		// Upload size limit
		const limitSize = this.options.file.limitSize || 5 * 1024 * 1024;
		// The incoming files is not an array to get a picture address, that is, MouseEvent pops up the file selector
		if (!Array.isArray(files) && typeof files !== 'string') {
			// A file selector pops up, allowing the user to select a file
			files = await request.getFiles({
				// Click event of user target
				event: files,
				// Selectable file suffix name. this.extensionNames is the combined value of the suffixes supported by default in the ImageUploader plugin and the suffixes passed in by the options
				accept: isAndroid
					? 'image/*'
					: this.extensionNames.length > 0
					? '.' + this.extensionNames.join(',.')
					: '',
				// The maximum number can be selected
				multiple,
			});
		}
		// If the file address is passed in, then upload the image address. If insertRemote judges that it is a third-party website image address, it will request the api to download from the server, and then the server will store it before returning the new image address.
		// Because the pictures of third-party websites that are not on this site may be cross-domain or inaccessible, it is recommended to perform back-end download processing
		else if (typeof files === 'string') {
			this.insertRemote(files);
			return;
		}
		// don't process if there is no file
		if (files.length === 0) return;
		const promiseList = [];
		for (let f = 0; f < files.length; f++) {
			const file = files[f];
			// The unique identifier of the currently uploaded file
			const uid = Date.now() + '-' + f;
			// Determine the file size
			if (file.size > limitSize) {
				// Display error
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
		//After all the pictures are read, insert the editor
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
				// insert editor
				this.onReady(v.info, v.base64, v.size);
			});
			// Process upload
			this.handleUpload(files);
		});
	}

	/**
	 * Process file upload
	 * @param values
	 */
	handleUpload(values: { file: File; info: FileInfo }[]) {
		const files = values.map((v) => {
			v.file.uid = v.info.uid;
			return v.file;
		});
		// Custom upload method
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

### Global upload

Override the editor `engine.request.upload` method

```ts
import Engine, {
	EngineInterface,
	FileInfo,
	File,
	getExtensionName,
	UploaderOptions,
} from '@aomao/engine';

export default class {
	// Process the picture before uploading, and the blob of the file will be displayed in the editor while waiting for upload
	handleBefore(uid: string, file: File) {
		const { type, name, size } = file;
		// Get the file extension
		const ext = getExtensionName(file);
		// read files asynchronously
		return new Promise<false | { file: File; info: FileInfo }>(
			(resolve, reject) => {
				const fileReader = new FileReader();
				fileReader.addEventListener(
					'load',
					() => {
						const values = {
							file,
							info: {
								// unique number
								uid,
								// Blob format
								src: fileReader.result,
								// file name
								name,
								// File size
								size,
								// file type
								type,
								// File suffix
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
		// Override the upload method in the editor
		engine.request.upload = async (options, files, name) => {
			const { onBefore, onReady } = options;
			// do not process if there is no file
			if (files.length === 0) return;
			const promiseList = [];
			for (let f = 0; f < files.length; f++) {
				const file = files[f];
				// The unique identifier of the currently uploaded file
				const uid = Date.now() + '-' + f;
				file.uid = uid;
				if (onBefore && (await onBefore(file)) === false) return;
				promiseList.push(this.handleBefore(uid, file));
			}
			//Insert the editor after reading all files
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
						// Process upload
						this.handleUpload(file.file, options, name);
					});
				});
			});
		};
	}
	/**
	 * Process upload
	 * @param url upload address
	 * @param name formData parameter name
	 * @param file file
	 */
	handleUpload(file: File, options: UploaderOptions, name: string = 'file') {
		// form data
		const formData = new FormData();
		formData.append(name, file, file.name);
		if (file.data) {
			Object.keys(file.data).forEach((key) => {
				formData.append(key, file.data![key]);
			});
		}
		const {
			// Upload address
			url,
			// additional data
			data,
			// Progress callback during upload
			onUploading,
			// Upload successful callback
			onSuccess,
			// Upload error callback
			onError,
		} = options;
		if (data) {
			Object.keys(data).forEach((key) => {
				formData.append(key, data![key]);
			});
		}

		// Custom upload and call onUploading onSuccess onError callback method
	}
}
```
