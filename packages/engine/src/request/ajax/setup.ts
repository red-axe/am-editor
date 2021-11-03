import { XML_HTTP_REQUEST } from './constants';

export default {
	traditional: false,
	contentType: 'application/x-www-form-urlencoded',
	requestedWith: XML_HTTP_REQUEST,
	accept: {
		'*': 'text/javascript, text/html, application/xml, text/xml, */*',
		xml: 'application/xml, text/xml',
		html: 'text/html',
		text: 'text/plain',
		json: 'application/json, text/javascript',
		js: 'application/javascript, text/javascript',
	},
	dataFilter: (data: any) => {
		return data;
	},
};
