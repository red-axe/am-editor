import { defineConfig } from 'dumi';
import getNavs from './nav.config';
import getRouters from './router.config';

export default defineConfig({
	title: 'AoMao Editor',
	favicon: 'https://cdn-object.aomao.com/icon/shortcut.png',
	logo: 'https://cdn-object.aomao.com/icon/icon.svg',
	outputPath: 'docs-dist',
	hash: true,
	mode: 'site',
	dynamicImport: {},
	locales: [
		['en-US', 'English'],
		['zh-CN', '中文'],
	],
	ssr: {
		devServerRender: false,
		removeWindowInitialProps: true,
	},
	navs: getNavs(),
	menus: {
		'/zh-CN/docs': getRouters({ lang: 'zh-CN', base: '/docs' }),
		'/docs': getRouters({ base: '/docs' }),
		'/zh-CN/plugin': getRouters({ lang: 'zh-CN', base: '/plugin' }),
		'/plugin': getRouters({ base: '/plugin' }),
		'/zh-CN/api': getRouters({ lang: 'zh-CN', base: '/api' }),
		'/api': getRouters({ base: '/api' }),
	},
	analytics: {
		baidu: '285af37fc760a8f865a67cb9120bfd8f',
	},
	manifest: {
		fileName: 'manifest.json',
	},
	metas: [
		{
			name: 'viewport',
			content:
				'viewport-fit=cover,width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no',
		},
		{
			name: 'apple-mobile-web-app-capable',
			content: 'yes',
		},
		{
			name: 'apple-mobile-web-app-status-bar-style',
			content: 'black',
		},
		{
			name: 'renderer',
			content: 'webkit',
		},
		{
			name: 'keywords',
			content:
				'Web富文本编辑器,React富文本编辑器,Vue富文本编辑器,协作编辑器,vue-editor, react-editor, aomao-editor, rich-text-editor',
		},
		{
			name: 'description',
			content:
				'一个适用于React、Vue等前端库的Web富文本编辑器。开箱即用，提供几十种丰富的编辑器插件来满足大部分需求，丰富的多媒体支持，不仅支持图片和音视频，还有卡片概念的加持，可以插入嵌入式多媒体内容，使用React、Vue等前端库可以在编辑器中渲染各种各样的内容。支持 Markdown 语法，内置协同编辑方案，轻量配置即可使用。',
		},
	],
	headScripts: [
		{
			src: 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js',
			'data-ad-client': 'ca-pub-3706417744839656',
		} as any,
	],
	proxy: {
		'/api/(latex|puml|graphviz|flowchart|mermaid)': {
			target: 'https://g.aomao.com/',
			changeOrigin: true,
			pathRewrite: { '^/api': '' },
		},
		'/api': {
			target: 'https://editor.aomao.com',
			changeOrigin: true,
			pathRewrite: { '^/api': '' },
		},
	},
	// scripts: [
	//   'https://unpkg.com/vconsole/dist/vconsole.min.js',
	//   'var vConsole = new window.VConsole();',
	// ],
	// more config: https://d.umijs.org/config
});
