import {
	$,
	NodeInterface,
	Plugin,
	RangeInterface,
	sanitizeUrl,
	isNode,
} from '@aomao/engine';

type ItemOption =
	| 'code'
	| 'mark'
	| 'bold'
	| 'strikethrough'
	| 'italic'
	| 'sup'
	| 'sub'
	| 'orderedlist'
	| 'unorderedlist'
	| 'tasklist'
	| 'checkedtasklist'
	| 'h1'
	| 'h2'
	| 'h3'
	| 'h4'
	| 'h5'
	| 'h6'
	| 'quote'
	| 'link';
export type Options = {
	items?: Array<ItemOption>;
	onLink?: (
		text: string,
		url: string,
	) => {
		href: string;
		target?: '_blank' | string;
	};
};

export const markType = {
	'`': 'code',
	'==': 'mark',
	'**': 'bold',
	'~~': 'strikethrough',
	_: 'italic',
	'^': 'sup',
	'~': 'sub',
};

export default class extends Plugin<Options> {
	execute() {
		return;
	}

	getMarkdownType(chars: string) {
		if (/^\d{1,9}\.$/.test(chars)) {
			return 'orderedlist';
		}
		switch (chars) {
			case '*':
			case '-':
			case '+':
				return 'unorderedlist';
			case '[]':
			case '[ ]':
				return 'tasklist';
			case '[x]':
				return 'checkedtasklist';
			case '#':
				return 'h1';
			case '##':
				return 'h2';
			case '###':
				return 'h3';
			case '####':
				return 'h4';
			case '#####':
				return 'h5';
			case '######':
				return 'h6';
			case '>':
				return 'quote';
			default:
				return '';
		}
	}

	removeLeftText(block: NodeInterface | Node, range: RangeInterface) {
		if (isNode(block)) block = $(block);
		range.removeBlockLeftText(block[0]);
		if (block.isEmpty()) {
			block.empty();
			block.append('<br />');
		}
	}

	processMark(event: KeyboardEvent, range: RangeInterface) {
		const bookmark = range.createBookmark();
		if (!bookmark) {
			return;
		}
		const { command, change } = this.engine!;
		const prevNode = $(bookmark.anchor).prev();
		const prevText =
			prevNode && prevNode.isText() ? prevNode[0].nodeValue || '' : '';
		range.moveToBookmark(bookmark);
		if (!prevNode) return;
		// 行内代码：<p>foo `bar`<cursor /></p>
		// 高亮文字：<p>foo ==bar==<cursor /></p>
		// 粗体：<p>foo **bar**<cursor /></p>
		// 斜体：<p>foo _bar_<cursor /></p>
		// 删除线：<p>foo ~~bar~~<cursor /></p>
		// 上标：<p>foo ^bar^<cursor /></p>
		// 下标：<p>foo ~bar~<cursor /></p>
		// 快捷键

		const markTypeKeys = Object.keys(markType);
		for (let i = 0; i < markTypeKeys.length; i++) {
			const markKey = markTypeKeys[i];
			const key = markKey.replace(/(\*|\^)/g, '\\$1');
			const match = new RegExp(
				'^(.*)'.concat(key, '(.+?)').concat(key, '$'),
			).exec(prevText);
			if (match) {
				const visibleChar = match[1] && /\S$/.test(match[1]);
				const codeChar = match[2];
				const markName = markType[markKey];
				if (
					markName === '' ||
					!command.queryEnabled(markName) ||
					!this.checkItem(markName)
				) {
					return;
				}
				event.preventDefault();
				let leftText = prevText.substr(
					0,
					prevText.length - codeChar.length - 2 * markKey.length,
				);
				prevNode
					.get<Text>()!
					.splitText(
						(leftText + codeChar).length + 2 * markKey.length,
					);
				if (visibleChar) {
					leftText += ' ';
				}
				prevNode[0].nodeValue = leftText + codeChar;
				range.setStart(prevNode[0], leftText.length);
				range.setEnd(prevNode[0], (leftText + codeChar).length);
				change.select(range);
				command.execute(markName);
				range = change.getRange();
				range.collapse(false);
				change.select(range);
				change.insertText('\xa0');
				return false;
			}
		}
		return;
	}

	processLink(e: KeyboardEvent, range: RangeInterface) {
		const { change } = this.engine!;
		const bookmark = range.createBookmark();
		if (!bookmark) {
			return;
		}

		if (!this.checkItem('link')) return;

		const prevNode = $(bookmark.anchor).prev();
		const prevText =
			prevNode && prevNode.isText() ? prevNode[0].nodeValue || '' : '';
		range.moveToBookmark(bookmark);
		const match = /\[(.+?)\]\(([\S]+?)\)$/.exec(prevText);

		if (match) {
			e.preventDefault();
			let text = match[1];
			let url = match[2];
			let target = '_blank';
			if (this.options.onLink) {
				const customerConfig = this.options.onLink(text, url);
				url = customerConfig.href;
				target = customerConfig.target === undefined ? '_blank' : '';
			}
			const linkNode = $(
				`<a href="${sanitizeUrl(url)}${
					!!target ? ' target="' + target + '"' : ''
				}>${text}"</a>`,
			);
			// 移除 markdown 语法
			const markdownText = prevNode!
				.get<Text>()!
				.splitText(prevText.length - match[0].length);
			markdownText.splitText(match[0].length);
			$(markdownText).remove();
			change.insertInline(linkNode);
			change.insertText('\xA0');
			return false;
		}
		return;
	}

	checkItem(item: ItemOption) {
		return (
			!this.options.items ||
			this.options.items.length === 0 ||
			this.options.items.indexOf(item) > -1
		);
	}

	onKeydownSpace(event: KeyboardEvent, text: string) {
		const { change, command } = this.engine!;
		if (!!text && !text.match(/[`=*+-_^~\]#>)]$/)) return;
		const range = change.getRange();
		//处理mark命令
		if (this.processMark(event, range) === false) {
			return;
		}
		//处理链接
		if (this.processLink(event, range) === false) {
			return;
		}

		const block = range.startNode.getClosestBlock();
		if (!block.isHeading()) {
			return;
		}

		const chars = range.getBlockLeftText(block[0]);

		const type = this.getMarkdownType(chars);
		if (!type || !this.checkItem(type)) return;

		// 标题
		if (/^h\d$/i.test(type) && command.queryEnabled('heading')) {
			event.preventDefault();
			this.removeLeftText(block, range);
			command.execute('heading', type);
			return;
		}
		// fix: 列表、引用等 markdown 快捷方式不应该在标题内生效
		if (/^h\d$/i.test(block.name || '')) {
			return;
		}
		// 列表
		if (
			['orderedlist'].indexOf(type) >= 0 &&
			command.queryEnabled('orderedlist')
		) {
			event.preventDefault();
			this.removeLeftText(block, range);
			command.execute('orderedlist', chars);
			return;
		}
		if (
			['unorderedlist'].indexOf(type) >= 0 &&
			command.queryEnabled('unorderedlist')
		) {
			event.preventDefault();
			this.removeLeftText(block, range);
			command.execute('unorderedlist');
			return;
		}
		// 任务列表
		if (
			['tasklist', 'checkedtasklist'].indexOf(type) >= 0 &&
			command.queryEnabled('tasklist')
		) {
			event.preventDefault();
			this.removeLeftText(block, range);
			command.execute('tasklist', { checked: type !== 'tasklist' });
			return;
		}
		// 其它
		if (type === 'quote' && command.queryEnabled(type)) {
			event.preventDefault();
			this.removeLeftText(block, range);
			command.execute(type);
			return;
		}
		return;
	}
}
