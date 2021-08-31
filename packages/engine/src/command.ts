import { ChangeInterface } from './types';
import { CommandInterface } from './types/command';
import { EditorInterface, isEngine } from './types/engine';

class Command implements CommandInterface {
	private editor: EditorInterface;
	constructor(editor: EditorInterface) {
		this.editor = editor;
	}

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
		if (this.editor.card.active && !this.editor.card.active.isEditable)
			return false;
		// TODO:查询当前所处位置的插件
		return true;
	}

	queryState(name: string, ...args: any) {
		const plugin = this.editor.plugin.components[name];
		if (plugin && plugin.queryState) {
			try {
				return plugin.queryState(args);
			} catch (error) {
				console.log(error);
			}
		}
	}

	execute(name: string, ...args: any) {
		const plugin = this.editor.plugin.components[name];
		if (plugin && plugin.execute) {
			let change: ChangeInterface | undefined;
			if (isEngine(this.editor)) {
				change = this.editor.change;
				const range = change.getRange();
				if (!range.commonAncestorNode.inEditor()) change.focus();
				change.cacheRangeBeforeCommand();
			}
			this.editor.trigger('beforeCommandExecute', name, ...args);
			try {
				const result = plugin.execute(...args);
				change?.combinTextNode();
				change?.onSelect();
				this.editor.trigger('afterCommandExecute', name, ...args);
				return result;
			} catch (error) {
				console.log(error);
			}
		}
	}

	executeMethod(name: string, method: string, ...args: any) {
		const plugin = this.editor.plugin.components[name];
		if (plugin && plugin[method]) {
			try {
				return plugin[method](...args);
			} catch (error) {
				console.log(error);
			}
		}
	}
}

export default Command;
