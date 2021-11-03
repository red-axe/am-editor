import { DropdownListItem } from './dropdown/list';
import {
	GroupButtonProps,
	GroupDropdownProps,
	GroupColorProps,
	CollapseProps,
} from './group';

export type ButtonProps = {
	onActive?: () => boolean;
	onDisabled?: () => boolean;
} & GroupButtonProps;

export type DropdownProps = {
	onActive?: (items: Array<DropdownListItem>) => string | Array<string>;
	onDisabled?: () => boolean;
} & GroupDropdownProps;

export type ColorProps = {
	onActive?: () => string | Array<string>;
	onDisabled?: () => boolean;
} & GroupColorProps;

export { CollapseProps };
