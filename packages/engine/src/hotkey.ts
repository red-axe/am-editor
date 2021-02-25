import isHotkey from 'is-hotkey';
import { EngineInterface } from './types/engine';
import { HotkeyInterface } from './types/hotkey';

class Hotkey implements HotkeyInterface {
	private engine: EngineInterface;
	private disabled: boolean = false;
	constructor(engine: EngineInterface) {
		this.engine = engine;
		engine.container.on('keydown', this.handleKeydown);
	}

	/**
	 * 处理按键按下事件
	 * @param e 事件
	 */
	handleKeydown = (e: KeyboardEvent) => {
		//禁用快捷键不处理
		if (this.disabled) {
			return;
		}
		//遍历插件
		Object.keys(this.engine.plugin.components).every(name => {
			const plugin = this.engine.plugin.components[name];
			//插件实现了热键方法
			if (plugin.hotkey) {
				const result = plugin.hotkey(e);
				let isCommand = false;
				let commandArgs: any = [];
				//返回热键字符串，并且匹配当前按下的键
				if (typeof result === 'string' && isHotkey(result, e)) {
					isCommand = true;
				}
				//返回多个热键
				else if (Array.isArray(result)) {
					//遍历热键
					result.some((item: { key: string; args: any } | string) => {
						if (typeof item === 'string') {
							if (isHotkey(item, e)) {
								isCommand = true;
								commandArgs = [];
								return true;
							}
						} else {
							const { key, args } = item;
							if (isHotkey(key, e)) {
								isCommand = true;
								commandArgs = Array.isArray(args)
									? args
									: [args];
								return true;
							}
						}
						return false;
					});
				}
				//返回类型是对象，带执行命令参数
				else if (
					typeof result === 'object' &&
					isHotkey(result.key, e)
				) {
					isCommand = true;
					//参数以数组传递
					commandArgs = Array.isArray(result.args)
						? result.args
						: [result.args];
				}
				//有匹配到热键，执行命令
				if (isCommand) {
					e.preventDefault();
					this.engine.command.execute(name, ...commandArgs);
					return false;
				}
			}
			return true;
		});
	};

	enable() {
		this.disabled = false;
	}

	disable() {
		this.disabled = true;
	}

	destroy() {
		this.engine.container.off('keydown', this.handleKeydown);
	}
}
export default Hotkey;
