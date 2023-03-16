import {
	$,
	Card,
	CardToolbarItemOptions,
	CardType,
	isEngine,
	NodeInterface,
	ToolbarItemOptions,
} from '@aomao/engine';
import React from 'react';
import ReactDOM from 'react-dom';
import TestComponent from './test';
import type { TestValue } from './types';

class Test extends Card<TestValue> {
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
		const value = this.getValue();
		ReactDOM.render(
			<TestComponent value={value} />,
			this.#container?.get<HTMLElement>()!,
		);
	}

	destroy() {
		super.destroy();
		ReactDOM.unmountComponentAtNode(this.#container?.get<HTMLElement>()!);
	}
}
export default Test;
export type { TestValue };
