const { Controller } = require('egg');
const { JSDOM } = require('jsdom');

const { window } = new JSDOM(`<html><body></body></html>`);
global.__amWindow = window;

class HomeController extends Controller {
	constructor(ctx) {
		super(ctx);
		this.serverRender = require(this.config.umiServerPath);
	}
	async index() {
		const { ctx, app } = this;
		global.host = `${ctx.request.protocol}://${ctx.request.host}`;
		global.href = ctx.request.href;
		global._cookies = ctx.helper.parseCookie(ctx);
		global._navigatorLang = ctx.helper.parseNavLang(ctx);

		/**
		 *  这里可以根据自己的环境配置修改，
		 *  规则就是开发环境需要删除require缓存
		 *  重新load文件
		 *
		 */
		const isDev = app.config.env != 'prod';
		if (isDev) {
			delete require.cache[require.resolve(this.config.umiServerPath)];
		}
		// 先走 eggjs 的view 渲染
		const htmlTemplate = await ctx.view.render(
			isDev ? 'dev.html' : 'index.html',
			isDev
				? {
						domain: this.config.domain.replace(
							'{port}',
							this.config.cluster.listen.port,
						),
						assetsDomain: this.config.domain.replace(
							'{port}',
							this.config.assets.devServer.port,
						),
				  }
				: {},
		);

		// 将 html 模板传到服务端渲染函数中
		const { error, html } = await this.serverRender({
			path: ctx.url,
			getInitialPropsCtx: {},
			htmlTemplate,
		});

		if (error) {
			ctx.logger.error(
				'[SSR ERROR] 渲染报错，切换至客户端渲染',
				error,
				ctx.url,
			);
		}
		ctx.type = 'text/html';
		ctx.status = 200;
		ctx.body = html;
	}
}

module.exports = HomeController;
