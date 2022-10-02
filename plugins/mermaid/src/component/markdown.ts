import type MarkdownIt from 'markdown-it';
import MermaidPlugin from './mermaid';

export default function mk_mermaid(md: MarkdownIt, editor: any) {
	md.use(MermaidPlugin, {
		render(code: any) {
			editor.command.executeMethod('mermaid', 'execute', code);
		},
	});
}
