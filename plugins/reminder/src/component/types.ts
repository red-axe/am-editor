import { CardValue } from '@aomao/engine';

export interface RemindValue extends CardValue {
	borderColor: string;
	backgroundColor: string;
	colorMatch: {
		border: string[];
		background: string[];
	};
	text: string;
	html?: string;
}

export interface IRemindProp {
	value: RemindValue;
}

interface IChangeParam {
	border: string;
	background: string;
}

export interface IThemeProp {
	value: RemindValue;
	onChange?: (val: IChangeParam) => void;
}
