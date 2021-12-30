import isHotkey from 'is-hotkey';
import { TypingHandleInterface } from '../../types';
import DefaultKeydown from './default';

class Right extends DefaultKeydown implements TypingHandleInterface {
	type: 'keydown' | 'keyup' = 'keydown';
	hotkey = (event: KeyboardEvent) =>
		isHotkey('right', event) ||
		isHotkey('shift+right', event) ||
		isHotkey('ctrl+e', event) ||
		isHotkey('ctrl+f', event);
}
export default Right;
