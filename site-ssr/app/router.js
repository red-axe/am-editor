'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = (app) => {
	const { router, controller } = app;
	router.post('/upload/image', controller.upload.image);
	router.post('/upload/file', controller.upload.file);
	router.post('/upload/video', controller.upload.video);
	router.get('/upload/video-query', controller.upload.videoQuery);
	router.post('/doc/content', controller.doc.content);
	router.post('/comment/add', controller.comment.add);
	router.post('/comment/remove', controller.comment.remove);
	router.post('/comment/update', controller.comment.update);
	router.post('/comment/updateStatus', controller.comment.updateStatus);
	router.get('/comment/list', controller.comment.list);
	router.get('/comment/find', controller.comment.find);
	router.get('/doc/get', controller.doc.get);
	router.get('/user/search', controller.user.search);
	router.get('*', controller.home.index);
};
