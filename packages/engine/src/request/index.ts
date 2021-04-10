import {
	EditorInterface,
	RequestInterface,
	AjaxOptions,
	UploaderOptions,
	OpenDialogOptions,
} from '../types';
import Ajax from './ajax';
import Uploader, { getExtensionName } from './uploader';

class Request implements RequestInterface {
	private editor: EditorInterface;

	constructor(editor: EditorInterface) {
		this.editor = editor;
	}

	ajax(options: AjaxOptions | string) {
		return new Ajax(options);
	}

	upload(options: UploaderOptions, files: Array<File>) {
		return new Uploader(options).request(files);
	}

	getFiles(options?: OpenDialogOptions) {
		let { event, accept, multiple } = options || {};
		accept = accept || '*';
		multiple = typeof multiple === undefined ? 100 : multiple;
		const { $ } = this.editor;
		const input = $(
			`<input type="file" accept="${accept}" style="display:none" ${
				multiple !== false ? "multiple='multiple'" : ''
			} />`,
		);
		const element = input.get<HTMLInputElement>()!;

		const remove = () => {
			input.remove();
			document.removeEventListener('mousedown', remove);
		};
		return new Promise<Array<File>>(resolve => {
			input.on('change', () => {
				const files = [];
				for (let i = 0; i < (element.files?.length || 0); i++) {
					if (typeof multiple === 'number' && i > multiple) break;

					files.push(element.files![i]);
				}
				remove();
				resolve(files);
			});
			$(document.body).append(input);
			if (!event) {
				event = document.createEvent('MouseEvents');
				event.initEvent('click', true, true);
			}
			try {
				if (!!element.dispatchEvent) {
					element.dispatchEvent(event);
				} else if (!!element['fireEvent']) {
					element['fireEvent'](event);
				} else throw '';

				document.addEventListener('mousedown', remove);
			} catch (error) {
				resolve([]);
			}
		});
	}
}
export { getExtensionName, Ajax, Uploader };
export default Request;
