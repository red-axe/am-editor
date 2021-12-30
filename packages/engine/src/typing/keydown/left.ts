import isHotkey from 'is-hotkey';
import { TypingHandleInterface } from '../../types';
import Default from './default';
class Left extends Default implements TypingHandleInterface {
	type: 'keydown' | 'keyup' = 'keydown';
	hotkey = (event: KeyboardEvent) =>
		isHotkey('left', event) ||
		isHotkey('shift+left', event) ||
		isHotkey('ctrl+a', event) ||
		isHotkey('ctrl+b', event);
}
export default Left;
