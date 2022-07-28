import container from 'markdown-it-container';
import type MarkdownIt from 'markdown-it';
import { encodeCardValue } from '@aomao/engine';

export default function mk_lightblock(md: MarkdownIt) {
	const defaultValue = {
		borderColor: '#fed4a4',
		backgroundColor: '#fff5eb',
		text: 'light-block',
	};

	md.use(container, 'tip', {
		render(tokens: any, idx: number) {
			if (tokens[idx].nesting === 1) {
				return `<div data-type="lightblock" data-value="${encodeCardValue(
					defaultValue,
				)}">`;
			} else {
				return '</div>';
			}
		},
	});
}
