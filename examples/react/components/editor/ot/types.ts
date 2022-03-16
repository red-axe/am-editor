export type Member = {
	name: string;
	uuid: string;
	color: string;
	avatar?: string;
	index: number;
};

export type ERROR = {
	code: string;
	level: string;
	message: string;
	error?: ErrorEvent;
};
