import { TypingHandle } from '../../types';
import Enter from './enter';
import Default from './default';
import Backspace from './backspace';
import Tab from './tab';
import Space from './space';

const defaultHandles: Array<{
	name: string;
	triggerName?: string;
	handle: TypingHandle;
}> = [
	{
		name: 'default',
		handle: Default,
	},
	{
		name: 'enter',
		handle: Enter,
		triggerName: 'keyup:enter',
	},
	{
		name: 'backspace',
		handle: Backspace,
		triggerName: 'keyup:backspace',
	},
	{
		name: 'tab',
		handle: Tab,
		triggerName: 'keyup:tab',
	},
	{
		name: 'space',
		handle: Space,
		triggerName: 'keyup:space',
	},
];

export default defaultHandles;
