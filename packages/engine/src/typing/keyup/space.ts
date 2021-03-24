import Default from './default';

class Space extends Default {
	hotkey = (event: KeyboardEvent) => event.key === ' ';
}
export default Space;
