import { State } from './types';

const createStore = <T>(
	reducer: (state: T, action: { type: string; payload: T[keyof T] }) => T,
) => {
	let state: T; //初始化state
	const listeners: Array<() => void> = []; //监听变化的回调函数队列
	const subscribe = (listener: () => void) => listeners.push(listener); // 定义并随后暴露添加绑定回调函数的方法
	const unsubscribe = (listener: () => void) => {
		const index = listeners.findIndex((s) => s === listener);
		if (index > -1) listeners.splice(index, 1);
	};
	const getState = () => state; // 定义并暴露获取读取 state 的唯一方法
	const dispatch = (action: { type: string; payload: T[keyof T] }) => {
		state = reducer(state, action); //根据action改变状态
		listeners.forEach((listener) => listener()); //把listeners都执行一次
	};
	return { subscribe, unsubscribe, getState, dispatch };
};

// 改变状态的规则函数
const reducer = <T>(
	state: T,
	action: { type: string; payload: T[keyof T] },
) => {
	const { type, payload } = action;
	return { ...state, [type]: { ...(state ? state[type] : {}), ...payload } };
};

export const store = createStore<State>(reducer);
