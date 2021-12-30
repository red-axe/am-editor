import { TypingHandleInterface } from '../../types';
import DefaultKeydown from './default';

class Tab extends DefaultKeydown implements TypingHandleInterface {
	type: 'keydown' | 'keyup' = 'keydown';
	hotkey: string | string[] | ((event: KeyboardEvent) => boolean) = 'tab';

	trigger(event: KeyboardEvent): void {
		const { node } = this.engine;
		event.preventDefault();
		node.insertText('    ');
	}
}
export default Tab;
