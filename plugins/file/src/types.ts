import { PluginOptions } from '@aomao/engine';

export interface FileOptions extends PluginOptions {
	onBeforeRender?: (action: 'preview' | 'download', url: string) => string;
}
