const { Controller } = require('egg');

const doc = {
	id: 'demo',
	content: {
		value:
			'<p data-id="daab65504017af77a36594f98ab4875d">Hello<strong>AoMao</strong></p><card type="block" name="hr" value="data:%7B%22id%22%3A%22eIxTM%22%7D"></card>',
		paths: [],
	},
};

class DocController extends Controller {
	async content() {
		const { ctx, app } = this;

		const { content } = ctx.request.body;

		doc.content = content;

		ctx.body = { code: 200, message: '' };
	}

	async get() {
		const { ctx } = this;
		ctx.body = { code: 200, message: '', data: doc.content };
	}
}

module.exports = DocController;
