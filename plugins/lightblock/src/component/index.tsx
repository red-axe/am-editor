import React from 'react';
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
import type { LightblockValue } from './types';
import Theme, { themeIcon, LightblockIcon } from './theme';
import './style.css';

class Lightblock extends Card<LightblockValue> {
	static get cardName() {
		return 'lightblock';
	}

	static get cardType() {
		return CardType.BLOCK;
	}

	static get autoSelected() {
		return false;
	}

	static get singleSelectable() {
		return false;
	}

	contenteditable = ['div.lightblock-editor-container'];

	#container?: NodeInterface;

	toolbar(): Array<ToolbarItemOptions | CardToolbarItemOptions> {
		if (!isEngine(this.editor) || this.editor.readonly) return [];

		const value = this.getValue();
		const language = this.editor.language.get('lightblock');

		return [
			{ type: 'dnd' },
			{ type: 'copy' },
			{ type: 'delete' },
			{
				type: 'node',
				title: language['theme'],
				node: $(themeIcon),
				didMount: (node) => {
					if (node?.get()) {
						ReactDOM.render(
							<Theme
								language={language as {}}
								value={value}
								onChange={(data) => {
									this.setValue({ ...value, ...data });
									this.#container?.css({
										borderColor: data.border,
										backgroundColor: data.background,
									});
								}}
							/>,
							node?.get(),
						);
					}
				},
			},
		];
	}

	render() {
		const value = this.getValue();
		const { borderColor, backgroundColor } = value;

		this.#container = $(
			`<div class="lightblock-container" style="border-color: ${borderColor};background-color:${backgroundColor};"><div class="lightblock-icon">...</div><div class="lightblock-editor-container"><br/></div></div>`,
		);

		return this.#container;
	}

	didRender() {
		super.didRender();
		const iconContainer = this.#container
			?.find('div.lightblock-icon')
			?.get();

		if (iconContainer) {
			ReactDOM.render(<LightblockIcon />, iconContainer);
		}
	}

	destroy() {
		super.destroy();
		const iconEl = this.#container
			?.find('div.lightblock-icon')
			?.get<HTMLDivElement>();
		if (iconEl) ReactDOM.unmountComponentAtNode(iconEl);
	}
}
export default Lightblock;
export type { LightblockValue };
