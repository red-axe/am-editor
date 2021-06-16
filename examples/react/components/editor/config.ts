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
import { ToolbarPlugin, ToolbarComponent } from '@aomao/toolbar';
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
];

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
};
