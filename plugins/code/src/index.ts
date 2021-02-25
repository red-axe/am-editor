import { $, NodeInterface, Plugin } from '@aomao/engine';
import './index.css';

const TAG_NAME = 'code';
export type Options = {
	hotkey?: string | Array<string>;
	markdown?: boolean;
};
export default class extends Plugin<Options> {
	execute() {
		if (!this.engine) return;
		const mark = `<${TAG_NAME} />`;
		const { change } = this.engine;
		if (!this.queryState()) {
			change.addMark(mark, $(document.createTextNode('\u200b')));
		} else {
			change.removeMark(mark);
		}
	}

	queryState() {
		if (!this.engine) return;
		const { change } = this.engine;
		return change.marks.some(node => node.name === TAG_NAME);
	}

	hotkey() {
		return this.options.hotkey || 'mod+e';
	}

	schema() {
		return TAG_NAME;
	}

	//设置markdown
	onKeydownSpace(event: KeyboardEvent, node: NodeInterface, text: string) {
		if (
			!this.engine ||
			!text ||
			!text.match(/[`]$/) ||
			this.options.markdown === false ||
			node.type !== Node.TEXT_NODE
		)
			return;

		const { change } = this.engine;
		let range = change.getRange();
		const markdownKey = '`';
		const match = new RegExp(
			`^(.*)${markdownKey}(.+?)${markdownKey}$`,
		).exec(text);
		if (match) {
			const visibleChar = match[1] && /\S$/.test(match[1]);
			const codeChar = match[2];
			event.preventDefault();
			let leftText = text.substr(
				0,
				text.length - codeChar.length - 2 * markdownKey.length,
			);
			node.get<Text>()!.splitText(
				(leftText + codeChar).length + 2 * markdownKey.length,
			);
			if (visibleChar) {
				leftText += ' ';
			}
			node[0].nodeValue = leftText + codeChar;
			range.setStart(node[0], leftText.length);
			range.setEnd(node[0], (leftText + codeChar).length);
			change.select(range);
			this.execute();
			range = change.getRange();
			range.collapse(false);
			change.select(range);
			change.insertText('\xa0');
			return false;
		}
		return;
	}

	parseHtml(root: NodeInterface) {
		root.find('code').css({
			'font-family': 'monospace',
			'font-size': 'inherit',
			'background-color': 'rgba(0,0,0,.06)',
			padding: '0 2px',
			border: '1px solid rgba(0,0,0,.08)',
			'border-radius': '2px 2px',
			'line-height': 'inherit',
			'overflow-wrap': 'break-word',
			'text-indent': '0',
		});
	}
}
