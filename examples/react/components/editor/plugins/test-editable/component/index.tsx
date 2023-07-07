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
import type { TestEditableValue } from './types';

class TestEditable extends Card<TestEditableValue> {
	static get cardName() {
		return 'test-editable';
	}

	static get cardType() {
		return CardType.BLOCK;
	}

	contenteditable = ['.editable-container'];

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

	onChange(trigger: 'remote' | 'local', node: NodeInterface): void {
		if (trigger === 'local') {
			const value = this.getValue();
			const isRight = node.hasClass('editable-container-right');
			if (!isRight) value.left = node.get<HTMLElement>()!.innerHTML;
			else value.right = node.get<HTMLElement>()!.innerHTML;
			this.setValue(value);
		}
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
export default TestEditable;
export type { TestEditableValue };
