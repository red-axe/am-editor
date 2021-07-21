import { PluginEntry, CardEntry, PluginOptions } from '@aomao/engine';
//引入插件 begin
import Redo from '@aomao/plugin-redo';
import Undo from '@aomao/plugin-undo';
import Bold from '@aomao/plugin-bold';
import Code from '@aomao/plugin-code';
import Backcolor from '@aomao/plugin-backcolor';
import Fontcolor from '@aomao/plugin-fontcolor';
import Fontsize from '@aomao/plugin-fontsize';
import Italic from '@aomao/plugin-italic';
import Underline from '@aomao/plugin-underline';
import Hr, { HrComponent } from '@aomao/plugin-hr';
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
import LineHeihgt from '@aomao/plugin-line-height';
import Mention, { MentionComponent } from '@aomao/plugin-mention';
//import Mind, { MindComponent } from '@aomao/plugin-mind';
import {
	ToolbarPlugin,
	ToolbarComponent,
	fontFamilyDefaultData,
} from '@aomao/toolbar';
import { DOMAIN } from '../../config';

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
	LineHeihgt,
	Mention,
	//Mind
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
	//MindComponent
];

const userList = (count: number = 10) => {
	const users: Array<{ key?: string; name: string; avatar: string }> = [];
	for (let i = 0; i < count; i++) {
		users.push({
			key: `u1000${i}`,
			name: `user${i + 1}`,
			avatar: 'https://cdn-image.aomao.com/10016/avatar/2020/04/17/1587113793-da092550-5b12-477e-b229-631908d0ac2b.png',
		});
	}
	return users;
};

export const pluginConfig: PluginOptions = {
	[ImageUploader.pluginName]: {
		file: {
			action: `${DOMAIN}/upload/image`,
		},
		remote: {
			action: `${DOMAIN}/upload/image`,
		},
		isRemote: (src: string) => src.indexOf(DOMAIN) < 0,
	},
	[FileUploader.pluginName]: {
		action: `${DOMAIN}/upload/file`,
	},
	[VideoUploader.pluginName]: {
		action: `${DOMAIN}/upload/video`,
	},
	[Math.pluginName]: {
		action: `https://g.aomao.com/latex`,
		parse: (res: any) => {
			if (res.success) return { result: true, data: res.svg };
			return { result: false };
		},
	},
	[Mention.pluginName]: {
		action: `${DOMAIN}/user/search`,
		defaultData: userList(20),
		onClick: (key: string, name: string) => {
			console.log('mention click:', key, '-', name);
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
	[LineHeihgt.pluginName]: {
		//配置粘贴后需要过滤的行高
		filter: (lineHeight: string) => {
			if (lineHeight === '14px') return '1';
			if (lineHeight === '16px') return '1.15';
			if (lineHeight === '21px') return '1.5';
			if (lineHeight === '28px') return '2';
			if (lineHeight === '35px') return '2.5';
			if (lineHeight === '42px') return '3';
			return (
				['1', '1.15', '1.5', '2', '2.5', '3'].indexOf(lineHeight) > -1
			);
		},
	},
};
