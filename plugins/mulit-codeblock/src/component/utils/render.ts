/* eslint-disable max-len */

import { MulitCodeblockValue } from '../type';
import { encodeCardValue } from '@aomao/engine';

export default function renderHTMLTemplate(
	name: string,
	props: MulitCodeblockValue,
) {
	const { langs, height, theme } = props;

	function renderHeader() {
		let headerHtml = '';
		langs.forEach((item, i) => {
			headerHtml += `<div class="mulit-code-block-header-item  ${theme} ${
				i === 0 ? 'mulit-code-block-header-item-active' : ''
			}">${item.language}</div>`;
		});

		return `<div class="mulit-code-block-header">${headerHtml}</div>`;
	}

	const html =
		'<div class="__qz-codeblock_view__ mulit-code-block mulit-code-block-view"' +
		`data-type="${name}"` +
		`data-value="${encodeCardValue(props)}">` +
		`${renderHeader()}` +
		'<div class="__qz-codeblock_view__contain mulit-code-block-content qz-code-block-editor-container"' +
		`style="height: ${height};">` +
		'<div class="__qz-codeblock_view__scroll qz-codeblock-scroll"' +
		`style="height: ${height}; overflow-y: scroll">` +
		'</div>' +
		'</div>' +
		'</div>';

	return html;
}
