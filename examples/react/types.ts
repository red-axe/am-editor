import { Path } from '@aomao/engine';
import { DataSourceItem } from './components/comment/types';

export type DocState = {
	value: string;
	paths: Array<{ id: Array<string>; path: Array<Path> }>;
};

export type CommentState = {
	dataSource: Array<DataSourceItem>;
};

export type State = {
	loading: { [key: string]: boolean };
	doc: DocState;
	comment: CommentState;
};

export type Model<T extends State[keyof State] = {}, P = any> = {
	state: T;
	effets?: {
		[fun: string]: <K extends any = void>(
			payload: P,
			store: { state: State; put: (nextState: T) => void },
		) => Promise<K>;
	};
};

export type Models = {
	[name: string]: Model;
};
