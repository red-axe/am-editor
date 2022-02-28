import {
	$,
	Card,
	CardToolbarItemOptions,
	CardType,
	isEngine,
	NodeInterface,
	ToolbarItemOptions,
} from '@aomao/engine';
import ReactDOM from 'react-dom';
import TestComponent from './test';

class Test extends Card {
	static get cardName() {
		return 'test';
	}

	static get cardType() {
		return CardType.BLOCK;
	}

	#container?: NodeInterface;

	toolbar(): Array<ToolbarItemOptions | CardToolbarItemOptions> {
		if (!isEngine(this.editor) || this.editor.readonly) return [];
		return [
			{
				type: 'dnd',
			},
			{
				type: 'copy',
			},
			{
				type: 'delete',
			},
			{
				type: 'node',
				node: $('<span>测试按钮</span>'),
				didMount: (node) => {
					node.on('click', () => {
						alert('test button');
					});
				},
			},
		];
	}

	render() {
		this.#container = $('<div>Loading</div>');
		return this.#container;
	}

	didRender() {
		super.didRender();
		// 由于项目中 vue 和 react 的混合环境导致 ts 报错
		ReactDOM.render(<TestComponent />, this.#container?.get<HTMLElement>());
	}

	destroy() {
		super.destroy();
		ReactDOM.unmountComponentAtNode(this.#container?.get<HTMLElement>()!);
	}
}
export default Test;
