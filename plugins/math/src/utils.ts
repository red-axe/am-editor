import { EditorInterface } from '@aomao/engine';

export const getLocales = <T extends string | {} = string>(
	editor: EditorInterface,
) => {
	return editor.language.get<{ [key: string]: T }>('math');
};
