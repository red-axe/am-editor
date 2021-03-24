import { EventInterface, EventListener } from '../types/node';

/**
 * 事件
 */
class Event implements EventInterface {
	readonly listeners: { [x: string]: EventListener[] } = {};

	/**
	 * 绑定事件
	 * @param {string} eventType 事件名称
	 * @param {Function} listener 事件处理方法
	 * @param {boolean} rewrite 是否重写事件
	 */
	on(eventType: string, listener: EventListener, rewrite?: boolean): void {
		if (!this.listeners[eventType] || rewrite) {
			this.listeners[eventType] = [];
		}

		this.listeners[eventType].push(listener);
	}

	/**
	 * 解除绑定
	 * @param {string} eventType
	 * @param listener
	 */
	off(eventType: string, listener: EventListener) {
		const listeners = this.listeners[eventType];

		if (!listeners) {
			return;
		}

		for (let i = 0; i < listeners.length; i++) {
			if (listeners[i] === listener) {
				listeners.splice(i, 1);
				break;
			}
		}
	}

	/**
	 * 触发事件
	 * @param eventType 事件类型
	 * @param args 事件参数
	 */
	trigger(eventType: string, ...args: any): boolean | void {
		const listeners = this.listeners[eventType];
		if (listeners) {
			let result;

			for (var i = 0; i < listeners.length; i++) {
				result = listeners[i](...args);

				if (result === false) {
					break;
				}
			}

			return result;
		}
		return;
	}
}

export default Event;
