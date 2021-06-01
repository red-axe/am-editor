import { isServer } from '@aomao/engine';

if (!isServer) {
	import('codemirror/mode/shell/shell');
	import('codemirror/mode/clike/clike');
	import('codemirror/mode/css/css');
	import('codemirror/mode/dart/dart');
	import('codemirror/mode/diff/diff');
	import('codemirror/mode/dockerfile/dockerfile');
	import('codemirror/mode/erlang/erlang');
	import('codemirror/mode/go/go');
	import('codemirror/mode/groovy/groovy');
	import('codemirror/mode/htmlmixed/htmlmixed');
	import('codemirror/mode/http/http');
	import('codemirror/mode/javascript/javascript');
	import('codemirror/mode/jsx/jsx');
	import('codemirror/mode/cmake/cmake');
	import('codemirror/mode/markdown/markdown');
	import('codemirror/mode/octave/octave');
	import('codemirror/mode/nginx/nginx');
	import('codemirror/mode/pascal/pascal');
	import('codemirror/mode/perl/perl');
	import('codemirror/mode/php/php');
	import('codemirror/mode/powershell/powershell');
	import('codemirror/mode/protobuf/protobuf');
	import('codemirror/mode/python/python');
	import('codemirror/mode/r/r');
	import('codemirror/mode/ruby/ruby');
	import('codemirror/mode/rust/rust');
	import('codemirror/mode/sql/sql');
	import('codemirror/mode/swift/swift');
	import('codemirror/mode/vb/vb');
	import('codemirror/mode/velocity/velocity');
	import('codemirror/mode/xml/xml');
	import('codemirror/mode/yaml/yaml');
}

const datas = [
	{
		value: 'plain',
		syntax: 'simplemode',
		name: 'Plain Text',
	},
	{
		value: 'bash',
		syntax: 'shell',
		name: 'Bash',
	},
	{
		value: 'basic',
		syntax: 'vbscript',
		name: 'Basic',
	},
	{
		value: 'c',
		syntax: 'text/x-csrc',
		name: 'C',
	}, // text/x-csrc
	{
		value: 'cpp',
		syntax: 'text/x-c++src',
		name: 'C++',
	},
	{
		value: 'csharp',
		syntax: 'text/x-csharp',
		name: 'C#',
	},
	{
		value: 'css',
		syntax: 'css',
		name: 'CSS',
	},
	{
		value: 'dart',
		syntax: 'dart',
		name: 'Dart',
	},
	{
		value: 'diff',
		syntax: 'diff',
		name: 'Diff',
	},
	{
		value: 'dockerfile',
		syntax: 'dockerfile',
		name: 'Dockerfile',
	},
	{
		value: 'erlang',
		syntax: 'erlang',
		name: 'Erlang',
	},
	{
		value: 'git',
		syntax: 'shell',
		name: 'Git',
	},
	{
		value: 'go',
		syntax: 'go',
		name: 'Go',
	},
	{
		value: 'graphql',
		syntax: 'simplemode',
		name: 'GraphQL',
	},
	{
		value: 'groovy',
		syntax: 'groovy',
		name: 'Groovy',
	},
	{
		value: 'html',
		syntax: 'htmlmixed',
		name: 'HTML',
	},
	{
		value: 'http',
		syntax: 'http',
		name: 'HTTP',
	},
	{
		value: 'java',
		syntax: 'text/x-java',
		name: 'Java',
	},
	{
		value: 'javascript',
		syntax: 'text/javascript',
		name: 'JavaScript',
	},
	{
		value: 'json',
		syntax: 'application/json',
		name: 'JSON',
	},
	{
		value: 'jsx',
		syntax: 'jsx',
		name: 'JSX',
	},
	{
		value: 'katex',
		syntax: 'simplemode',
		name: 'KaTeX',
	},
	{
		value: 'kotlin',
		syntax: 'text/x-kotlin',
		name: 'Kotlin',
	},
	{
		value: 'less',
		syntax: 'css',
		name: 'Less',
	},
	{
		value: 'makefile',
		syntax: 'cmake',
		name: 'Makefile',
	},
	{
		value: 'markdown',
		syntax: 'markdown',
		name: 'Markdown',
	},
	{
		value: 'matlab',
		syntax: 'octave',
		name: 'MATLAB',
	},
	{
		value: 'nginx',
		syntax: 'nginx',
		name: 'Nginx',
	},
	{
		value: 'objectivec',
		syntax: 'text/x-objectivec',
		name: 'Objective-C',
	},
	{
		value: 'pascal',
		syntax: 'pascal',
		name: 'Pascal',
	},
	{
		value: 'perl',
		syntax: 'perl',
		name: 'Perl',
	},
	{
		value: 'php',
		syntax: 'php',
		name: 'PHP',
	},
	{
		value: 'powershell',
		syntax: 'powershell',
		name: 'PowerShell',
	},
	{
		value: 'protobuf',
		syntax: 'protobuf',
		name: 'Protobuf',
	},
	{
		value: 'python',
		syntax: 'python',
		name: 'Python',
	},
	{
		value: 'r',
		syntax: 'r',
		name: 'R',
	},
	{
		value: 'ruby',
		syntax: 'ruby',
		name: 'Ruby',
	},
	{
		value: 'rust',
		syntax: 'rust',
		name: 'Rust',
	},
	{
		value: 'scala',
		syntax: 'text/x-scala',
		name: 'Scala',
	},
	{
		value: 'shell',
		syntax: 'shell',
		name: 'Shell',
	},
	{
		value: 'sql',
		syntax: 'text/x-sql',
		name: 'SQL',
	},
	{
		value: 'swift',
		syntax: 'swift',
		name: 'Swift',
	},
	{
		value: 'typescript',
		syntax: 'text/typescript',
		name: 'TypeScript',
	},
	{
		value: 'vbnet',
		syntax: 'vb',
		name: 'VB.net',
	},
	{
		value: 'velocity',
		syntax: 'velocity',
		name: 'Velocity',
	},
	{
		value: 'xml',
		syntax: 'xml',
		name: 'XML',
	},
	{
		value: 'yaml',
		syntax: 'yaml',
		name: 'YAML',
	},
];

const NAME_MAP: { [key: string]: string } = {};
const SYNTAX_MAP: { [key: string]: string } = {};
datas.forEach(item => {
	NAME_MAP[item.value] = item.name;
	SYNTAX_MAP[item.value] = item.syntax;
});

export default datas;
export { NAME_MAP, SYNTAX_MAP };
