import ToolbarPlugin, { ToolbarComponent } from './plugin';
import type { ToolbarOptions } from './plugin';
import Toolbar, {
	getDefaultConfig,
	fontFamilyDefaultData,
	fontfamily,
} from './Toolbar';
import type { ToolbarProps, GroupItemProps, ToolbarItemProps } from './Toolbar';
import './index.css';

export default Toolbar;
export {
	ToolbarPlugin,
	ToolbarComponent,
	fontFamilyDefaultData,
	fontfamily,
	getDefaultConfig,
};
export type { ToolbarProps, GroupItemProps, ToolbarItemProps, ToolbarOptions };
