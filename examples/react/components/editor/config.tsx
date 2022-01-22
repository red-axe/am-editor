import { $, isMobile, removeUnit } from '@aomao/engine';
import type {
	PluginEntry,
	CardEntry,
	PluginOptions,
	NodeInterface,
} from '@aomao/engine';
//引入插件 begin
import Redo from '@aomao/plugin-redo';
// import type { RedoOptions } from '@aomao/plugin-redo';
import Undo from '@aomao/plugin-undo';
// import type { UndoOptions } from '@aomao/plugin-undo';
import Bold from '@aomao/plugin-bold';
// import type { BoldOptions } from '@aomao/plugin-bold';
import Code from '@aomao/plugin-code';
// import type { CodeOptions } from '@aomao/plugin-code';
import Backcolor from '@aomao/plugin-backcolor';
// import type { BackcolorOptions } from '@aomao/plugin-backcolor';
import Fontcolor from '@aomao/plugin-fontcolor';
// import type { FontcolorOptions } from '@aomao/plugin-fontcolor';
import Fontsize from '@aomao/plugin-fontsize';
import type { FontsizeOptions } from '@aomao/plugin-fontsize';
import Italic from '@aomao/plugin-italic';
import type { ItalicOptions } from '@aomao/plugin-italic';
import Underline from '@aomao/plugin-underline';
// import type { UnderlineOptions } from '@aomao/plugin-underline';
import Hr, { HrComponent } from '@aomao/plugin-hr';
// import type { HrOptions } from '@aomao/plugin-hr';
import Tasklist, { CheckboxComponent } from '@aomao/plugin-tasklist';
// import type { TasklistOptions } from '@aomao/plugin-tasklist';
import Orderedlist from '@aomao/plugin-orderedlist';
// import type { OrderedlistOptions } from '@aomao/plugin-orderedlist';
import Unorderedlist from '@aomao/plugin-unorderedlist';
// import type { UnorderedlistOptions } from '@aomao/plugin-unorderedlist';
import Indent from '@aomao/plugin-indent';
// import type { IndentOptions } from '@aomao/plugin-indent';
import Heading from '@aomao/plugin-heading';
import type { HeadingOptions } from '@aomao/plugin-heading';
import Strikethrough from '@aomao/plugin-strikethrough';
// import type { StrikethroughOptions } from '@aomao/plugin-strikethrough';
import Sub from '@aomao/plugin-sub';
// import type { SubOptions } from '@aomao/plugin-sub';
import Sup from '@aomao/plugin-sup';
// import type { SupOptions } from '@aomao/plugin-sup';
import Alignment from '@aomao/plugin-alignment';
// import type { AlignmentOptions } from '@aomao/plugin-alignment';
import Mark from '@aomao/plugin-mark';
// import type { MarkOptions } from '@aomao/plugin-mark';
import Quote from '@aomao/plugin-quote';
// import type { QuoteOptions } from '@aomao/plugin-quote';
import PaintFormat from '@aomao/plugin-paintformat';
// import type { PaintformatOptions } from '@aomao/plugin-paintformat';
import RemoveFormat from '@aomao/plugin-removeformat';
// import type { RemoveformatOptions } from '@aomao/plugin-removeformat';
import SelectAll from '@aomao/plugin-selectall';
// import type { SelectAllOptions } from '@aomao/plugin-selectall';
import Link from '@aomao/plugin-link';
// import type { LinkOptions } from '@aomao/plugin-link';
import Codeblock, { CodeBlockComponent } from '@aomao/plugin-codeblock';
// import type { CodeblockOptions } from '@aomao/plugin-codeblock';
import Image, { ImageComponent, ImageUploader } from '@aomao/plugin-image';
import type { ImageOptions } from '@aomao/plugin-image';
import Table, { TableComponent } from '@aomao/plugin-table';
import type { TableOptions } from '@aomao/plugin-table';
import MarkRange from '@aomao/plugin-mark-range';
import type { MarkRangeOptions } from '@aomao/plugin-mark-range';
import File, { FileComponent, FileUploader } from '@aomao/plugin-file';
import type { FileOptions } from '@aomao/plugin-file';
import Video, { VideoComponent, VideoUploader } from '@aomao/plugin-video';
import type { VideoOptions, VideoUploaderOptions } from '@aomao/plugin-video';
import Math, { MathComponent } from '@aomao/plugin-math';
import type { MathOptions } from '@aomao/plugin-math';
import Fontfamily from '@aomao/plugin-fontfamily';
import type { FontfamilyOptions } from '@aomao/plugin-fontfamily';
import Status, { StatusComponent } from '@aomao/plugin-status';
// import type { StatusOptions } from '@aomao/plugin-status';
import LineHeight from '@aomao/plugin-line-height';
import type { LineHeightOptions } from '@aomao/plugin-line-height';
import Mention, { MentionComponent } from '@aomao/plugin-mention';
import type { MentionOptions } from '@aomao/plugin-mention';
import Embed, { EmbedComponent } from '@aomao/plugin-embed';
// import type { EmbedOptions } from '@aomao/plugin-embed'
import Test, { TestComponent } from './plugins/test';
import {
	ToolbarPlugin,
	ToolbarComponent,
	fontFamilyDefaultData,
} from '@aomao/toolbar';
import type { ToolbarOptions } from '@aomao/toolbar';

import ReactDOM from 'react-dom';
import Loading from '../loading';
import Empty from 'antd/es/empty';
import 'antd/es/empty/style';
import { ImageUploaderOptions } from 'plugins/image/dist/uploader';

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

