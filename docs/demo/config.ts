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

export const IS_DEV = process.env.NODE_ENV !== 'production';
export const DOMAIN = IS_DEV
	? 'http://localhost:7001'
	: 'https://editor.aomao.com';

export const lang = (typeof window !== 'undefined'
	? window.location.href.indexOf('zh-CN') > 0
	: false)
	? 'zh-cn'
	: 'en';

export const plugins = [
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
];

export const cards = [
	HrComponent,
	CheckboxComponent,
	CodeBlockComponent,
	ImageComponent,
	TableComponent,
	FileComponent,
	VideoComponent,
	MathComponent,
];

export {
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
	HrComponent,
	CheckboxComponent,
	CodeBlockComponent,
	ImageComponent,
	TableComponent,
	File,
	FileComponent,
	FileUploader,
	Video,
	VideoComponent,
	VideoUploader,
	Math,
	MathComponent,
};
