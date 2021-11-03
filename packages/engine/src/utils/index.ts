import { EditorInterface, EngineInterface } from '../types';
import TinyCanvas from './tiny-canvas';
export * from './string';
export * from './user-agent';
export * from './list';
export * from './node';
export { TinyCanvas };

/**
 * 是否是引擎
 * @param editor 编辑器
 */
export const isEngine = (
	editor: EditorInterface,
): editor is EngineInterface => {
	return editor.kind === 'engine';
};
