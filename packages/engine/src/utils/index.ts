import MarkdownIt from 'markdown-it';
import Markdown from 'markdown-it';
import Token from 'markdown-it/lib/token';
import { EditorInterface, EngineInterface, ViewInterface } from '../types';
import TinyCanvas from './tiny-canvas';
export * from './string';
export * from './user-agent';
export * from './list';
export * from './node';
export { TinyCanvas };

/**
 * 是否是引擎
 * @param editor 编辑器
 */
export const isEngine = (
	editor: EditorInterface,
): editor is EngineInterface => {
	return editor.kind === 'engine';
};
/**
 * 是否是View
 * @param editor 编辑器
 */
export const isView = (editor: EditorInterface): editor is ViewInterface => {
	return editor.kind === 'view';
};

export const createMarkdownIt = (
	editor: EditorInterface,
	presetName: Markdown.PresetName = 'default',
) => {
	const markdown = new Markdown(presetName, {
		html: true,
		typographer: true,
		linkify: true,
	});
	editor.trigger('markdown-it', markdown);
	return markdown;
};

export const convertMarkdown = (
	editor: EditorInterface,
	markdown: MarkdownIt,
	tokens: Token[],
	checkInline: boolean = true,
) => {
	const { renderer, options } = markdown;
	let isHit = false;
	const blockTags = editor.schema.getTags('blocks');
	let textContent = '';
	let nodeContent: string[] = [];
	tokens.forEach((token, index) => {
		const { type, tag, children, nesting } = token;
		const result = editor.trigger('markdown-it-token', {
			token,
			markdown,
			callback: (result: string) => {
				textContent += result;
			},
		});
		if (result === false) {
			isHit = true;
			return;
		}

		let content = '';
		if (type === 'inline' && children) {
			content = renderer.renderInline(children, options, {});
			if (
				checkInline &&
				children.find(
					(child) =>
						child.type === 'image' ||
						child.type.endsWith('_inline') ||
						child.type.endsWith('_open'),
				)
			) {
				isHit = true;
			}
		} else if (typeof renderer.rules[type] !== 'undefined') {
			content = renderer.rules[type]!(
				tokens,
				index,
				options,
				{},
				renderer,
			);
		} else {
			content = renderer.renderToken(tokens, index, options);
		}
		if (nesting === 1) {
			nodeContent.push('');
			textContent += content;
		} else if (nesting === 0) {
			if (nodeContent.length === 0) {
				textContent += content;
				if (tag && !isHit) isHit = true;
			} else if (!!content)
				nodeContent[nodeContent.length - 1] += content;
		} else if (nesting === -1) {
			if (
				nodeContent.length > 0 &&
				!nodeContent[nodeContent.length - 1] &&
				blockTags.includes(tag)
			)
				nodeContent[nodeContent.length - 1] += '<br />';
			textContent += nodeContent[nodeContent.length - 1] ?? '';
			nodeContent.pop();
			if (nodeContent.every((content) => !content)) nodeContent = [];
			textContent += content;
			if (!isHit && tag !== 'p') isHit = true;
		}
	});
	if (isHit && textContent) return textContent;
	return null;
};
