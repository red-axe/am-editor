import {
	RequestInterface,
	AjaxOptions,
	UploaderOptions,
	OpenDialogOptions,
} from '../types';
import Ajax from './ajax';
import Uploader, { getExtensionName, getFileSize } from './uploader';

class Request implements RequestInterface {
	ajax(options: AjaxOptions | string) {
		return new Ajax(options);
	}

	upload(options: UploaderOptions, files: Array<File>, name?: string) {
		return new Uploader(options).request(files, name);
	}

	getFiles(options?: OpenDialogOptions) {
		let { event, accept, multiple } = options || {};
		accept = accept || '*';
		multiple = typeof multiple === undefined ? 100 : multiple;
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = accept;
		input.style.display = 'none';
		input.multiple = multiple !== false;

		const remove = () => {
			input.remove();
			document.removeEventListener('mousedown', remove);
		};

		return new Promise<Array<File>>((resolve) => {
			const change = () => {
				const files = [];
				for (let i = 0; i < (input.files?.length || 0); i++) {
					if (typeof multiple === 'number' && i > multiple) break;

					files.push(input.files![i]);
				}
				input.removeEventListener('change', change);
				remove();
				resolve(files);
			};

			input.addEventListener('change', change);

			document.body.appendChild(input);
			if (!event) {
				event = document.createEvent('MouseEvents');
				event.initEvent('click', true, true);
			}
			try {
				if (!!input.dispatchEvent) {
					input.dispatchEvent(event);
				} else if (!!input['fireEvent']) {
					input['fireEvent'](event);
				} else throw '';
				document.addEventListener('mousedown', remove);
			} catch (error) {
				input.removeEventListener('change', change);
				remove();
				resolve([]);
			}
		});
	}
}
export { getExtensionName, Ajax, Uploader, getFileSize };
export default Request;
