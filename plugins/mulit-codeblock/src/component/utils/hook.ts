import { useEffect, useRef, useState } from 'react';
import codeMirror, { Editor } from 'codemirror';
import { MulitLangItem, MulitCodeProps, MulitCodeblockValue } from '../type';
import { $, isEngine, isHotkey, isMobile } from '@aomao/engine';
import debounce from 'lodash/debounce';
import { langSyntaxMap } from './index';

export const useInitLanguage = (props: MulitCodeProps) => {
	const { value } = props;
	const curLanguage = value.langs[0];

	const [list, setList] = useState(value.langs);
	const listRef = useRef(value.langs);
	const [current, setCurrentLanguage] = useState(curLanguage);
	const currentRef = useRef(curLanguage);

	const refreshList = (data: MulitLangItem[]) => {
		listRef.current = data;
		setList(data);
	};

	const refreshCurrent = (data: MulitLangItem) => {
		currentRef.current = data;
		setCurrentLanguage(data);
	};

	return {
		list,
		current,
		listRef,
		currentRef,
		refreshList,
		refreshCurrent,
	};
};

interface MirrorEditorProps {
	props: MulitCodeProps;
	current: React.RefObject<MulitLangItem>;
	list: React.RefObject<MulitLangItem[]>;
	refreshList: (val: MulitLangItem[]) => void;
}

export function useMirrorEditor({
	current,
	list,
	props,
	refreshList,
}: MirrorEditorProps) {
	const { editor, options, value, init } = props;

	const ref = useRef<HTMLPreElement>(null);
	const mirror = useRef<Editor>(null);

	const save = () => {
		if (!isEngine(editor) || !mirror || !ref.current) {
			return;
		}
		// 中文输入过程需要判断
		if (editor.change.isComposing()) {
			return;
		}

		// 语言切换时不需要触发
		// if (!== langSyntaxMap[current.current?.language || '']) {
		//   return;
		// }

		const text = mirror.current?.getValue() || '';
		// 组件内部保存
		const lg =
			list.current?.map((item) => {
				if (item.language === current.current?.language) {
					return { ...item, text };
				}
				return item;
			}) || [];
		refreshList(lg);
		options?.onUpdateValue?.({ langs: lg });
	};

	useEffect(() => {
		if (mirror.current) {
			const langSyntax = langSyntaxMap[current.current?.language || ''];
			mirror.current.setOption('mode', langSyntax);
			mirror.current.setValue(current.current?.text || '');
		}
	}, [current.current?.language]);

	useEffect(() => {
		if (!ref.current) {
			return;
		}

		const CM = codeMirror(ref.current, {
			value: current.current?.text,
			lineNumbers: true, // 显示行数
			indentUnit: 4, // 缩进单位为4
			lineWrapping: value.wrap,
			autofocus: false,
			dragDrop: false,
			scrollbarStyle: 'simple',
			viewportMargin: Infinity,
			theme: value.theme,
			readOnly: !isEngine(editor) || editor.readonly,
			mode: langSyntaxMap[current.current?.language || ''],
		});

		(mirror.current as unknown) = CM;

		init(CM);
		// codemirorr 监听事件
		CM.on('focus', () => {
			const { onFocus } = options;
			if (onFocus) {
				onFocus();
			}
		});
		CM.on('keydown', (cmEditor, event) => {
			// 撤销和重做使用codemirror自带的操作
			if (
				isHotkey('mod+z', event) ||
				isHotkey('mod+y', event) ||
				isHotkey('mod+shift+z', event)
			) {
				event.stopPropagation();
			}
			const lineCount = cmEditor.lineCount();
			const { line, ch } = cmEditor.getCursor();
			const { onUpFocus, onDownFocus, onLeftFocus, onRightFocus } =
				options;

			const content = cmEditor.getLine(line);
			// 在最后一行
			if (line === lineCount - 1 && ch === content.length) {
				if (isHotkey('down', event) || isHotkey('ctrl+n', event)) {
					// 按下下键
					if (onDownFocus) {
						onDownFocus(event);
					}
					return;
				} else if (
					// 按下右键
					isHotkey('right', event) ||
					isHotkey('shift+right', event) ||
					isHotkey('ctrl+e', event) ||
					isHotkey('ctrl+f', event)
				) {
					if (onRightFocus) {
						onRightFocus(event);
					}
					return;
				}
			}
			// 在第一行按下上键
			if (line === 0 && ch === 0) {
				if (isHotkey('up', event) || isHotkey('ctrl+p', event)) {
					// 按下上键
					if (onUpFocus) {
						onUpFocus(event);
					}
				} else if (
					// 按下左键
					isHotkey('left', event) ||
					isHotkey('shift+left', event) ||
					isHotkey('ctrl+b', event) ||
					isHotkey('ctrl+a', event)
				) {
					if (onLeftFocus) {
						onLeftFocus(event);
					}
				}
			}
		});

		CM.on('blur', () => {
			const { onBlur } = options;
			if (onBlur) {
				onBlur();
			}
		});
		// 手机端兼容
		if (isMobile) {
			CM.on('touchstart', (_, event) => {
				const { onMouseDown } = options;
				if (onMouseDown) {
					onMouseDown(event);
				}
			});
		} else {
			CM.on('mousedown', (_, event) => {
				const { onMouseDown } = options;
				if (event.button === 2) {
					event.stopPropagation();
				}
				if (onMouseDown) {
					onMouseDown(event);
				}
			});
		}

		CM.on(
			'change',
			debounce(() => {
				if (!isEngine(editor)) {
					return;
				}
				save();
			}, 50),
		);

		$('.mulit-code-block').on('mousedown', () => {
			if (!CM?.hasFocus()) {
				setTimeout(() => {
					CM.focus();
				}, 0);
			}
		});

		return () => {
			// eslint-disable-next-line react-hooks/exhaustive-deps
			ref.current && (ref.current.innerText = '');
		};
	}, []);

	return { ref, mirror };
}

interface IContentResize {
	ref: React.RefObject<HTMLPreElement>;
	mirror: React.RefObject<Editor>;
	onUpdateValue?: (val: Partial<MulitCodeblockValue>) => void;
}

export function useContentResize({
	ref,
	mirror,
	onUpdateValue,
}: IContentResize) {
	const dragRef = useRef({ isChose: false, Y: 0, H: 0 });

	const resizeMouseDown = (e: React.MouseEvent) => {
		e.preventDefault();
		if (ref.current) {
			dragRef.current = {
				isChose: true,
				Y: e.clientY,
				H: ref.current.offsetHeight,
			};
		}
	};
	const resizeMouseMove = (e: MouseEvent) => {
		if (dragRef.current.isChose && ref.current) {
			const { Y, H } = dragRef.current;
			const height = `${Math.max(H + e.y - Y, 40)}px`;
			ref.current.style.height = height;

			// 动态调整高度
			mirror.current && mirror.current.setSize('auto', height);
		}
	};

	const resizeMouseUp = () => {
		if (ref.current && dragRef.current.isChose) {
			dragRef.current = {
				isChose: false,
				Y: 0,
				H: ref.current?.offsetHeight,
			};

			onUpdateValue?.({
				height: `${ref.current?.offsetHeight}px`,
			});
		}
	};

	useEffect(() => {
		document.addEventListener('mouseup', resizeMouseUp);
		document.addEventListener('mousemove', resizeMouseMove);

		return () => {
			document.removeEventListener('mouseup', resizeMouseUp);
			document.removeEventListener('mousemove', resizeMouseMove);
		};
	}, []);

	return { resizeMouseDown, dragRef };
}
