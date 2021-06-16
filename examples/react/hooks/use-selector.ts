import { useState, useEffect } from 'react';
import { store } from '../store';
import { State } from '../types';

const useSelector = <T extends any = State>(
	filter: (state: State) => T = (state) => state as T,
): T => {
	const [state, setState] = useState<T>(filter(store.getState()));
	useEffect(() => {
		const update = () => {
			setState(filter(store.getState()));
		};
		store.subscribe(update);
		return () => {
			store.unsubscribe(update);
		};
	}, []);

	return state;
};

export default useSelector;
