import { $ } from '@aomao/engine';
import type {
	PluginEntry,
	CardEntry,
	PluginOptions,
	NodeInterface,
} from '@aomao/engine';
//引入插件 begin
import Redo from '@aomao/plugin-redo';
import type { RedoOptions } from '@aomao/plugin-redo';
import Undo from '@aomao/plugin-undo';
import type { UndoOptions } from '@aomao/plugin-undo';
import Bold from '@aomao/plugin-bold';
import type { BoldOptions } from '@aomao/plugin-bold';
import Code from '@aomao/plugin-code';
import type { CodeOptions } from '@aomao/plugin-code';
import Backcolor from '@aomao/plugin-backcolor';
import type { BackcolorOptions } from '@aomao/plugin-backcolor';
import Fontcolor from '@aomao/plugin-fontcolor';
import type { FontcolorOptions } from '@aomao/plugin-fontcolor';
import Fontsize from '@aomao/plugin-fontsize';
import type { FontsizeOptions } from '@aomao/plugin-fontsize';
import Italic from '@aomao/plugin-italic';
import type { ItalicOptions } from '@aomao/plugin-italic';
import Underline from '@aomao/plugin-underline';
import type { UnderlineOptions } from '@aomao/plugin-underline';
import Hr, { HrComponent } from '@aomao/plugin-hr';
import type { HrOptions } from '@aomao/plugin-hr';
import Tasklist, { CheckboxComponent } from '@aomao/plugin-tasklist';
import Orderedlist from '@aomao/plugin-orderedlist';
import Unorderedlist from '@aomao/plugin-unorderedlist';
import Indent from '@aomao/plugin-indent';
import Heading from '@aomao/plugin-heading';
import Strikethrough from '@aomao/plugin-strikethrough';
import Sub from '@aomao/plugin-sub';
import Sup from '@aomao/plugin-sup';
import Alignment from '@aomao/plugin-alignment';
import Mark from '@aomao/plugin-mark';
import Quote from '@aomao/plugin-quote';
import PaintFormat from '@aomao/plugin-paintformat';
import RemoveFormat from '@aomao/plugin-removeformat';
import SelectAll from '@aomao/plugin-selectall';
import Link from '@aomao/plugin-link';
import Codeblock, { CodeBlockComponent } from '@aomao/plugin-codeblock';
import Image, { ImageComponent, ImageUploader } from '@aomao/plugin-image';
import Table, { TableComponent } from '@aomao/plugin-table';
import MarkRange from '@aomao/plugin-mark-range';
import File, { FileComponent, FileUploader } from '@aomao/plugin-file';
import Video, { VideoComponent, VideoUploader } from '@aomao/plugin-video';
import Math, { MathComponent } from '@aomao/plugin-math';
import Fontfamily from '@aomao/plugin-fontfamily';
import Status, { StatusComponent } from '@aomao/plugin-status';
import LineHeight from '@aomao/plugin-line-height';
import Mention, { MentionComponent } from '@aomao/plugin-mention';
import Embed, { EmbedComponent } from '@aomao/plugin-embed';
import Test, { TestComponent } from './plugins/test';
import {
	ToolbarPlugin,
	ToolbarComponent,
	fontFamilyDefaultData,
} from '@aomao/toolbar';
import ReactDOM from 'react-dom';
import Loading from '../loading';
import Empty from 'antd/es/empty';
import 'antd/es/empty/style';

export const plugins: Array<PluginEntry> = [
	Redo,
	Undo,
	Bold,
	Code,
	Backcolor,
	Fontcolor,
	Fontsize,
	Italic,
	Underline,
	Hr,
	Tasklist,
	Orderedlist,
	Unorderedlist,
	Indent,
	Heading,
	Strikethrough,
	Sub,
	Sup,
	Alignment,
	Mark,
	Quote,
	PaintFormat,
	RemoveFormat,
	SelectAll,
	Link,
	Codeblock,
	Image,
	ImageUploader,
	Table,
	MarkRange,
	File,
	FileUploader,
	Video,
	VideoUploader,
	Math,
	ToolbarPlugin,
	Fontfamily,
	Status,
	LineHeight,
	Mention,
	Embed,
	Test,
];

export const cards: Array<CardEntry> = [
	HrComponent,
	CheckboxComponent,
	CodeBlockComponent,
	ImageComponent,
	TableComponent,
	FileComponent,
	VideoComponent,
	MathComponent,
	ToolbarComponent,
	StatusComponent,
	MentionComponent,
	TestComponent,
	EmbedComponent,
];

