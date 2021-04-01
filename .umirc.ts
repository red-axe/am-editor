import { defineConfig } from 'dumi';

export default defineConfig({
	title: 'AoMao Collaborative Editor',
	favicon: 'https://cdn-object.itellyou.com/icon/shortcut.png',
	logo: 'https://cdn-object.itellyou.com/icon/icon.svg',
	outputPath: 'docs-dist',
	mode: 'site',
	ssr: {
		devServerRender: false,
	},
	navs: [
		{
			title: '首页',
			path: '/',
		},
		{
			title: '文档',
			path: '/docs',
		},
	],
	// more config: https://d.umijs.org/config
});
