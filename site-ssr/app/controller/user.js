const { Controller } = require('egg');
const fs = require('fs');

const path = './app/data/user.json';

const getUsers = () => {
	try {
		const data = fs.readFileSync(path).toString();
		return JSON.parse(data);
	} catch (error) {
		console.log(error);
		return [];
	}
};

class UserController extends Controller {
	async search() {
		const { ctx, app } = this;

		const { keyword } = ctx.request.query;
		const users = getUsers();
		ctx.type = 'text/html';
		ctx.status = 200;
		ctx.body = {
			result: true,
			code: 200,
			message: '',
			data: users.filter(
				(user) =>
					user.name.toLowerCase().indexOf(keyword.toLowerCase()) > -1,
			),
		};
	}
}

module.exports = UserController;
