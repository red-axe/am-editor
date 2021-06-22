import { Plugin, isEngine, SchemaBlock } from '@aomao/engine';
import MindComponent from './component';

export type Options = {};

export default class Mind extends Plugin<Options> {
	static get pluginName() {
		return 'mind';
	}

	execute() {
		if (!isEngine(this.editor)) return;
		const { card } = this.editor;
		card.insert(MindComponent.cardName);
	}
}

export { MindComponent };
