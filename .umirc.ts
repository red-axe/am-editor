import { defineConfig } from 'dumi';

export default defineConfig({
	title: 'am-editor 多人协同编辑器',
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
			title: '指南',
			path: '/guide',
		},
		{
			title: '配置',
			path: '/config',
		},
		{
			title: '插件',
			path: '/plugin',
		},
		{
			title: 'AoMao',
			path: 'https://www.aomao.com',
		},
		{
			title: 'Github',
			path: 'https://github.com/itellyou-com/am-editor',
		},
	],
	menus: {
		'/plugin': [
			{
				title: '插件列表',
				children: [
					'/plugin/plugin-alignment',
					'/plugin/plugin-backcolor',
					'/plugin/plugin-bold',
					'/plugin/plugin-code',
					'/plugin/plugin-codelock',
					'/plugin/plugin-fontcolor',
					'/plugin/plugin-fontsize',
					'/plugin/plugin-heading',
					'/plugin/plugin-hr',
					'/plugin/plugin-indent',
					'/plugin/plugin-italic',
					'/plugin/plugin-image',
					'/plugin/plugin-link',
					'/plugin/plugin-mark',
					'/plugin/plugin-orderedlist',
					'/plugin/plugin-paintformat',
					'/plugin/plugin-quote',
					'/plugin/plugin-redo',
					'/plugin/plugin-removeformat',
					'/plugin/plugin-selectall',
					'/plugin/plugin-strikethrough',
					'/plugin/plugin-sub',
					'/plugin/plugin-sup',
					'/plugin/plugin-tasklist',
					'/plugin/plugin-underline',
					'/plugin/plugin-undo',
					'/plugin/plugin-unorderedlist',
				],
			},
		],
	},
	manifest: {
		fileName: 'manifest.json',
	},
	// more config: https://d.umijs.org/config
});
