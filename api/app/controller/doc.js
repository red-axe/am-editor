const { Controller } = require('egg');

const fs = require('fs');

const path = './app/data/doc.json';

const getDoc = () => {
	try {
		const data = fs.readFileSync(path).toString();
		return JSON.parse(data);
	} catch (error) {
		console.log(error);
		return {
			value: '',
			paths: [],
		};
	}
};

const saveDoc = (doc) => {
	try {
		fs.writeFileSync(path, JSON.stringify(doc));
	} catch (error) {
		console.log(error);
	}
};

class DocController extends Controller {
	async content() {
		const { ctx, app } = this;

		const { content } = ctx.request.body;
		const doc = getDoc();
		if (!content.paths) content.paths = [];
		content.paths = content.paths.map((paths) => {
			const path = (paths.path || []).map((path) => {
				return (path || []).map((p) => parseInt(p, 10));
			});
			return { ...paths, path };
		});
		doc.content = content;
		saveDoc(doc);
		ctx.body = { code: 200, message: '' };
	}

	async get() {
		const { ctx } = this;
		const doc = getDoc();
		ctx.body = { code: 200, message: '', data: doc.content };
	}
}

module.exports = DocController;
