import { isMacos } from '@aomao/engine';

export default {
	math: {
		errorMessageCopy: 'Copy error message',
		getError: 'Failed to get svg code',
		placeholder: 'Add Tex formula',
		ok: 'Ok',
		buttonTips: `${isMacos ? '⌘' : 'Ctrl'} + Enter`,
		tips: {
			text: 'Understand LaTeX syntax',
			href: 'https://math.meta.stackexchange.com/questions/5020/mathjax-basic-tutorial-and-quick-reference',
		},
	},
};
