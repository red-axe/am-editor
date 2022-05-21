// Markdown-it plugin to render GitHub-style task lists; see
import type MarkdownIt from 'markdown-it';
import type Token from 'markdown-it/lib/token';
import {
	CARD_TYPE_KEY,
	CARD_VALUE_KEY,
	encodeCardValue,
	CARD_KEY,
} from '@aomao/engine';
import StateCore from 'markdown-it/lib/rules_core/state_core';
//
// https://github.com/blog/1375-task-lists-in-gfm-issues-pulls-comments
// https://github.com/blog/1825-task-lists-in-all-markdown-documents

interface Options {
	itemClass?: string;
	rootClass?: string;
	checkStrings: string[];
}
const defaultCheckStrings = ['[ ] ', '[x] ', '[X] '];
export default function (md: MarkdownIt, options: Options) {
	if (!options)
		options = {
			checkStrings: defaultCheckStrings,
		};
	options.checkStrings = options.checkStrings || defaultCheckStrings;

	md.core.ruler.after('inline', 'task-list', function (state) {
		const { tokens } = state;
		for (let i = 2; i < tokens.length; i++) {
			if (isTodoItem(tokens, i, options)) {
				todoify(tokens, i, state, options);
			} else if (isTodoItemNotList(tokens, i - 1, options)) {
				todoifyNotList(tokens, i, state, options);
			}
		}
	});
}

function attrSet(token: Token, name: string, value: string) {
	const index = token.attrIndex(name);
	const attr: [string, string] = [name, value];

	if (index < 0) {
		token.attrPush(attr);
	} else {
		if (!token.attrs) token.attrs = [];
		token.attrs[index] = attr;
	}
}

function parentToken(tokens: Token[], index: number) {
	const targetLevel = tokens[index].level - 1;
	for (var i = index - 1; i >= 0; i--) {
		if (tokens[i].level === targetLevel) {
			return i;
		}
	}
	return -1;
}

function isTodoItem(tokens: Token[], index: number, options: Options) {
	return (
		isInline(tokens[index]) &&
		isParagraph(tokens[index - 1]) &&
		startsWithTodoMarkdown(tokens[index], false, options) &&
		isListItem(tokens[index - 2])
	);
}

function isTodoItemNotList(tokens: Token[], index: number, options: Options) {
	return (
		isInline(tokens[index]) &&
		isParagraph(tokens[index - 1]) &&
		startsWithTodoMarkdown(tokens[index], true, options) &&
		(index - 2 < 0 || !isListItem(tokens[index - 2]))
	);
}

function todoify(
	tokens: Token[],
	index: number,
	state: StateCore,
	options: Options,
) {
	const contentToken = tokens[index];
	const itemToken = tokens[index - 2];
	if (options.itemClass) attrSet(itemToken, 'class', options.itemClass);
	if (options.rootClass)
		attrSet(
			tokens[parentToken(tokens, index - 2)],
			'class',
			options.rootClass,
		);
	// content
	const { markup, content, checked } = getInfo(
		contentToken,
		options.checkStrings,
	);
	itemToken.markup = markup;
	contentToken.content = content;
	if (contentToken.children && contentToken.children.length > 0)
		contentToken.children[0].content = contentToken.content;
	itemToken.info = checked ? 'true' : 'false';
	// checkbox open
	const [openCheckItem, closeCheckItem] = makeCheckbox(checked, state.Token);
	tokens.splice(index, 0, openCheckItem);
	// checkbox close
	tokens.splice(index + 1, 0, closeCheckItem);
}

function todoifyNotList(
	tokens: Token[],
	index: number,
	state: StateCore,
	options: Options,
) {
	const closeToken = tokens[index];
	const contentToken = tokens[index - 1];
	const openToken = tokens[index - 2];
	// ul open
	openToken.tag = 'ul';
	openToken.type = 'task_list_open';
	if (options.rootClass) attrSet(openToken, 'class', options.rootClass);
	// li open
	const openItem = new state.Token('task_list_item_open', 'li', 1);
	if (options.itemClass) attrSet(openItem, 'class', options.itemClass);
	tokens.splice(index - 1, 0, openItem);
	// content
	const { markup, content, checked } = getInfo(
		contentToken,
		options.checkStrings,
	);
	openItem.markup = markup;
	contentToken.content = content;
	if (contentToken.children && contentToken.children.length > 0)
		contentToken.children[0].content = contentToken.content;
	openItem.info = checked ? 'true' : 'false';
	// checkbox open
	const [openCheckItem, closeCheckItem] = makeCheckbox(checked, state.Token);
	tokens.splice(index, 0, openCheckItem);
	// checkbox close
	tokens.splice(index + 1, 0, closeCheckItem);
	// close li
	const closeItem = new state.Token('task_list_item_close', 'li', -1);
	tokens.splice(index + 3, 0, closeItem);
	// ul close
	closeToken.tag = 'ul';
	closeToken.type = 'task_list_close';
}

function getInfo(token: Token, checkStrings: string[]) {
	let markup: string = '';
	let content = '';
	let checked = false;
	for (let i = 0; i < checkStrings.length; i++) {
		const str = checkStrings[i];
		const replace = (s: string, trim = false) => {
			const c = trim ? s.trim() : str;
			if (token.content.startsWith(c)) {
				markup = c;
				content = token.content.replace(c, '');
				checked = c.substring(1, 2).trim().toLowerCase() === 'x';
				return true;
			}
			return false;
		};
		let result = replace(str);
		if (!result) result = replace(str, true);
		if (result) break;
	}
	return {
		markup,
		content,
		checked,
	};
}

function makeCheckbox(checked: boolean, TokenConstructor: typeof Token) {
	const openCheckItem = new TokenConstructor(
		'task_list_item_checkbox_open',
		'span',
		1,
	);
	attrSet(openCheckItem, CARD_TYPE_KEY, 'inline');
	attrSet(openCheckItem, CARD_KEY, 'checkbox');
	attrSet(
		openCheckItem,
		CARD_VALUE_KEY,
		encodeCardValue({
			type: 'inline',
			checked,
		}),
	);
	// checkbox close
	const closeCheckItem = new TokenConstructor(
		'task_list_item_checkbox_close',
		'span',
		-1,
	);
	return [openCheckItem, closeCheckItem];
}

function isInline(token: Token) {
	return token.type === 'inline';
}
function isParagraph(token: Token) {
	return token.type === 'paragraph_open';
}
function isListItem(token: Token) {
	return token.type === 'list_item_open';
}

function startsWithTodoMarkdown(
	token: Token,
	trim: boolean = false,
	options: Options,
) {
	// leading whitespace in a list item is already trimmed off by markdown-it
	return options.checkStrings.some(
		(str) => token.content.indexOf(trim ? str.trim() : str) === 0,
	);
}
