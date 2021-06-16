import models from '../models';
import { store } from '../store';
import useSelector from './use-selector';

const { dispatch } = store;

const useDispatch = () => {
	const state = useSelector();

	const setLoading = (type: string, status: boolean) => {
		dispatch({
			type: 'loading',
			payload: {
				[type]: status,
			},
		});
	};

	return <T = void, P = any>(action: { type: string; payload?: P }) => {
		const { type, payload } = action;
		const [name, call] = type.split('/');
		const model = models[name];

		if (!model || !model.effets || !model.effets[call]) return;
		setLoading(type, true);
		return new Promise<T>((resolve, reject) => {
			models[name]
				.effets![call]<T>(payload, {
					state,
					put: (nextState) => {
						dispatch({ type: name, payload: nextState });
					},
				})
				.then((res) => {
					resolve(res);
					setLoading(type, false);
				})
				.catch((res) => {
					reject(res);
					setLoading(type, false);
				});
		});
	};
};

export default useDispatch;
