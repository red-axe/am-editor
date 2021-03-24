import Default from './default';

class At extends Default {
	hotkey = (event: KeyboardEvent) =>
		event.key === '@' ||
		(event.shiftKey && event.keyCode === 229 && event.code === 'Digit2');
}
export default At;