export const cards: CardEntry[] = [
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

export const tableOptions: TableOptions = {
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
};

export const markRangeOptions: MarkRangeOptions = {
	//标记类型集合
	keys: ['comment'],
};

export const italicOptions: ItalicOptions = {
	// 默认为 _ 下划线，这里修改为单个 * 号
	markdown: '*',
};

export const imageOptions: ImageOptions = {
	onBeforeRender: (status: string, url: string) => {
		if (!url || url.indexOf('http') === 0) return url;
		return url + `?token=12323`;
	},
};

export const imageUploaderOptions: ImageUploaderOptions = {
	file: {
		action: '/api/upload/image',
		headers: { Authorization: '213434' },
	},
	remote: {
		action: '/api/upload/image',
	},
	isRemote: (src: string) => false,
};

export const fileOptions: FileOptions = {
	action: '/api/upload/file',
};

export const videoOptions: VideoOptions = {
	onBeforeRender: (status: string, url: string) => {
		return url;
	},
	fullEditor: 420,
};

export const videoUploaderOptions: VideoUploaderOptions = {
	action: '/api/upload/video',
	limitSize: 1024 * 1024 * 50,
};

export const mathOptions: MathOptions = {
	action: '/api/latex',
	parse: (res: any) => {
		if (res.success) return { result: true, data: res.svg };
		return { result: false, data: '' };
	},
};

export const mentionOptions: MentionOptions = {
	action: '/api/user/search',
	// onLoading: (root: NodeInterface) => {
	// 	return ReactDOM.render(<Loading />, root.get<HTMLElement>()!);
	// },
	onEmpty: (root: NodeInterface) => {
		return ReactDOM.render(<Empty />, root.get<HTMLElement>()!);
	},
	onClick: (root: NodeInterface, { key, name }) => {
		console.log('mention click:', key, '-', name);
	},
	onMouseEnter: (layout: NodeInterface, { name }) => {
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
};

export const fontsizeOptions: FontsizeOptions = {
	//配置粘贴后需要过滤的字体大小
	filter: (fontSize: string) => {
		const size = removeUnit(fontSize);
		if (size > 48) {
			return '48px';
		} else if (size < 12) return '12px';
		else if (size < 19 && size > 16) return '16px';
		else if (size < 22 && size > 19) return '19px';
		else if (size < 24 && size > 22) return '22px';
		else if (size < 29 && size > 24) return '24px';
		else if (size < 32 && size > 29) return '29px';
		else if (size < 40 && size > 32) return '32px';
		else if (size < 48 && size > 40) return '40px';
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
};

export const fontfamilyOptions: FontfamilyOptions = {
	//配置粘贴后需要过滤的字体
	filter: (fontfamily: string) => {
		const item = fontFamilyDefaultData.find((item) =>
			fontfamily
				.split(',')
				.some(
					(name) =>
						item.value
							.toLowerCase()
							.indexOf(name.replace(/"/, '').toLowerCase()) > -1,
				),
		);
		return item ? item.value : false;
	},
};

export const lineHeightOptions: LineHeightOptions = {
	//配置粘贴后需要过滤的行高
	filter: (lineHeight: string) => {
		if (lineHeight === '14px') return '1';
		if (lineHeight === '16px') return '1.15';
		if (lineHeight === '21px') return '1.5';
		if (lineHeight === '28px') return '2';
		if (lineHeight === '35px') return '2.5';
		if (lineHeight === '42px') return '3';
		// 不满足条件就移除掉
		return ['1', '1.15', '1.5', '2', '2.5', '3'].indexOf(lineHeight) > -1;
	},
};

export const toolbarOptions: ToolbarOptions = {
	popup: {
		items: [
			['bold', 'strikethrough', 'fontcolor'],
			{
				icon: 'text',
				items: ['italic', 'underline', 'backcolor', 'moremark'],
			},
			[
				{
					type: 'button',
					name: 'image-uploader',
					icon: 'image',
				},
				'link',
				'tasklist',
				'heading',
			],
			{
				icon: 'more',
				items: [
					{
						type: 'button',
						name: 'video-uploader',
						icon: 'video',
					},
					{
						type: 'button',
						name: 'file-uploader',
						icon: 'attachment',
					},
					{
						type: 'button',
						name: 'math',
						icon: 'math',
					},
					{
						type: 'button',
						name: 'codeblock',
						icon: 'codeblock',
					},
					{
						type: 'button',
						name: 'orderedlist',
						icon: 'ordered-list',
					},
					{
						type: 'button',
						name: 'unorderedlist',
						icon: 'unordered-list',
					},
					{
						type: 'button',
						name: 'hr',
						icon: 'hr',
					},
					{
						type: 'button',
						name: 'quote',
						icon: 'quote',
					},
				],
			},
		],
	},
};

const headingOptions: HeadingOptions = {
	showAnchor: isMobile ? false : true,
};

export const pluginConfig: Record<string, PluginOptions> = {
	[Heading.pluginName]: headingOptions,
	[ToolbarPlugin.pluginName]: toolbarOptions,
	[Table.pluginName]: tableOptions,
	[MarkRange.pluginName]: markRangeOptions,
	[Italic.pluginName]: italicOptions,
	[Image.pluginName]: imageOptions,
	[ImageUploader.pluginName]: imageUploaderOptions,
	[FileUploader.pluginName]: fileOptions,
	[VideoUploader.pluginName]: videoUploaderOptions,
	[Video.pluginName]: videoOptions,
	[Math.pluginName]: mathOptions,
	[Mention.pluginName]: mentionOptions,
	[Fontsize.pluginName]: fontsizeOptions,
	[Fontfamily.pluginName]: fontfamilyOptions,
	[LineHeight.pluginName]: lineHeightOptions,
};
