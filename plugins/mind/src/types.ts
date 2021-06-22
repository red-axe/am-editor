export type NodeData = {
	editable?: boolean;
	value?: string;
	attributes?: { [key: string]: string };
	styles?: { [key: string]: string };
	classNames?: Array<string> | string;
	isPlaceholder?: boolean;
};
