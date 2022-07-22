import startsWith from 'lodash/startsWith';
import { getDocument } from '../../utils';
import {
	AjaxInterface,
	AjaxOptions,
	RequestHeaders,
	SetupOptions,
} from '../../types/request';
import { isFormData, toQueryString, urlAppend } from './utils';
import {
	CONTENT_TYPE,
	HTTP_REG,
	PROTOCO_REG,
	READY_STATE,
	REQUESTED_WITH,
	TWO_HUNDO,
	XML_HTTP_REQUEST,
	X_DOMAIN_REQUEST,
} from './constants';
import globalSetup from './setup';

class Ajax implements AjaxInterface {
	private options: AjaxOptions;
	private headNode?: HTMLHeadElement;
	private request?: XMLHttpRequest;
	private isAborted: boolean = false;
	private isTimeout: boolean = false;
	private timeout?: NodeJS.Timeout;
	private callbackData?: any;
	private callbackPrefix: string = 'request_' + new Date();
	private uuid: number = 0;
	private promise?: Promise<any>;
	private __resolve?: (value: unknown) => void;
	private __reject?: (reason?: any) => void;

	/**
	 * 设置全局选项
	 * @param options 选项
	 */
	static setup = (options: SetupOptions) => {
		Object.keys(options).forEach((key) => {
			if (globalSetup[key]) globalSetup[key] = options[key];
		});
	};

	constructor(options: AjaxOptions | string) {
		if (typeof options === 'string') {
			options = {
				url: options,
			};
		}

		let { url } = options;
		if (startsWith(url, '//')) {
			url = window.location.protocol + url;
		}
		this.options = {
			...globalSetup,
			...options,
			url,
			context: options.context || window,
			doc: options.doc || getDocument(),
			jsonpCallback: options.jsonpCallback || 'callback',
			method: options.method || 'GET',
		};
		this.headNode = this.options.doc?.getElementsByTagName('head')[0];
		this.initPromise();
		this.init();
	}

	initPromise() {
		this.promise = new Promise((resolve, reject) => {
			this.__resolve = resolve;
			this.__reject = reject;
		}).catch(() => {});
	}

	init() {
		const timedOut = () => {
			this.isTimeout = true;
			this.request?.abort();
		};

		if (this.timeout) {
			clearTimeout(this.timeout);
		}

		this.timeout = undefined;

		if (this.options.timeout) {
			this.timeout = setTimeout(timedOut, this.options.timeout);
		}

		const error = (errorMsg: string, request?: XMLHttpRequest) => {
			this.triggerError(errorMsg, request);
		};

		const success = (request: XMLHttpRequest) => {
			this.triggerSuccess(request);
		};
		this.getRequest(success, error).then((res) => {
			this.request = res;
		});
	}

	abort() {
		this.request?.abort();
	}

	defaultXHR() {
		const { context, crossOrigin } = this.options;
		if (!context) return;
		// is it x-domain
		if (crossOrigin === true) {
			const xhrInstance = context[XML_HTTP_REQUEST]
				? new context[XML_HTTP_REQUEST]()
				: null;
			if (xhrInstance && 'withCredentials' in xhrInstance) {
				return xhrInstance;
			}
			if (context[X_DOMAIN_REQUEST]) {
				return new context[X_DOMAIN_REQUEST]();
			}
			throw new Error('Browser does not support cross-origin requests');
		} else if (context[XML_HTTP_REQUEST]) {
			return new context[XML_HTTP_REQUEST]();
		} else {
			return new context.ActiveXObject('Microsoft.XMLHTTP');
		}
	}

	succeed() {
		const { url, context } = this.options;
		const protocol = PROTOCO_REG.exec(url);
		let protocolValue = protocol ? protocol[1] : '';
		if (!protocolValue) {
			protocolValue = context?.location.protocol || '';
		}
		return HTTP_REG.test(protocolValue)
			? TWO_HUNDO.test(this.request?.status?.toString() || '')
			: !!this.request?.response;
	}

	noop() {}

	handleReadyState(
		success: (request?: XMLHttpRequest) => void,
		error: (statusText: string, request?: XMLHttpRequest) => void,
	) {
		// use _aborted to mitigate against IE err c00c023f
		// (can't read props on aborted request objects)
		if (this.isAborted) {
			return error('Request is aborted', this.request);
		}
		if (this.isTimeout) {
			return error('Request is aborted: timeout', this.request);
		}
		if (this.request && this.request[READY_STATE] === 4) {
			this.request.onreadystatechange = this.noop;
			if (this.succeed()) {
				success(this.request);
			} else {
				error(this.request.statusText, this.request);
			}
		}
	}

