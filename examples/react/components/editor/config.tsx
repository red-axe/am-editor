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
import TestEditable, { TestEditableComponent } from './plugins/test-editable';
import Lightblock, { LightblockComponent } from '@aomao/plugin-lightblock';
import MulitCodeblock, {
	MulitCodeblockComponent,
} from '../../../../plugins/mulit-codeblock/src';
import EditablePlugin from './plugins/editable';
import Tag, { TagComponent } from '../../../../plugins/tag/src';

import {
	ToolbarPlugin,
	ToolbarComponent,
	fontFamilyDefaultData,
} from '@aomao/toolbar';
import type { ToolbarOptions } from '@aomao/toolbar';

import ReactDOM from 'react-dom';
import Empty from 'antd/es/empty';
import 'antd/es/empty/style/css';
import { ImageUploaderOptions } from '@aomao/plugin-image';
import Mermaid, { MermaidComponent } from '@aomao/plugin-mermaid';
import React from 'react';

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
	Lightblock,
	MulitCodeblock,
	Tag,
	Mermaid,
	EditablePlugin,
	TestEditable,
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
	TestEditableComponent,
	EmbedComponent,
	LightblockComponent,
	MulitCodeblockComponent,
	TagComponent,
	MermaidComponent,
];

export const tableOptions: TableOptions = {
	overflow: {
		maxLeftWidth: () => {
			if (isMobile) return 0;
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
			if (isMobile) return 0;
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
	maxInsertNum: 20,
	enableScroll: false,
};

export const markRangeOptions: MarkRangeOptions = {
	//标记类型集合
	keys: ['comment'],
};

export const imageOptions: ImageOptions = {
	onBeforeRender: (status: string, url: string) => {
		if (!url || url.indexOf('http') === 0) return url;
		return url + `?token=12323`;
	},
	maxHeight: 600,
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

export const toolbarOptions = (lang: string): ToolbarOptions => ({
	// 快捷键mod+/弹出菜单配置  默认使用系统配置
	// config: [
	// 	{
	// 		title: '常用插件',
	// 		items: [
	// 			'image-uploader',
	// 			'codeblock',
	// 			'table',
	// 			'file-uploader',
	// 			'video-uploader',
	// 			'status',
	// 			{
	// 				name: 'lightblock',
	// 				icon: (
	// 					<span>
	// 						<svg
	// 							viewBox="0 0 1024 1024"
	// 							version="1.1"
	// 							xmlns="http://www.w3.org/2000/svg"
	// 							p-id="16506"
	// 							width="20"
	// 							height="20"
	// 						>
	// 							<path
	// 								d="M334.381005 532.396498c-43.065755-49.294608-63.309781-112.604389-57.006228-178.291306 10.574825-110.073758 97.919974-198.776832 207.71744-210.893776 68.155127-7.538682 133.543239 13.271232 184.12721 58.571883 49.904497 44.705089 78.529384 108.733229 78.529384 175.681881 0 58.288428-21.461758 114.226326-60.43532 157.530511-33.148915 36.840996-52.83217 85.053971-56.389176 137.225087H528.321701V438.869569c0-9.007123-7.311508-16.319655-16.323748-16.319655-9.014286 0-16.312492 7.312531-16.312491 16.324771v233.34507H393.113547c-3.619427-51.119159-24.146908-100.241852-58.732542-139.823257z m267.534684 349.898389H422.088404c-15.65553 0-28.397714-12.72888-28.397714-28.38441v-13.222113h236.617596v13.222113c0.001023 15.648367-12.737067 28.384411-28.392597 28.38441z m28.393621-176.619226v40.79095h-236.61862V704.913299l236.61862 0.762362z m0 102.380557h-236.61862v-28.945182h236.617596v28.945182h0.001024z m-269.255882 45.853236c0 33.645217 27.378503 61.036 61.035999 61.035999h179.827286c33.65238 0 61.036-27.390782 61.035999-61.035999V689.406148c0-50.646392 17.267234-97.71736 48.62639-132.56803 44.377631-49.313027 68.815158-113.009617 68.815158-179.372938 0-76.212623-32.576888-149.107695-89.390734-199.987401-57.609977-51.586809-132.021585-75.230251-209.499013-66.725571-125.072327 13.823816-224.583539 114.852588-236.613503 240.230883-7.177455 74.713483 15.876564 146.765352 64.907159 202.899725 33.056817 37.817228 51.255258 85.643394 51.255259 134.65557v165.371068z"
	// 								p-id="16507"
	// 							></path>
	// 						</svg>
	// 					</span>
	// 				),
	// 				title: lang === 'zh-CN' ? '高亮块' : 'light-block',
	// 				search: 'light,light-block,remind,高亮块',
	// 			},
	// 		],
	// 	},
	// ],
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
});

const headingOptions: HeadingOptions = {
	showAnchor: isMobile ? false : true,
};

export const pluginConfig = (lang: string): Record<string, PluginOptions> => ({
	[Heading.pluginName]: headingOptions,
	[ToolbarPlugin.pluginName]: toolbarOptions(lang),
	[Table.pluginName]: tableOptions,
	[MarkRange.pluginName]: markRangeOptions,
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
	[MulitCodeblock.pluginName]: {
		language: ['javascript', 'html', 'css'],
	},
});
