import {
	CardToolbarItemOptions,
	PluginOptions,
	ToolbarItemOptions,
} from '@aomao/engine';

export interface CodeBlockOptions extends PluginOptions {
	hotkey?: string | Array<string>;
	markdown?: boolean;
	alias?: Record<string, string>;
	styleMap?: Record<string, string>;
	cardToolbars?: (
		items: (ToolbarItemOptions | CardToolbarItemOptions)[],
	) => (ToolbarItemOptions | CardToolbarItemOptions)[];
}
