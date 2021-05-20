const { Controller } = require('egg');

const comments = [];

let index = 0;

class CommentController extends Controller {
	async add() {
		const { ctx, app } = this;

		const { title, render_id, content, username } = ctx.request.body;
		//自增编号
		index++;
		//获取评论集合
		let comment = comments.find(c => c.id === render_id);
		const isHave = !!comment;
		comment = comment || {
			id: render_id,
			title,
			status: true,
			children: [],
		};
		//加入子评论
		const info = {
			id: index,
			username,
			content,
			createdAt: new Date().getTime(),
		};
		comment.children.push(info);
		if (!isHave) comments.push(comment);
		ctx.body = { code: 200, message: '', data: info };
	}

	async remove() {
		const { ctx, app } = this;

		const { render_id, id } = ctx.request.body;
		//移除评论集合
		if (!!render_id && !id) {
			const index = comments.findIndex(c => c.id === render_id);
			if (index > -1) {
				comments.splice(index, 1);
			}
		}
		//移除单个评论
		else if (!!render_id && !!id) {
			comments.some((comment, index) => {
				const cIndex = comment.children.findIndex(
					c => c.id === parseInt(id, 10),
				);
				if (cIndex > -1) {
					comment.children.splice(cIndex, 1);
					if (comment.children.length === 0) {
						comments.splice(index, 1);
					}
					return true;
				}
			});
		}

		ctx.body = { code: 200, message: '' };
	}

	async update() {
		const { ctx, app } = this;

		const { render_id, id, content } = ctx.request.body;
		const index = comments.findIndex(c => c.id === render_id);
		if (index > -1) {
			const comment = comments[index].children.find(
				c => c.id === parseInt(id, 10),
			);
			comment.content = content;
			comment.createdAt = new Date().getTime();
			ctx.body = { code: 200, message: '', data: comment };
		} else {
			ctx.body = { code: 404, message: '' };
		}
	}

	async updateStatus() {
		const { ctx, app } = this;

		const { ids, status } = ctx.request.body;
		comments.forEach(comment => {
			if (ids.split(',').indexOf(comment.id) > -1) {
				comment.status = status;
			}
		});
		ctx.body = { code: 200, message: '', data: comments };
	}

	async list() {
		const { ctx } = this;
		ctx.body = { code: 200, message: '', data: comments };
	}

	async find() {
		const { render_id } = ctx.request.body;
		const comment = comments.findIndex(c => c.id === render_id);
		ctx.body = !!comment
			? { code: 200, message: '', data: comment }
			: { code: 404, message: 'Not found' };
	}
}

module.exports = CommentController;
