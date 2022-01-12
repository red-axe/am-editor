import CodeMirror, { EditorConfiguration, Editor } from 'codemirror';
import { debounce } from 'lodash';
import {
	$,
	EditorInterface,
	isEngine,
	isHotkey,
	isMobile,
	NodeInterface,
} from '@aomao/engine';
import { CodeBlockEditorInterface, Options } from './types';
const qa = [
	'c',
	'cpp',
	'csharp',
	'erlang',
	'go',
	'groovy',
	'java',
	'kotlin',
	'makefile',
	'objectivec',
	'perl',
	'python',
	'rust',
	'swift',
	'vbnet',
];

class CodeBlockEditor implements CodeBlockEditorInterface {
	private editor: EditorInterface;
	private options: Options;
	codeMirror?: Editor;
	mode: string = 'plain';
	container: NodeInterface;

	constructor(editor: EditorInterface, options: Options) {
		this.editor = editor;
		this.options = options;
		this.container = options.container || $(this.renderTemplate());
	}

	renderTemplate() {
		return '<div class="data-codeblock-container"><div class="data-codeblock-content"></div></div>';
	}

	getConfig(value: string, mode?: string): EditorConfiguration {
		let tabSize = this.codeMirror
			? this.codeMirror.getOption('indentUnit')
			: qa.indexOf(mode || '') > -1
			? 4
			: 2;
		const reg = value ? value.match(/^ {2,4}(?=[^\s])/gm) : null;
		if (reg) {
			tabSize = reg.reduce((val1, val2) => {
				return Math.min(val1, val2.length);
			}, 1 / 0);
		}
		return {
			tabSize,
			indentUnit: tabSize,
			scrollbarStyle: 'simple',
			readOnly: !isEngine(this.editor) || this.editor.readonly,
			viewportMargin: Infinity,
		};
	}

	getSyntax(mode: string) {
		return this.options.synatxMap[mode];
	}

	create(mode: string, value: string, options?: EditorConfiguration) {
		this.mode = mode;
		const syntaxMode = this.getSyntax(mode);
		this.codeMirror = CodeMirror(
			this.container.find('.data-codeblock-content').get<HTMLElement>()!,
			{
				value,
				mode: syntaxMode,
				lineNumbers: true,
				lineWrapping: false,
				autofocus: false,
				dragDrop: false,
				...this.getConfig(value, syntaxMode),
				...options,
			},
		);
		this.codeMirror.on('mousedown', (_, event) => {
			if (!isEngine(this.editor) || this.editor.readonly) {
				event.preventDefault();
				event.stopPropagation();
			}
		});
		this.codeMirror.on('focus', () => {
			const { onFocus } = this.options;
			if (onFocus) onFocus();
		});
		this.codeMirror.on('keydown', (editor, event) => {
			// 撤销和重做使用codemirror自带的操作
			if (
				isHotkey('mod+z', event) ||
				isHotkey('mod+y', event) ||
				isHotkey('mod+shift+z', event)
			) {
				event.stopPropagation();
			}
			const lineCount = editor.lineCount();
			const { line, ch } = editor.getCursor();
			const { onUpFocus, onDownFocus, onLeftFocus, onRightFocus } =
				this.options;

			const content = editor.getLine(line);
			// 在最后一行
			if (line === lineCount - 1 && ch === content.length) {
				// 按下下键
				if (isHotkey('down', event) || isHotkey('ctrl+n', event)) {
					if (onDownFocus) onDownFocus(event);
					return;
				}
				// 按下右键
				else if (
					isHotkey('right', event) ||
					isHotkey('shift+right', event) ||
					isHotkey('ctrl+e', event) ||
					isHotkey('ctrl+f', event)
				) {
					if (onRightFocus) onRightFocus(event);
					return;
				}
			}
			// 在第一行按下上键
			if (line === 0 && ch === 0) {
				// 按下上键
				if (isHotkey('up', event) || isHotkey('ctrl+p', event)) {
					if (onUpFocus) onUpFocus(event);
				}
				// 按下左键
				else if (
					isHotkey('left', event) ||
					isHotkey('shift+left', event) ||
					isHotkey('ctrl+b', event) ||
					isHotkey('ctrl+a', event)
				) {
					if (onLeftFocus) onLeftFocus(event);
				}
			}
		});
		this.codeMirror.on('blur', () => {
			const { onBlur } = this.options;
			this.codeMirror?.setCursor(this.codeMirror.lineCount() - 1, 0);
			if (onBlur) onBlur();
		});
		if (isMobile) {
			this.codeMirror.on('touchstart', (_, event) => {
				const { onMouseDown } = this.options;
				if (onMouseDown) onMouseDown(event);
			});
		} else {
			this.codeMirror.on('mousedown', (_, event) => {
				const { onMouseDown } = this.options;
				if (onMouseDown) onMouseDown(event);
			});
		}

		this.codeMirror.on(
			'change',
			debounce(() => {
				if (!isEngine(this.editor)) return;
				this.save();
			}, 50),
		);

		this.codeMirror.setOption('extraKeys', {
			Enter: (mirror) => {
				const config = this.getConfig(mirror.getValue());
				Object.keys(config).forEach((key) => {
					return mirror.setOption(
						key as keyof EditorConfiguration,
						config[key],
					);
				});
				mirror.execCommand('newlineAndIndent');
			},
		});

		this.container.on('mousedown', (event: MouseEvent) => {
			if (!this.codeMirror?.hasFocus()) {
				setTimeout(() => {
					this.codeMirror?.focus();
				}, 0);
			}
		});
		return this.codeMirror;
	}

