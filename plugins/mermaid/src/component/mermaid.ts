import Mermaid from 'mermaid';
import murmur3 from 'murmurhash-js';

/**
 * mermaid默认配置
 * https://mermaid-js.github.io/mermaid/#/n00b-syntaxReference
 */
const defaultConfig: any = {
	startOnLoad: false,
	theme: 'default',
	flowchart: {
		diagramPadding: 20,
		nodeSpacing: 90,
		rankSpacing: 90,
		htmlLabels: false,
		curve: 'cardinal',
	},
	dictionary: {
		token: 'mermaid',
	},
};

const htmlEntities = (str: string) =>
	String(str)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');

/**
 * 生成图表
 * @param code
 * @returns
 */
export const MermaidChart = (code: string) => {
	try {
		Mermaid.initialize(defaultConfig);
		const needsUniqueId =
			'mermaid-' + murmur3(code, 42).toString() + new Date().getTime();

		console.log('needsUniqueId', needsUniqueId, code);

		Mermaid.mermaidAPI.render(needsUniqueId, code, (sc: string) => {
			code = sc;
		});

		return `${code}`;
	} catch (err: any) {
		return `<pre>${htmlEntities(err?.name)}: ${htmlEntities(
			err?.message,
		)}</pre>`;
	}
};

/**
 * 代码重写
 * @param md
 * @param opts
 */
const MermaidPlugIn = (md: any, opts: any) => {
	Object.assign(defaultConfig, opts.mermaid);
	const { token: _token = 'mermaid', ...dictionary } =
		defaultConfig.dictionary;

	const defaultRenderer = md.renderer.rules.fence.bind(md.renderer.rules);

	function replacer(_: any, p1: any, p2: any, p3: any) {
		p1 = dictionary[p1] ?? p1;
		p2 = dictionary[p2] ?? p2;
		return p2 === '' ? `${p1}\n` : `${p1} ${p2}${p3}`;
	}

	md.renderer.rules.fence = (
		tokens: any,
		idx: number,
		opt: any,
		env: any,
		self: any,
	) => {
		const token = tokens[idx];
		const code = token.content.trim();
		if (token.info.trim() === _token) {
			//   MermaidChart(code.replace(/(.*?)[ \n](.*?)([ \n])/, replacer));
			if (opts?.render) {
				opts?.render(code.replace(/(.*?)[ \n](.*?)([ \n])/, replacer));
			}
			return;
		}
		return defaultRenderer(tokens, idx, opts, env, self);
	};
};

export default MermaidPlugIn;
