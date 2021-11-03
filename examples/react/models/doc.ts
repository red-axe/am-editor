import { get, update } from '../services/doc';
import { DocState, Model } from '../types';

const doc: Model<DocState> = {
	state: {
		value: '',
		paths: [],
	},
	effets: {
		get: async (_, { put }) => {
			const { code, data } = await get();
			if (code === 200) {
				if (!!!data.value) data.value = '<p><br /></p>';
				put(data);
				return data;
			}
		},
		save: async (payload, { put }) => {
			const { code, data } = await update(payload);
			if (code === 200) {
				put(data);
			}
			return data;
		},
	},
};
export default doc;
