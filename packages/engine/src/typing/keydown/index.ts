import { EngineInterface, TypingHandle } from '../../types';
import Backspace from './backspace';
import Default from './default';
import Delete from './delete';
import Enter from './enter';
import Tab from './tab';
import ShiftTab from './shift-tab';
import ShiftEnter from './shift-enter';
import At from './at';
import Space from './space';
import Slash from './slash';
import All from './all';
import Left from './left';
import Right from './right';
import Up from './up';
import Down from './down';

const defaultHandles: Array<{
	name: string;
	triggerName?: string;
	handle: TypingHandle;
	triggerParams?:
		| any
		| ((engine: EngineInterface, event: KeyboardEvent) => any);
}> = [
	{
		name: 'default',
		handle: Default,
	},
	{
		name: 'enter',
		handle: Enter,
		triggerName: 'keydown:enter',
	},
	{
		name: 'backspace',
		handle: Backspace,
		triggerName: 'keydown:backspace',
	},
	{
		name: 'delete',
		handle: Delete,
		triggerName: 'keydown:delete',
	},
	{
		name: 'tab',
		handle: Tab,
		triggerName: 'keydown:tab',
	},
	{
		name: 'shift-tab',
		handle: ShiftTab,
		triggerName: 'keydown:shift-tab',
	},
	{
		name: 'shift-enter',
		handle: ShiftEnter,
		triggerName: 'keydown:shift-enter',
	},
	// {
	// 	name: 'at',
	// 	handle: At,
	// 	triggerName: 'keydown:at',
	// },
	{
		name: 'space',
		handle: Space,
		triggerName: 'keydown:space',
	},
	{
		name: 'slash',
		handle: Slash,
		triggerName: 'keydown:slash',
	},
	{
		name: 'all',
		handle: All,
		triggerName: 'keydown:all',
	},
	{
		name: 'left',
		handle: Left,
		triggerName: 'keydown:left',
	},
	{
		name: 'right',
		handle: Right,
		triggerName: 'keydown:right',
	},
	{
		name: 'up',
		handle: Up,
		triggerName: 'keydown:up',
	},
	{
		name: 'down',
		handle: Down,
		triggerName: 'keydown:down',
	},
];

export default defaultHandles;
