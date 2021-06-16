export type DataSourceItem = {
	id: string;
	title: string;
	status?: boolean;
	children: Array<CommentContent>;
};

export type CommentContent = {
	id: number;
	username: string;
	content: string;
	createdAt: number;
};

export type DataItem = DataSourceItem & {
	top: number;
	type: 'view' | 'edit' | 'add';
};
