'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
	const { router, controller } = app;
	router.post('/upload/image', controller.upload.image);
	router.get('*', controller.home.index);
};
