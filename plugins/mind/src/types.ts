export type NodeData = {
	editable?: boolean;
	value?: string;
	attributes?: { [key: string]: string };
	styles?: { [key: string]: string };
	classNames?: Array<string> | string;
	isPlaceholder?: boolean;
	hierarchy?: number;
};

export type ShapeData = {
	id: string;
	x: number;
	y: number;
	width: number;
	height: number;
	data?: NodeData;
	children?: Array<ShapeData>;
};
