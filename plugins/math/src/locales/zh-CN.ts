import { isMacos } from '@aomao/engine';

export default {
	math: {
		errorMessageCopy: '复制错误信息',
		getError: '获取svg代码失败',
		placeholder: '添加 Tex 公式',
		ok: '确定',
		buttonTips: `${isMacos ? '⌘' : 'Ctrl'} + Enter`,
		tips: {
			text: '了解 LaTeX 语法',
			href: 'https://math.meta.stackexchange.com/questions/5020/mathjax-basic-tutorial-and-quick-reference',
		},
	},
};
