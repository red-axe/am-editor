import { CardValue } from '@aomao/engine';

export interface RemindValue extends CardValue {
	borderColor: string;
	backgroundColor: string;
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
	language: { [key: string]: string };
	value: RemindValue;
	onChange?: (val: IChangeParam) => void;
}