export const pluginConfig: { [key: string]: PluginOptions } = {
	[Table.pluginName]: {
		overflow: {
			maxLeftWidth: () => {
				// 编辑区域位置
				const rect = $('.am-engine')
					.get<HTMLElement>()
					?.getBoundingClientRect();
				const editorLeft = rect?.left || 0;
				// 减去大纲的宽度
				const width = editorLeft - $('.data-toc-wrapper').width();
				// 留 16px 的间隔
				return width <= 0 ? 0 : width - 16;
			},
			maxRightWidth: () => {
				// 编辑区域位置
				const rect = $('.am-engine')
					.get<HTMLElement>()
					?.getBoundingClientRect();
				const editorRigth = (rect?.right || 0) - (rect?.width || 0);
				// 减去评论区域的宽度
				const width = editorRigth - $('.doc-comment-layer').width();
				// 留 16px 的间隔
				return width <= 0 ? 0 : width - 16;
			},
		},
	},
	[MarkRange.pluginName]: {
		//标记类型集合
		keys: ['comment'],
	},
	[Italic.pluginName]: {
		// 默认为 _ 下划线，这里修改为单个 * 号
		markdown: '*',
	},
	[Image.pluginName]: {
		onBeforeRender: (status: string, url: string) => {
			if (!url || url.indexOf('http') === 0) return url;
			return url + `?token=12323`;
		},
	},
	[ImageUploader.pluginName]: {
		file: {
			action: '/api/upload/image',
			headers: { Authorization: 213434 },
		},
		remote: {
			action: '/api/upload/image',
		},
		isRemote: (src: string) => false,
	},
	[FileUploader.pluginName]: {
		action: '/api/upload/file',
	},
	[VideoUploader.pluginName]: {
		action: '/api/upload/video',
		limitSize: 1024 * 1024 * 50,
	},
	[Video.pluginName]: {
		onBeforeRender: (status: string, url: string) => {
			return url;
		},
	},
	[Math.pluginName]: {
		action: '/api/latex',
		parse: (res: any) => {
			if (res.success) return { result: true, data: res.svg };
			return { result: false };
		},
	},
	[Mention.pluginName]: {
		action: '/api/user/search',
		onLoading: (root: NodeInterface) => {
			return ReactDOM.render(<Loading />, root.get<HTMLElement>()!);
		},
		onEmpty: (root: NodeInterface) => {
			return ReactDOM.render(<Empty />, root.get<HTMLElement>()!);
		},
		onClick: (
			root: NodeInterface,
			{ key, name }: { key: string; name: string },
		) => {
			console.log('mention click:', key, '-', name);
		},
		onMouseEnter: (
			layout: NodeInterface,
			{ name }: { key: string; name: string },
		) => {
			ReactDOM.render(
				<div style={{ padding: 5 }}>
					<p>This is name: {name}</p>
					<p>配置 mention 插件的 onMouseEnter 方法</p>
					<p>此处使用 ReactDOM.render 自定义渲染</p>
					<p>Use ReactDOM.render to customize rendering here</p>
				</div>,
				layout.get<HTMLElement>()!,
			);
		},
	},
	[Fontsize.pluginName]: {
		//配置粘贴后需要过滤的字体大小
		filter: (fontSize: string) => {
			return (
				[
					'12px',
					'13px',
					'14px',
					'15px',
					'16px',
					'19px',
					'22px',
					'24px',
					'29px',
					'32px',
					'40px',
					'48px',
				].indexOf(fontSize) > -1
			);
		},
	},
	[Fontfamily.pluginName]: {
		//配置粘贴后需要过滤的字体
		filter: (fontfamily: string) => {
			const item = fontFamilyDefaultData.find((item) =>
				fontfamily
					.split(',')
					.some(
						(name) =>
							item.value
								.toLowerCase()
								.indexOf(name.replace(/"/, '').toLowerCase()) >
							-1,
					),
			);
			return item ? item.value : false;
		},
	},
	[LineHeight.pluginName]: {
		//配置粘贴后需要过滤的行高
		filter: (lineHeight: string) => {
			if (lineHeight === '14px') return '1';
			if (lineHeight === '16px') return '1.15';
			if (lineHeight === '21px') return '1.5';
			if (lineHeight === '28px') return '2';
			if (lineHeight === '35px') return '2.5';
			if (lineHeight === '42px') return '3';
			// 不满足条件就移除掉
			return (
				['1', '1.15', '1.5', '2', '2.5', '3'].indexOf(lineHeight) > -1
			);
		},
	},
};
