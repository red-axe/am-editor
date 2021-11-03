import { Path, Request } from '@aomao/engine';
import { DOMAIN } from '../config';

const request = new Request();

export const get = () => {
	return request.ajax({
		url: `${DOMAIN}/doc/get`,
	});
};

export const update = (payload: {
	value: string;
	paths: Array<{ id: Array<string>; path: Array<Path> }>;
}) => {
	return request.ajax({
		url: `${DOMAIN}/doc/content`,
		method: 'POST',
		data: {
			content: payload,
		},
	});
};
