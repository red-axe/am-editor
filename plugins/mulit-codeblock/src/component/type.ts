import { CardValue, EditorInterface } from '@aomao/engine';
import { Editor } from 'codemirror';

export interface MulitLangItem {
	language: string;
	text: string;
}
export interface MulitCodeblockValue extends CardValue {
	langs: MulitLangItem[];
	language: string[];
	wrap: boolean;
	theme: string;
	height: string;
}

export type FillMulitLang = Partial<MulitLangItem>;

export interface MulitCodeblockOptions {
	languages?: string[];
	onSave?: (lang: string, value: FillMulitLang) => void;
	onUpdateValue?: (val: Partial<MulitCodeblockValue>) => void;
	onFocus?: () => void;
	onBlur?: () => void;
	onMouseDown?: (event: TouchEvent | MouseEvent) => void;
	onUpFocus?: (event: KeyboardEvent) => void;
	onDownFocus?: (event: KeyboardEvent) => void;
	onLeftFocus?: (event: KeyboardEvent) => void;
	onRightFocus?: (event: KeyboardEvent) => void;
}

export interface MulitCodeProps {
	value: MulitCodeblockValue;
	editor: EditorInterface;
	options: MulitCodeblockOptions;
	init: (cm: Editor) => void;
}
