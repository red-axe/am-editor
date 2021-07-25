import { App } from 'vue';
import Toolbar from './components/toolbar.vue';
import {
	getToolbarDefaultConfig,
	fontFamilyDefaultData,
	fontfamily,
} from './config';
import ToolbarPlugin, { ToolbarComponent } from './plugin';

Toolbar.install = (app: App) => {
	app.component(Toolbar.name, Toolbar);
};

export default Toolbar;
export {
	ToolbarPlugin,
	ToolbarComponent,
	getToolbarDefaultConfig,
	fontFamilyDefaultData,
	fontfamily,
};
