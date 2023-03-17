import React from 'react';
import {
	$,
	Card,
	CardToolbarItemOptions,
	CardType,
	isEngine,
	NodeInterface,
	Parser,
	ToolbarItemOptions,
} from '@aomao/engine';
import ReactDOM from 'react-dom';
import type { LightblockValue } from './types';
import Theme, { themeIcon } from './theme';
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

	#changeTimeout?: NodeJS.Timeout;

	toolbar(): Array<ToolbarItemOptions | CardToolbarItemOptions> {
		if (!isEngine(this.editor) || this.editor.readonly) return [];

		const value = this.getValue();
		const language = this.editor.language.get('lightblock');

		return [
			{ type: 'dnd' },
			{ type: 'copy' },
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
									this.setValue({
										...value,
										backgroundColor: data.background,
										borderColor: data.border,
									});
									this.updateColor();
								}}
							/>,
							node?.get(),
						);
					}
				},
			},
			{ type: 'separator' },
			{ type: 'delete' },
		];
	}

	getValue() {
		const value = super.getValue();
		const editorContainer = this.#container?.find(
			this.contenteditable.join(','),
		);
		if (!editorContainer) return value;
		const editor = this.editor;
		const { schema, conversion } = editor;
		const container = $('<div></div>');

		container.append(editorContainer.clone(true).children());
		const parser = new Parser(container, editor);
		const html = parser.toValue(schema, conversion, false, false);
		if (!isEngine(editor)) return { ...value, html };
		return {
			...value,
			html,
		} as LightblockValue;
	}

	updateColor = (value = this.getValue()) => {
		this.#container?.css({
			borderColor: value.borderColor,
			backgroundColor: value.backgroundColor,
		});
	};

	onChange = (trigger: 'remote' | 'local' = 'local') => {
		const editor = this.editor;
		if (
			isEngine(editor) &&
			trigger === 'local' &&
			editor.model.mutation.isStopped
		)
			return;

		if (this.#changeTimeout) clearTimeout(this.#changeTimeout);
		this.#changeTimeout = setTimeout(() => {
			const value = this.getValue();
			this.updateColor(value);
			if (trigger === 'local' && isEngine(editor)) {
				if (value) this.setValue(value);
			}
		}, 50);
	};

	render(isFoucs?: boolean) {
		const value = this.getValue();
		const { borderColor, backgroundColor } = value;
		const childValue = value.html
			? new Parser(value.html, this.editor).toValue()
			: '<br />';
		this.#container = $(
			`<div class="lightblock-container" style="border-color: ${borderColor};background-color:${backgroundColor};">
				<div class="lightblock-icon">
					<svg
						viewBox="0 0 1024 1024"
						version="1.1"
						xmlns="http://www.w3.org/2000/svg"
						p-id="13148"
						width="24"
						height="24"
					>
						<path
							d="M833.5 330.5C833.5 153 689.6 7.6 512 7.6S190.5 153 190.5 330.5c0 70.3 37.3 161 97.2 227.9 59.4 66.3 103.5 177.9 103.5 266.9v34.9h241.6v-34.6c0-89 44.1-200.4 103.2-266.9 60.1-67.6 97.5-166.4 97.5-228.2z"
							fill="#FFC807"
							p-id="13149"
						></path>
						<path
							d="M636.5 790.6l-193.9-268L596.4 202l199.2 266.4c-17.4 36.4-39.3 67.4-63.9 95.2C685.3 621 664.1 671.1 644 741l-7.5 49.6z"
							fill="#FFB300"
							p-id="13150"
						></path>
						<path
							d="M499.5 378.3h-82.7c-12.6 0-21.4-12.7-16.8-24.5l59.2-153c2.7-6.9 9.4-11.5 16.8-11.5h105c13.6 0 22.3 14.5 15.9 26.5l-81.5 153c-3.2 5.8-9.3 9.5-15.9 9.5z"
							fill="#FFF8E1"
							p-id="13151"
						></path>
						<path
							d="M466.2 518.3l160-171c12-12.8 2.9-33.7-14.6-33.7h-105c-8.7 0-16.4 5.6-19.1 13.9l-55 171c-6.6 20.4 19.1 35.5 33.7 19.8z"
							fill="#FFF8E1"
							p-id="13152"
						></path>
						<path
							d="M593.6 1016.4H430.4c-5.7 0-10.9-3.7-14-9.8l-22.2-44.2h235.6l-22.2 44.2c-3.1 6.1-8.3 9.8-14 9.8z"
							fill="#455A64"
							p-id="13153"
						></path>
						<path
							d="M625.7 980.4H398.3c-22.1 0-40.1-17.9-40.1-40.1V776.7c0-22.1 17.9-40.1 40.1-40.1h227.5c22.1 0 40.1 17.9 40.1 40.1v163.7c-0.1 22.1-18 40-40.2 40z"
							fill="#ECEFF1"
							p-id="13154"
						></path>
						<path
							d="M539.8 808.6H359v-36h180.8c9.9 0 18 8.1 18 18 0 10-8.1 18-18 18zM359 840.1h306v36H359zM665 943.6H494.8c-9.9 0-18-8.1-18-18s8.1-18 18-18H665v36z"
							fill="#CFD8DC"
							p-id="13155"
						></path>
					</svg>
				</div>
				<div class="lightblock-editor-container">${childValue}</div>
			</div>`,
		);

		if (isFoucs) {
			setTimeout(() => {
				this.#container
					?.find('.lightblock-editor-container')
					?.get<HTMLElement>()
					?.focus?.();
			}, 0);
		}

		return this.#container;
	}

	didRender() {
		super.didRender();
		this.updateColor();
	}
}
export default Lightblock;
export type { LightblockValue };
