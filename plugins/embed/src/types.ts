import {
	CardToolbarItemOptions,
	CardValue,
	PluginOptions,
	ToolbarItemOptions,
} from '@aomao/engine';

export interface EmbedValue extends CardValue {
	url?: string;
	height?: number;
	collapsed?: boolean;
	ico?: string;
	title?: string;
	isResize?: boolean;
}

export type EmbedRenderBeforeEvent = (url: string) => EmbedValue;

export interface EmbedOptions extends PluginOptions {
	renderBefore?: EmbedRenderBeforeEvent;
	cardToolbars?: (
		items: (ToolbarItemOptions | CardToolbarItemOptions)[],
	) => (ToolbarItemOptions | CardToolbarItemOptions)[];
}
