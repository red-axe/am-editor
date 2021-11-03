import { list, add, update, updateStatus, remove } from '../services/comment';
import { CommentState, Model } from '../types';

const comment: Model<CommentState> = {
	state: {
		dataSource: [],
	},
	effets: {
		fetch: async (_, { state, put }) => {
			const { code, data } = await list();
			if (code === 200) {
				put({
					...state.comment,
					dataSource: data,
				});
				return data;
			}
		},
		remove: async (payload) => {
			return await remove(payload);
		},
		updateStatus: async (payload) => {
			return await updateStatus(payload);
		},
		add: async (payload) => {
			return await add(payload);
		},
		update: async (payload) => {
			return await update(payload);
		},
	},
};
export default comment;
