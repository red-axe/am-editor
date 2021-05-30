import { Card, NodeInterface } from '@aomao/engine';

class VideoComponent extends Card {
	static get cardName() {
		return 'video';
	}

	render(): string | void | NodeInterface {
		throw new Error('Method not implemented.');
	}
}
