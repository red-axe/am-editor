import { encodeCardValue } from '@aomao/engine';
import type MarkdownIt from 'markdown-it';
import container from 'markdown-it-container';

export function mk_mulit_codeblock(md: MarkdownIt) {
	const defaultValue = {
		langs: [
			{
				language: 'javascript',
				text: '',
			},
		],
		language: ['javascript'],
		wrap: false,
		theme: 'default',
		height: 'auto',
	};

	md.use(container, 'code', {
		validate: function (params: string) {
			return params.trim().match(/^code(.*)/);
		},

		render(tokens: any, idx: number) {
			const list = tokens[idx].info.trim().match(/^code\((.*)\)/);
			if (tokens[idx].nesting === 1) {
				if (list) {
					const lang = list[1] ? list[1].split(',') : [];
					if (lang && lang.length > 0) {
						defaultValue.langs = [
							{
								language: lang[0],
								text: '',
							},
						];
						defaultValue.language = lang;
					}
				}
				return `<div data-type="mulit_codeblock" data-value="${encodeCardValue(
					defaultValue,
				)}">`;
			} else {
				return '</div>';
			}
		},
	});
}
