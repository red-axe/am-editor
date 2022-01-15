import { TRIGGER_CARD_ID, UI_SELECTOR } from './constants';
import { isMarkPlugin } from './plugin';
import {
	ChangeInterface,
	EditorInterface,
	CommandInterface,
	CardInterface,
} from './types';
import { isEngine } from './utils';

/**
 * 引擎命令管理器
 */
class Command implements CommandInterface {
	private editor: EditorInterface;
	constructor(editor: EditorInterface) {
		this.editor = editor;
	}

	/**
	 * 查询插件是否启用
	 * @param name 插件名称
	 * @returns
	 */
	queryEnabled(name: string) {
		// 没有插件
		const plugin = this.editor.plugin.components[name];
		if (!plugin || plugin.disabled) return false;
		// 只读状态下，如果插件没有指定为非禁用，一律禁用
		if (
			(!isEngine(this.editor) ||
				this.editor.readonly ||
				!this.editor.isFocus()) &&
			plugin.disabled !== false
		)
			return false;
		// 当前激活非可编辑卡片时全部禁用
		if (this.editor.card.active) {
			if (
				(isMarkPlugin(plugin) || plugin.kind === 'plugin') &&
				this.editor.card.active.executeMark
			)
				return true;
			if (this.editor.card.active.isEditable) return true;
			return false;
		}
		// TODO:查询当前所处位置的插件
		return true;
	}

	/**
	 * 查询插件状态
	 * @param name 插件名称
	 * @param args 插件 queryState 返回需要的参数
	 * @returns
	 */
	queryState(name: string, ...args: any) {
		const plugin = this.editor.plugin.components[name];
		if (plugin && plugin.queryState) {
			try {
				return plugin.queryState(args);
			} catch (error) {
				console.error(error);
			}
		}
	}

	/**
	 * 执行命令前缓存当前光标位置并且光标不在编辑范围内就focus到编辑区域内
	 * @returns
	 */
	handleExecuteBefore() {
		let change: ChangeInterface | undefined;
		if (isEngine(this.editor)) {
			change = this.editor.change;
			const range = change.range.get();
			if (
				!range.commonAncestorNode.isRoot() &&
				!range.commonAncestorNode.inEditor()
			) {
				const uiElement = range.commonAncestorNode.closest(UI_SELECTOR);
				let component: CardInterface | undefined = undefined;
				if (uiElement.length > 0) {
					const cardId = uiElement.attributes(TRIGGER_CARD_ID);
					if (cardId) {
						const { card } = this.editor;
						component = card.find(cardId);
						if (component) {
							card.select(component);
						}
					}
				}
				if (!component) this.editor.focus();
			}
			change.cacheRangeBeforeCommand();
		}
		return change;
	}

	/**
	 * 执行插件命令
	 * @param name 插件名称
	 * @param args 插件所需要的参数
	 * @returns
	 */
	execute(name: string, ...args: any) {
		const plugin = this.editor.plugin.components[name];
		if (plugin && plugin.execute) {
			const change = this.handleExecuteBefore();
			this.editor.trigger('beforeCommandExecute', name, ...args);
			try {
				const result = plugin.execute(...args);
				change?.combinText();
				change?.onSelect();
				this.editor.trigger('afterCommandExecute', name, ...args);
				return result;
			} catch (error) {
				console.error(error);
			}
		}
	}

	/**
	 * 执行插件里面的一个返回
	 * @param name 插件名称
	 * @param method 插件中的方法名称
	 * @param args 插件中方法所需要的参数
	 * @returns
	 */
	executeMethod(name: string, method: string, ...args: any) {
		const plugin = this.editor.plugin.components[name];
		if (plugin && plugin[method]) {
			try {
				const change = isEngine(this.editor)
					? this.editor.change
					: null;
				const result = plugin[method](...args);
				change?.combinText();
				return result;
			} catch (error) {
				console.log(error);
			}
		}
	}
}

export default Command;
