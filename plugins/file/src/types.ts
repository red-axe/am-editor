import { PluginOptions } from '@aomao/engine';
import type { FileValue } from './component';

export interface FileOptions extends PluginOptions {
	onBeforeRender?: (action: 'preview' | 'download', url: string) => string;
	onDownload?: (url: string, value: FileValue) => void;
	onPreview?: (url: string, value: FileValue) => void;
}
