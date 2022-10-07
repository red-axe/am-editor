export default (opts: {
	lang?: string;
	base: '/docs' | '/plugin' | '/api';
}) => {
	const menus = {
		'/docs': [
			{
				title: 'Introduction',
				'title_zh-CN': '基础',
				children: ['/docs/README', '/docs/getting-started'],
			},
			{
				title: 'Basis',
				'title_zh-CN': '概念',
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
				'title_zh-CN': '资源',
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
				title: 'Plugin development',
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
					'/plugin/plugin-embed',
					'/plugin/plugin-file',
					'/plugin/plugin-fontcolor',
					'/plugin/plugin-fontsize',
					'/plugin/plugin-fontfamily',
					'/plugin/plugin-heading',
					'/plugin/plugin-hr',
					'/plugin/plugin-indent',
					'/plugin/plugin-italic',
					'/plugin/plugin-image',
					'/plugin/plugin-link',
					'/plugin/plugin-line-height',
					'/plugin/plugin-lightblock',
					{
						title: '@aomao/plugin-mark',
						path: '/plugin/plugin-mark',
						exact: true,
					},
					'/plugin/plugin-mark-range',
					'/plugin/plugin-math',
					'/plugin/plugin-mention',
					'/plugin/plugin-mermaid',
					'/plugin/plugin-orderedlist',
					'/plugin/plugin-paintformat',
					'/plugin/plugin-quote',
					'/plugin/plugin-redo',
					'/plugin/plugin-removeformat',
					'/plugin/plugin-selectall',
					'/plugin/plugin-strikethrough',
					'/plugin/plugin-status',
					'/plugin/plugin-sub',
					'/plugin/plugin-sup',
					'/plugin/plugin-table',
					'/plugin/plugin-tasklist',
					'/plugin/plugin-underline',
					'/plugin/plugin-undo',
					'/plugin/plugin-unorderedlist',
					'/plugin/plugin-video',
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
					'/api/editor-node-id',
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
				'title_zh-CN': 'Schema',
				path: '/api/schema',
			},
			{
				title: 'Range',
				'title_zh-CN': 'Range',
				children: ['/api/range', '/api/selection'],
			},
			{
				title: 'History',
				'title_zh-CN': 'History',
				path: '/api/history',
			},
			{
				title: 'Editor',
				'title_zh-CN': 'Editor',
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
							`${
								opts.lang === 'zh-CN' ? '/zh-CN' : ''
							}/api/editor-change-range`,
						],
					},
					{
						title:
							opts.lang === 'zh-CN'
								? 'Engine & View'
								: 'Common attributes and methods',
						path: `${
							opts.lang === 'zh-CN' ? '/zh-CN' : ''
						}/api/editor`,
						exact: true,
					},
					{
						title: opts.lang === 'zh-CN' ? 'Engine' : 'Engine',
						path: `${
							opts.lang === 'zh-CN' ? '/zh-CN' : ''
						}/api/engine`,
					},
					{
						title: opts.lang === 'zh-CN' ? 'View' : 'View',
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
};
