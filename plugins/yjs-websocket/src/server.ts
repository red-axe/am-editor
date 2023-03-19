import { ServerOptions, startServer } from './server/start';

export default (options: Partial<ServerOptions> = {}) => {
	const {
		host = process.env.HOST || '0.0.0.0',
		port = parseInt(process.env.PORT || '1234') || 1234,
		auth = (request) =>
			request.url
				? Promise.resolve(request.url.slice(1).split('?')[0] || '')
				: Promise.reject('auth not implemented'),
	} = options;
	return startServer({
		auth,
		...options,
		host,
		port,
	});
};