	setHeaders(request: XMLHttpRequest, headers: Record<string, string>) {
		headers.Accept =
			headers.Accept || globalSetup.accept[this.options.type || '*'];
		// breaks cross-origin requests with legacy browsers
		if (!this.options.crossOrigin && !headers[REQUESTED_WITH]) {
			headers[REQUESTED_WITH] = globalSetup.requestedWith;
		}
		if (!headers[CONTENT_TYPE] && !isFormData(this.options.data)) {
			headers[CONTENT_TYPE] =
				this.options.contentType || globalSetup.contentType;
		}
		Object.keys(headers).forEach((name) => {
			request.setRequestHeader(name, headers[name]);
		});
	}

	setCredentials(request: XMLHttpRequest) {
		if (
			typeof this.options.withCredentials !== 'undefined' &&
			typeof request.withCredentials !== 'undefined'
		) {
			request.withCredentials = !!this.options.withCredentials;
		}
	}

	generalCallback(data: any) {
		this.callbackData = data;
	}

	getCallbackPrefix(id: string | number) {
		return this.callbackPrefix + '_' + id;
	}

	handleJsonp(
		url: string,
		success: (data: any) => void,
		error: (errorMsg: string) => void,
	): XMLHttpRequest | undefined {
		const { jsonpCallback, jsonpCallbackName, doc, context } = this.options;
		if (!doc || !context) return;
		const requestId = this.uuid++;
		const cbkey = jsonpCallback || 'callback'; // the 'callback' key
		let cbval = jsonpCallbackName || this.getCallbackPrefix(requestId);
		const cbreg = new RegExp('((^|\\?|&)' + cbkey + ')=([^&]+)');
		const match = url.match(cbreg);
		const script = doc.createElement('script');
		let loaded = 0;
		const isIE10 = navigator.userAgent.indexOf('MSIE 10.0') !== -1;

		if (match) {
			if (match[3] === '?') {
				url = url.replace(cbreg, '$1=' + cbval); // wildcard callback func name
			} else {
				cbval = match[3]; // provided callback func name
			}
		} else {
			url = urlAppend(url, cbkey + '=' + cbval); // no callback details, add 'em
		}

		context[cbval] = this.generalCallback;

		script.type = 'text/javascript';
		script.src = url;
		script.async = true;
		if (typeof script['onreadystatechange'] !== 'undefined' && !isIE10) {
			// need this for IE due to out-of-order onreadystatechange(), binding script
			// execution to an event listener gives us control over when the script
			// is executed. See http://jaubourg.net/2010/07/loading-script-as-onclick-handler-of.html
			script.htmlFor = script.id = '_request_' + requestId;
		}

		script.onload = script['onreadystatechange'] = () => {
			if (
				(script[READY_STATE] &&
					script[READY_STATE] !== 'complete' &&
					script[READY_STATE] !== 'loaded') ||
				loaded
			) {
				return false;
			}
			script.onload = script['onreadystatechange'] = null;
			if (script.onclick) {
				(script as any).onclick();
			}
			// Call the user callback with the last value stored and clean up values and scripts.
			success(this.callbackData);
			this.callbackData = undefined;
			this.headNode?.removeChild(script);
			loaded = 1;
			return true;
		};

		// Add the script to the DOM head
		this.headNode?.appendChild(script);

		// Enable JSONP timeout
		return {
			abort: () => {
				script.onload = script['onreadystatechange'] = null;
				error('Request is aborted: timeout');
				this.callbackData = undefined;
				this.headNode?.removeChild(script);
				loaded = 1;
			},
		} as XMLHttpRequest;
	}

