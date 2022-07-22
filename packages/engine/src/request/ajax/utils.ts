export const buildParams = (
	prefix: string,
	data: any,
	traditional: boolean,
	add: (key: string, value?: string | (() => string)) => void,
) => {
	let name = undefined;
	let i = undefined;
	let v = undefined;
	const rbracket = /\[\]$/;

	if (Array.isArray(data)) {
		// Serialize array item.
		for (i = 0; i < data.length; i++) {
			const value = data[i];
			if (traditional || rbracket.test(prefix)) {
				// Treat each array item as a scalar.
				add(prefix, value);
			} else {
				buildParams(
					prefix +
						'[' +
						((typeof value === 'undefined'
							? 'undefined'
							: typeof value) === 'object'
							? i
							: '') +
						']',
					value,
					traditional,
					add,
				);
			}
		}
	} else if (data.toString() === '[object Object]') {
		// Serialize object item.
		for (name in data) {
			if (data.hasOwnProperty(name)) {
				buildParams(
					prefix + '[' + name + ']',
					data[name],
					traditional,
					add,
				);
			}
		}
	} else {
		// Serialize scalar item.
		add(prefix, data);
	}
};

/**
 * URL 追加
 * @param url url
 * @param text 要追加的文本
 * @returns
 */
export const urlAppend = (url: string, text: string) => {
	return url + (/\?/.test(url) ? '&' : '?') + text;
};

export const toQueryString = (
	data: Array<{ name: string; value: any }> | { name: string; value: any },
	traditional: boolean = false,
) => {
	let prefix = undefined;
	let values: Array<string> = [];

	const add = (key: string, value?: string | (() => string)) => {
		// If value is a function, invoke it and return its value
		if (typeof value === 'function') {
			value = value();
		} else if (value === null || value === undefined) {
			value = '';
		}
		values[values.length] =
			encodeURIComponent(key) + '=' + encodeURIComponent(value);
	};

	// If an array was passed in, assume that it is an array of form elements.
	if (Array.isArray(data)) {
		for (let i = 0; i < data.length; i++) {
			add(data[i].name, data[i].value);
		}
	} else {
		// If traditional, encode the "old" way (the way 1.3.2 or older
		// did it), otherwise encode params recursively.
		for (prefix in data) {
			if (data.hasOwnProperty(prefix)) {
				buildParams(prefix, data[prefix], traditional, add);
			}
		}
	}
	// spaces should be + according to spec
	return values.join('&').replace(/%20/g, '+');
};

export const isFormData = (data: any): data is FormData => {
	return typeof FormData !== 'undefined' && data instanceof FormData;
};
