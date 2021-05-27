import { defineConfig } from 'dumi';

function getMenus(opts: { lang?: string; base: '/docs' | '/plugin' | '/api' }) {
	const menus = {
		'/docs': [
			{
				title: 'Introduction',
				'title_zh-CN': '介绍',
				children: ['/docs/README', '/docs/getting-started'],
			},
			{
				title: 'Basis',
				'title_zh-CN': '基础',
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
				title: 'Resource',
				'title_zh-CN': '资源文件',
				children: ['/docs/resources-icon'],
			},
			{
				title: 'Contribution',
				'title_zh-CN': '贡献',
				path: '/docs/contributing',
			},
			{
				title: 'FAQ',
				path: '/docs/faq',
			},
		],
		'/plugin': [
			{
				title: 'Plug-in development',
				'title_zh-CN': '插件开发',
				children: [
					{
						title: opts.lang === 'zh-CN' ? '基础' : 'Basis',
						path: `${
							opts.lang === 'zh-CN' ? '/zh-CN' : ''
						}/plugin/tutorials`,
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
				title: 'List of plugins',
				'title_zh-CN': '插件列表',
				children: [
					'/plugin/plugin-alignment',
					'/plugin/plugin-backcolor',
					'/plugin/plugin-bold',
					'/plugin/plugin-code',
					'/plugin/plugin-codelock',
					'/plugin/plugin-file',
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
				title: 'Node',
				'title_zh-CN': 'DOM节点',
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
				title: 'Card',
				'title_zh-CN': '卡片',
				children: [
					{
						title: 'Card',
						path: `${
							opts.lang === 'zh-CN' ? '/zh-CN' : ''
						}/api/editor-card`,
						exact: true,
					},
					'/api/editor-card-toolbar',
					'/api/editor-card-resize',
					'/api/editor-card-maximize',
				],
			},
			{
				title: 'Schema',
				'title_zh-CN': '架构',
				path: '/api/schema',
			},
			{
				title: 'Range',
				'title_zh-CN': '光标范围',
				children: ['/api/range', '/api/selection'],
			},
			{
				title: 'History',
				'title_zh-CN': '历史记录',
				path: '/api/history',
			},
			{
				title: 'Editor',
				'title_zh-CN': '编辑器',
				children: [
					{
						title: 'Change',
						path: `${
							opts.lang === 'zh-CN' ? '/zh-CN' : ''
						}/api/editor-change`,
						children: [
							`${
								opts.lang === 'zh-CN' ? '/zh-CN' : ''
							}/api/editor-change-event`,
						],
					},
					{
						title:
							opts.lang === 'zh-CN'
								? '共有属性和方法'
								: 'Common attributes and methods',
						path: `${
							opts.lang === 'zh-CN' ? '/zh-CN' : ''
						}/api/editor`,
						exact: true,
					},
					{
						title: opts.lang === 'zh-CN' ? '引擎' : 'Engine',
						path: `${
							opts.lang === 'zh-CN' ? '/zh-CN' : ''
						}/api/engine`,
					},
					{
						title: opts.lang === 'zh-CN' ? '阅读器' : 'View',
						path: `${
							opts.lang === 'zh-CN' ? '/zh-CN' : ''
						}/api/view`,
					},
				],
			},
			{
				title: 'Language',
				'title_zh-CN': '语言',
				path: '/api/language',
			},
			{
				title: 'Command',
				'title_zh-CN': '命令',
				path: '/api/command',
			},
			{
				title: 'Constants',
				'title_zh-CN': '常量',
				path: '/api/constants',
			},
			{
				title: 'Hotkey',
				'title_zh-CN': '热键',
				path: '/api/hotkey',
			},
			{
				title: 'Clipboard',
				'title_zh-CN': '剪贴板',
				path: '/api/clipboard',
			},
			{
				title: 'Parser',
				'title_zh-CN': '解析器',
				path: '/api/parser',
			},
			{
				title: 'Utility method/constant',
				'title_zh-CN': '实用方法/常量',
				path: '/api/utils',
			},
		],
	};
	return (menus[opts.base] as []).map((menu: any) => {
		if (!opts.lang) return menu;
		return {
			...menu,
			title: menu[`title_${opts.lang}`] || menu.title,
		};
	});
}

export default defineConfig({
	title: 'AoMao Editor',
	favicon: 'https://cdn-object.aomao.com/icon/shortcut.png',
	logo: 'https://cdn-object.aomao.com/icon/icon.svg',
	outputPath: 'docs-dist',
	hash: true,
	mode: 'site',
	locales: [
		['en-US', 'English'],
		['zh-CN', '中文'],
	],
	ssr: {
		devServerRender: false,
		removeWindowInitialProps: true,
	},
	navs: {
		'en-US': [
			{
				title: 'Edit',
				path: '/',
			},
			{
				title: 'View',
				path: '/view',
			},
			{
				title: 'Docs',
				path: '/docs',
			},
			{
				title: 'Config',
				path: '/config',
			},
			{
				title: 'Plug-in',
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
		'zh-CN': [
			{
				title: '编辑',
				path: '/zh-CN',
			},
			{
				title: '阅读',
				path: '/zh-CN/view',
			},
			{
				title: '文档',
				path: '/zh-CN/docs',
			},
			{
				title: '配置',
				path: '/zh-CN/config',
			},
			{
				title: '插件',
				path: '/zh-CN/plugin',
			},
			{
				title: 'API',
				path: '/zh-CN/api',
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
	},
	menus: {
		'/zh-CN/docs': getMenus({ lang: 'zh-CN', base: '/docs' }),
		'/docs': getMenus({ base: '/docs' }),
		'/zh-CN/plugin': getMenus({ lang: 'zh-CN', base: '/plugin' }),
		'/plugin': getMenus({ base: '/plugin' }),
		'/zh-CN/api': getMenus({ lang: 'zh-CN', base: '/api' }),
		'/api': getMenus({ base: '/api' }),
	},
	analytics: {
		baidu: 'c456d9579fec82a2ce1175db47c46efe',
	},
	manifest: {
		fileName: 'manifest.json',
	},
	headScripts: [
		`<script data-ad-client="ca-pub-3706417744839656" async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script>`,
	],
	// more config: https://d.umijs.org/config
});
