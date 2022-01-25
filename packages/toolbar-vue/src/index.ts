import { App } from 'vue';
import Toolbar from './components/toolbar.vue';
import {
	getToolbarDefaultConfig,
	fontFamilyDefaultData,
	fontfamily,
} from './config';
import ToolbarPlugin, { ToolbarComponent } from './plugin';
import type { ToolbarOptions } from './plugin';
import type { ToolbarProps, GroupItemProps, ToolbarItemProps } from './types';

Toolbar.install = (app: App) => {
	app.component(Toolbar.name, Toolbar);
};

export default Toolbar;
export {
	ToolbarPlugin,
	ToolbarComponent,
	getToolbarDefaultConfig as getDefaultConfig,
	fontFamilyDefaultData,
	fontfamily,
};
export type { ToolbarOptions, ToolbarProps, GroupItemProps, ToolbarItemProps };
