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
	 * @param {boolean} options 是否重写事件
	 */
	on<R = any, F extends EventListener<R> = EventListener<R>>(
		eventType: string,
		listener: F,
		options?: boolean | AddEventListenerOptions,
	): void {
		if (!this.listeners[eventType]) {
			this.listeners[eventType] = [];
		}
		if (typeof options !== 'object' || !options.once)
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
	trigger<R = any>(eventType: string, ...args: any): R {
		const listeners = this.listeners[eventType];
		if (listeners) {
			let result: R = undefined as any;
			listeners.every((listener) => {
				result = listener(...args) as R;
				return typeof result !== 'boolean' || result !== false;
			});

			return result;
		}
		return undefined as any;
	}

	destroy() {
		Object.keys(this.listeners).forEach((type) => {
			this.listeners[type].forEach((listener) => {
				this.off(type, listener);
			});
		});
	}
}

export default Event;
