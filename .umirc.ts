import { defineConfig } from 'dumi';

export default defineConfig({
	title: 'am-editor 多人协同编辑器',
	favicon: 'https://cdn-object.aomao.com/icon/shortcut.png',
	logo: 'https://cdn-object.aomao.com/icon/icon.svg',
	outputPath: 'docs-dist',
	mode: 'site',
	ssr: {
		devServerRender: false,
	},
	navs: [
		{
			title: '编辑',
			path: '/',
		},
		{
			title: '阅读',
			path: '/view',
		},
		{
			title: '文档',
			path: '/docs',
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
			title: 'API',
			path: '/api',
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
		'/docs': [
			{
				title: '介绍',
				children: ['/docs/README', '/docs/getting-started'],
			},
			{
				title: '基础',
				children: [
					'/docs/concepts-node',
					'/docs/concepts-schema',
					'/docs/concepts-range',
					'/docs/concepts-editor',
					'/docs/concepts-event',
					'/docs/concepts-plugin',
					'/docs/concepts-history',
				],
			},
			{
				title: '资源文件',
				children: ['/docs/resources-icon'],
			},
			{
				title: '贡献',
				path: '/docs/contributing',
			},
			{
				title: 'FAQ',
				path: '/docs/faq',
			},
		],
		'/plugin': [
			{
				title: '教程',
				children: [
					{
						title: '基础',
						path: '/plugin/tutorials',
						exact: true,
					},
					'plugin/tutorials-element',
					'plugin/tutorials-mark',
					'plugin/tutorials-inline',
					'plugin/tutorials-block',
					'plugin/tutorials-list',
					'plugin/tutorials-card',
				],
			},
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
					{
						title: '@aomao/plugin-mark',
						path: '/plugin/plugin-mark',
						exact: true,
					},
					'/plugin/plugin-mark-range',
					'/plugin/plugin-orderedlist',
					'/plugin/plugin-paintformat',
					'/plugin/plugin-quote',
					'/plugin/plugin-redo',
					'/plugin/plugin-removeformat',
					'/plugin/plugin-selectall',
					'/plugin/plugin-strikethrough',
					'/plugin/plugin-sub',
					'/plugin/plugin-sup',
					'/plugin/plugin-table',
					'/plugin/plugin-tasklist',
					'/plugin/plugin-underline',
					'/plugin/plugin-undo',
					'/plugin/plugin-unorderedlist',
				],
			},
		],
		'/api': [
			{
				title: '节点',
				children: [
					'/api/node',
					'/api/editor-node',
					'/api/editor-mark',
					'/api/editor-inline',
					'/api/editor-block',
					'/api/editor-list',
				],
			},
			{
				title: '卡片',
				children: [
					{
						title: 'Card',
						path: '/api/editor-card',
						exact: true,
					},
					'/api/editor-card-toolbar',
					'/api/editor-card-resize',
					'/api/editor-card-maximize',
				],
			},
			{
				title: '结构',
				path: '/api/schema',
			},
			{
				title: '光标',
				children: ['/api/range', '/api/selection'],
			},
			{
				title: '历史',
				path: '/api/history',
			},
			{
				title: '编辑器',
				children: [
					{
						title: 'Change',
						path: '/api/editor-change',
						children: ['/api/editor-change-event'],
					},
					{
						title: '共有属性和方法',
						path: '/api/editor',
						exact: true,
					},
					{
						title: '引擎',
						path: '/api/engine',
					},
					{
						title: '阅读器',
						path: '/api/view',
					},
				],
			},
			{
				title: '语言',
				path: '/api/language',
			},
			{
				title: '命令',
				path: '/api/command',
			},
			{
				title: '常量',
				path: '/api/constants',
			},
			{
				title: '热键',
				path: '/api/hotkey',
			},
			{
				title: '剪贴板',
				path: '/api/clipboard',
			},
			{
				title: '解析器',
				path: '/api/parser',
			},
			{
				title: '实用方法/常量',
				path: '/api/utils',
			},
		],
	},
	manifest: {
		fileName: 'manifest.json',
	},
	// more config: https://d.umijs.org/config
});
