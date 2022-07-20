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
import type { RemindValue } from './types';
import Theme, { themeIcon, ReminDIcon } from './theme';
import './style.css';

class Reminder extends Card<RemindValue> {
	static get cardName() {
		return 'remind';
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

	contenteditable = ['div.remind-editor-container'];

	#container?: NodeInterface;

	toolbar(): Array<ToolbarItemOptions | CardToolbarItemOptions> {
		if (!isEngine(this.editor) || this.editor.readonly) return [];

		const value = this.getValue();
		const language = this.editor.language.get('remind');

		return [
			{ type: 'dnd' },
			{ type: 'copy' },
			{ type: 'delete' },
			{
				type: 'node',
				title: language['theme'],
				node: $(themeIcon),
				didMount: (node) => {
					if (node[0]) {
						ReactDOM.render(
							<Theme
								value={value}
								onChange={(data) => {
									this.setValue({ ...value, ...data });
									this.#container.css({
										borderColor: data.border,
										backgroundColor: data.background,
									});
								}}
							/>,
							node[0],
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
			`<div class="remind-container" style="border-color: ${borderColor};background-color:${backgroundColor};"><div class="remind-icon">...</div><div class="remind-editor-container"><br/></div></div>`,
		);

		return this.#container;
	}

	didRender() {
		super.didRender();
		const iconContainer = this.#container.find('div.remind-icon')[0];

		if (iconContainer) {
			ReactDOM.render(<ReminDIcon />, iconContainer);
		}
	}

	destroy() {
		super.destroy();
		this.#container &&
			ReactDOM.unmountComponentAtNode(
				this.#container.find('div.remind-icon')[0],
			);
	}
}
export default Reminder;
export type { RemindValue };
