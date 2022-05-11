export type RequestDataValue = string | number | boolean | symbol | Blob;
export type RequestData =
	| Record<string, RequestDataValue>
	| FormData
	| (() => Promise<Record<string, RequestDataValue> | FormData>);
export type RequestHeaders =
	| Record<string, string>
	| (() => Promise<Record<string, string>>);

export type AjaxOptions = {
	/**
	 * 請求地址
	 */
	url: string;
	/**
	 * 请求方法
	 */
	method?: 'POST' | 'GET' | 'PUT' | 'DELETE' | 'OPTIONS' | 'HEAD';
	/**
	 * 数据
	 */
	data?: RequestData;
	/**
	 * Window上下文
	 */
	context?: Window & typeof globalThis;
	/**
	 * Document上下文
	 */
	doc?: Document;
	crossOrigin?: boolean;
	type?: string;
	headers?: RequestHeaders;
	withCredentials?: boolean;
	jsonpCallback?: string;
	jsonpCallbackName?: string;
	processData?: boolean;
	xhr?: XMLHttpRequest | ((options: AjaxOptions) => XMLHttpRequest);
	async?: boolean;
	before?: (request: XMLHttpRequest) => void;
	timeout?: number;
	success?: (data: any) => void;
	error?: (error: Error) => void;
	complete?: (request: XMLHttpRequest | Error) => void;
} & SetupOptions;

export type Accept = '*' | 'xml' | 'html' | 'text' | 'json' | 'js';

export type SetupOptions = {
	traditional?: boolean;
	contentType?: string;
	requestedWith?: string;
	accept?: { [key in Accept]: string };
	dataFilter?: (data: any, type?: string) => any;
};

export interface AjaxInterface {
	/**
	 * 获取请求示例
	 * @param success
	 * @param error
	 */
	getRequest(
		success: (data: any) => void,
		error: (errorMsg: string, request?: XMLHttpRequest) => void,
	): Promise<XMLHttpRequest | undefined>;
	/**
	 * 中断当前请求
	 */
	abort: () => void;
}

export type UploaderOptions = {
	/**
	 * 上传地址
	 */
	url: string;
	/**
	 * 数据类型
	 */
	type?: string;
	/**
	 * 内容类型
	 */
	contentType?: string;
	/**
	 * 数据
	 */
	data?: RequestData;
	/**
	 * 跨域
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
	 * 上传前处理
	 */
	onBefore?: (file: File) => Promise<boolean | void> | boolean | void;
	/**
	 * 读取文件处理
	 */
	onReady?: (fileInfo: FileInfo, file: File) => Promise<void> | void;
	/**
	 * 上传中
	 */
	onUploading?: (file: File, progress: { percent: number }) => void;
	/**
	 * 上传错误
	 */
	onError?: (error: Error, file: File) => void;
	/**
	 * 上传成功
	 */
	onSuccess?: (response: any, file: File) => void;
};

export type File = globalThis.File & { uid?: string; data?: {} };

export type FileInfo = {
	/**
	 * 文件uuid
	 */
	uid: string;
	/**
	 * 文件地址或内容
	 */
	src: string | ArrayBuffer | null;
	/**
	 * 文件名称
	 */
	name: string;
	/**
	 * 文件大小
	 */
	size: number;
	/**
	 * 文件类型
	 */
	type: string;
	/**
	 * 文件后缀名
	 */
	ext: string;
};

export interface UploaderInterface {
	/**
	 * 请求上传
	 * @param files 文件集合
	 * @param name 文件名称
	 */
	request(files: Array<File>, name?: string): Promise<void>;
}

export type OpenDialogOptions = {
	/**
	 * 单击事件
	 */
	event?: MouseEvent;
	/**
	 * 可选取的文件类型
	 */
	accept?: string;
	/**
	 * 最多选取多少个文件
	 */
	multiple?: boolean | number;
};

export interface RequestInterface {
	/**
	 * ajax 请求
	 * @param options
	 */
	ajax(options: AjaxOptions | string): AjaxInterface;
	/**
	 * 文件上传
	 * @param options
	 * @param files
	 * @param name
	 */
	upload(
		options: UploaderOptions,
		files: Array<File>,
		name?: string,
	): Promise<void>;
	/**
	 * 打开文件选择框
	 * @param options
	 */
	getFiles(options?: OpenDialogOptions): Promise<Array<globalThis.File>>;
}
