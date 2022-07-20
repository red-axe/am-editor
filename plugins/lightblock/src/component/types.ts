import { CardValue } from '@aomao/engine';

export interface LightblockValue extends CardValue {
	borderColor: string;
	backgroundColor: string;
	text: string;
	html?: string;
}

export interface ILightblockProp {
	value: LightblockValue;
}

interface IChangeParam {
	border: string;
	background: string;
}

export interface IThemeProp {
	language: { [key: string]: string };
	value: LightblockValue;
	onChange?: (val: IChangeParam) => void;
}