	setAutoWrap(value: boolean) {
		this.codeMirror?.setOption('lineWrapping', value);
	}

	update(mode: string, code?: string) {
		this.mode = mode;
		if (code !== undefined) {
			this.codeMirror?.setValue(code);
		}
		this.codeMirror?.setOption('mode', this.getSyntax(mode));
		this.codeMirror?.setOption(
			'readOnly',
			!isEngine(this.editor) || this.editor.readonly ? true : false,
		);
		this.save();
	}

	render(mode: string, value: string, options?: EditorConfiguration) {
		const root = this.container.find('.data-codeblock-content');
		mode = this.getSyntax(mode);
		const stage = $(
			'<div class="CodeMirror"><pre class="cm-s-default" /></div>',
		);
		root.append(stage);
		const pre = stage.find('pre')[0];
		this.runMode(value || '', mode, pre, {
			...this.getConfig(value, mode),
			...options,
		});
	}

	save() {
		if (!isEngine(this.editor) || !this.codeMirror) return;
		// 中文输入过程需要判断
		if (this.editor.change.isComposing()) {
			return;
		}
		const value = this.codeMirror.getValue();
		const { onSave } = this.options;
		if (onSave) onSave(this.mode, value);
	}

	focus() {
		if (!this.codeMirror) return;
		this.codeMirror.focus();
	}

	select(start: boolean = true) {
		if (!this.codeMirror) return;
		this.codeMirror.focus();
		if (!start) {
			const line = this.codeMirror.lineCount() - 1;
			const content = this.codeMirror.getLine(line);
			this.codeMirror.setSelection({ line, ch: content.length });
		} else {
			this.codeMirror.setSelection({ line: 0, ch: 0 });
		}
	}

	/**
	 * 代码来自 runmode addon
	 * 支持行号需要考虑复制粘贴问题
	 *
	 * runmode 本身不支持行号，见 https://github.com/codemirror/CodeMirror/issues/3364
	 * 可参考的解法  https://stackoverflow.com/questions/14237361/use-codemirror-for-standalone-syntax-highlighting-with-line-numbers
	 *
	 * ref:
	 * - https://codemirror.net/doc/manual.html#addons
	 * - https://codemirror.net/addon/runmode/runmode.js
	 */
	runMode(string: string, modespec: string, callback: any, options: any) {
		const mode = CodeMirror.getMode(CodeMirror.defaults, modespec);
		const ie = /MSIE \d/.test(navigator.userAgent);
		const ie_lt9 =
			ie &&
			(document['documentMode'] == null || document['documentMode'] < 9);

		if (callback.appendChild) {
			const tabSize =
				(options && options.tabSize) || CodeMirror.defaults.tabSize;
			const node = callback;
			let col = 0;
			node.innerHTML = '';

			callback = (text: string, style: string) => {
				if (text === '\n') {
					// Emitting LF or CRLF on IE8 or earlier results in an incorrect display.
					// Emitting a carriage return makes everything ok.
					const lineCode = document.createElement('br');
					node.appendChild(lineCode);
					col = 0;
					return;
				}

				let content = '';
				// replace tabs

				for (let pos = 0; ; ) {
					const idx = text.indexOf('\t', pos);

					if (idx === -1) {
						content += text.slice(pos);
						col += text.length - pos;
						break;
					} else {
						col += idx - pos;
						content += text.slice(pos, idx);
						const size = tabSize - (col % tabSize);
						col += size;

						for (let i = 0; i < size; ++i) {
							content += ' ';
						}

						pos = idx + 1;
					}
				}

				if (style) {
					const sp = node.appendChild(document.createElement('span'));
					sp.className = 'cm-' + style.replace(/ +/g, ' cm-');
					sp.appendChild(document.createTextNode(content));
				} else {
					node.appendChild(document.createTextNode(content));
				}
			};
		}

		const lines = CodeMirror.splitLines(string);
		const state = (options && options.state) || CodeMirror.startState(mode);

		for (let i = 0, e = lines.length; i < e; ++i) {
			if (i) callback('\n');
			const stream = new CodeMirror.StringStream(lines[i]);
			if (!stream.string && mode.blankLine) mode.blankLine(state);

			while (!stream.eol()) {
				const style = mode.token ? mode.token(stream, state) : '';
				callback(stream.current(), style, i, stream.start, state);
				stream.start = stream.pos;
			}
		}
	}
}

export default CodeBlockEditor;
