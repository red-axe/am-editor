// 代码高亮css
import 'codemirror/lib/codemirror.css';
import 'codemirror/mode/shell/shell';
import 'codemirror/mode/clike/clike';
import 'codemirror/mode/css/css';
import 'codemirror/mode/dart/dart';
import 'codemirror/mode/diff/diff';
import 'codemirror/mode/dockerfile/dockerfile';
import 'codemirror/mode/erlang/erlang';
import 'codemirror/mode/go/go';
import 'codemirror/mode/groovy/groovy';
import 'codemirror/mode/htmlmixed/htmlmixed';
import 'codemirror/mode/http/http';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/jsx/jsx';
import 'codemirror/mode/cmake/cmake';
import 'codemirror/mode/markdown/markdown';
import 'codemirror/mode/octave/octave';
import 'codemirror/mode/nginx/nginx';
import 'codemirror/mode/pascal/pascal';
import 'codemirror/mode/perl/perl';
import 'codemirror/mode/php/php';
import 'codemirror/mode/powershell/powershell';
import 'codemirror/mode/protobuf/protobuf';
import 'codemirror/mode/python/python';
import 'codemirror/mode/r/r';
import 'codemirror/mode/ruby/ruby';
import 'codemirror/mode/rust/rust';
import 'codemirror/mode/sql/sql';
import 'codemirror/mode/swift/swift';
import 'codemirror/mode/vb/vb';
import 'codemirror/mode/velocity/velocity';
import 'codemirror/mode/xml/xml';
import 'codemirror/mode/yaml/yaml';
import 'codemirror/addon/scroll/simplescrollbars';
import 'codemirror/addon/scroll/simplescrollbars.css';
// 主题样式
import 'codemirror/theme/abbott.css';
import 'codemirror/theme/abcdef.css';
import 'codemirror/theme/ambiance.css';
import 'codemirror/theme/ayu-dark.css';
import 'codemirror/theme/base16-dark.css';
import 'codemirror/theme/blackboard.css';
import 'codemirror/theme/cobalt.css';
import 'codemirror/theme/dracula.css';
import 'codemirror/theme/duotone-light.css';
import 'codemirror/theme/eclipse.css';
import 'codemirror/theme/elegant.css';
import 'codemirror/theme/hopscotch.css';
import 'codemirror/theme/idea.css';
import 'codemirror/theme/mbo.css';
import 'codemirror/theme/mdn-like.css';
import 'codemirror/theme/monokai.css';
import 'codemirror/theme/neat.css';
import 'codemirror/theme/neo.css';
import 'codemirror/theme/nord.css';
import 'codemirror/theme/seti.css';
import 'codemirror/theme/shadowfox.css';
import 'codemirror/theme/ttcn.css';
import 'codemirror/theme/twilight.css';
import 'codemirror/theme/yeti.css';
import 'codemirror/theme/yonce.css';
import 'codemirror/theme/bespin.css';

export const cmTheme = [
	'abbott',
	'abcdef',
	'ambiance',
	'ayu-dark',
	'base16-dark',
	'bespin',
	'blackboard',
	'cobalt',
	'dracula',
	'duotone-light',
	'eclipse',
	'elegant',
	'hopscotch',
	'idea',
	'mbo',
	'mdn-like',
	'monokai',
	'neat',
	'neo',
	'nord',
	'seti',
	'shadowfox',
	'ttcn',
	'twilight',
	'yeti',
	'yonce',
];

export const langSyntaxMap = {
	plain: 'Plain Text',
	bash: 'Bash',
	basic: 'Basic',
	c: 'C',
	cpp: 'text/x-c++src',
	csharp: 'text/x-csharp',
	css: 'css',
	curl: 'Bash',
	dart: 'Dart',
	diff: 'Diff',
	erlang: 'Erlang',
	git: 'Git',
	dockerfile: 'Dockerfile',
	go: 'go', // alias: ['golang']
	graphql: 'GraphQL',
	groovy: 'Groovy',
	html: 'htmlmixed', // alias: ['html5']
	http: 'HTTP',
	java: 'text/x-java',
	javascript: 'text/javascript',
	json: 'application/json',
	jsx: 'JSX',
	katex: 'KaTeX',
	kotlin: 'Kotlin',
	less: 'Less',
	markdown: 'Markdown',
	matlab: 'MATLAB',
	nginx: 'Nginx',
	objectivec: 'Objective-C',
	pascal: 'Pascal',
	perl: 'Perl',
	php: 'text/x-php',
	powershell: 'PowerShell',
	python: 'python',
	r: 'R',
	ruby: 'Ruby',
	rust: 'Rust',
	scala: 'Scala',
	shell: 'Shell',
	sql: 'SQL',
	swift: 'Swift',
	typescript: 'text/typescript',
	vbnet: 'vb',
	velocity: 'velocity',
	xml: 'XML',
	yaml: 'YAML',
};

export const languageMap = ['javascript', 'java', 'python', 'php'];

export function formateLangStyle(lang: string) {
	return lang[0].toUpperCase() + lang.slice(1).toLowerCase();
}
