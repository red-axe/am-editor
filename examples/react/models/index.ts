import { Models } from '../types';
import { store } from '../store';
import doc from './doc';
import comment from './comment';

const models: Models = {
	doc,
	comment,
	loading: { state: {} },
};
Object.keys(models).forEach((type) => {
	store.dispatch({
		type,
		payload: models[type].state,
	});
});
export default models;
