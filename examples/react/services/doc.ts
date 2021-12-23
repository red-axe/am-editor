import { Path, Request } from '@aomao/engine';

const request = new Request();

export const get = () => {
	return request.ajax({
		url: `/api/doc/get`,
	});
};

export const update = (payload: {
	value: string;
	paths: Array<{ id: Array<string>; path: Array<Path> }>;
}) => {
	return request.ajax({
		url: `/api/doc/content`,
		method: 'POST',
		data: {
			content: payload,
		},
	});
};
