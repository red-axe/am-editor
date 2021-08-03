export type AjaxOptions = {
	url: string;
	method?: 'POST' | 'GET' | 'PUT' | 'DELETE' | 'OPTIONS' | 'HEAD';
	data?: any;
	context?: Window & typeof globalThis;
	doc?: Document;
	crossOrigin?: boolean;
	type?: string;
	headers?: { [key: string]: string };
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
	getRequest(
		success: (data: any) => void,
		error: (errorMsg: string, request?: XMLHttpRequest) => void,
	): XMLHttpRequest | undefined;
}

export type UploaderOptions = {
	url: string;
	type?: string;
	contentType?: string;
	data?: {};
	crossOrigin?: boolean;
	headers?: { [key: string]: string };
	onBefore?: (file: File) => boolean | void;
	onReady?: (fileInfo: FileInfo, file: File) => void;
	onUploading?: (file: File, progress: { percent: number }) => void;
	onError?: (error: Error, file: File) => void;
	onSuccess?: (response: any, file: File) => void;
};

export type File = globalThis.File & { uid?: string; data?: {} };

export type FileInfo = {
	uid: string;
	src: string | ArrayBuffer | null;
	name: string;
	size: number;
	type: string;
	ext: string;
};

export interface UploaderInterface {
	request(files: Array<File>): Promise<void>;
}

export type OpenDialogOptions = {
	event?: MouseEvent;
	accept?: string;
	multiple?: boolean | number;
};

export interface RequestInterface {
	ajax(options: AjaxOptions | string): AjaxInterface;
	upload(options: UploaderOptions, files: Array<File>): Promise<void>;
	getFiles(options?: OpenDialogOptions): Promise<Array<globalThis.File>>;
}