	async getRequest(
		success: (data: any) => void,
		error: (errorMsg: string, request?: XMLHttpRequest) => void,
	): Promise<XMLHttpRequest | undefined> {
		const method = this.options.method?.toUpperCase() || 'GET';
		// convert non-string objects to query-string form unless o.processData is false
		const { processData, traditional, type, context, xhr, async, before } =
			this.options;
		if (!context) return Promise.resolve(undefined);

		let { url } = this.options;
		let data: any = this.options.data;
		// get data
		if (typeof data === 'function') {
			data = await data();
		}
		if (
			(this.options.contentType?.indexOf('json') || -1) > -1 &&
			typeof data === 'object' &&
			!isFormData(data)
		) {
			data = JSON.stringify(data);
		}

		data =
			processData !== false &&
			data &&
			typeof data !== 'string' &&
			!isFormData(data)
				? toQueryString(data, traditional || globalSetup.traditional)
				: data || null;

		let http: XMLHttpRequest | undefined = undefined;
		let sendWait = false;

		// if we're working on a GET request and we have data then we should append
		// query string to end of URL and not post data
		if ((type === 'jsonp' || method === 'GET') && data) {
			url = urlAppend(url, data);
			data = null;
		}

		if (type === 'jsonp') {
			return Promise.resolve(this.handleJsonp(url, success, error));
		}
		// get headers
		let headers: RequestHeaders = this.options.headers || {};
		if (typeof headers === 'function') {
			headers = await headers();
		}
		// get the xhr from the factory if passed
		// if the factory returns null, fall-back to ours
		http =
			(typeof xhr === 'function' ? xhr(this.options) : xhr) ||
			this.defaultXHR();
		if (!http) return;
		http.open(method, url, async === false ? false : true);
		this.setHeaders(http, headers);
		this.setCredentials(http);
		if (
			context[X_DOMAIN_REQUEST] &&
			http instanceof context[X_DOMAIN_REQUEST]
		) {
			http.onload = success;
			http.onerror = function () {
				error('http error', http);
			};
			// NOTE: see
			// http://social.msdn.microsoft.com/Forums/en-US-US/iewebdevelopment/thread/30ef3add-767c-4436-b8a9-f1ca19b4812e
			http.onprogress = this.noop;
			sendWait = true;
		} else {
			http.onreadystatechange = () => {
				this.handleReadyState(success, error);
			};
		}
		if (before) {
			before(http);
		}
		if (sendWait) {
			setTimeout(() => {
				http?.send(data);
			}, 200);
		} else {
			http.send(data);
		}
		return Promise.resolve(http);
	}

	getType(type?: string | null) {
		// json, javascript, text/plain, text/html, xml
		if (!type) {
			return undefined;
		}
		if (type.match('json')) {
			return 'json';
		}
		if (type.match('javascript')) {
			return 'js';
		}
		if (type.match('text')) {
			return 'html';
		}
		if (type.match('xml')) {
			return 'xml';
		}
		return undefined;
	}

	triggerSuccess(request: XMLHttpRequest) {
		const { dataFilter, context, success } = this.options;
		if (!context) return;
		let { type } = this.options;
		// use global data filter on response text
		const data = (dataFilter || globalSetup.dataFilter)(
			request.responseText,
			type,
		);
		if (!type) {
			type =
				request &&
				this.getType(request.getResponseHeader('Content-Type'));
		}
		// resp can be undefined in IE
		let response: any = type !== 'jsonp' ? this.request : request;
		try {
			response['responseText'] = data;
		} catch (e) {
			// can't assign this in IE<=8, just ignore
		}
		if (data) {
			switch (type) {
				case 'json':
					try {
						response = context.JSON.parse(data);
					} catch (err) {
						return this.triggerError(
							'Could not parse JSON in response',
							response,
						);
					}
					break;
				case 'html':
					response = data;
					break;
				case 'xml':
					response =
						response.responseXML &&
						response.responseXML.parseError &&
						response.responseXML.parseError.errorCode &&
						response.responseXML.parseError.reason
							? null
							: response.responseXML;
					break;
				default:
					break;
			}
		}

		if (success) {
			success(response);
		}
		this.triggerComplete(response);
		if (this.__resolve) this.__resolve(response);
	}

	triggerError(errorMsg: string, request?: XMLHttpRequest) {
		const { error } = this.options;
		const e = new Error(errorMsg);
		e['xhr'] = request;
		if (error) {
			error(e);
		}
		this.triggerComplete(e);
		if (this.__reject) this.__reject(e);
	}

	triggerComplete(request: XMLHttpRequest | Error) {
		const { complete } = this.options;
		if (this.timeout) {
			clearTimeout(this.timeout);
		}
		this.timeout = undefined;

		if (complete) {
			complete(request);
		}
	}

	retry() {
		this.initPromise();
		this.init();
	}

	then(success: (data: any) => void, fail?: (reason?: any) => void) {
		return this.promise?.then(success, fail);
	}

	always(fn: (data: any) => void) {
		return this.promise?.then(fn, fn);
	}

	fail(fn: (reason?: any) => void) {
		return this.promise?.then(undefined, fn);
	}

	catch(fn: (reason?: any) => void) {
		return this.fail(fn);
	}
}

export default Ajax;
