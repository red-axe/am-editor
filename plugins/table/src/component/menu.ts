import { TableMenu } from '../types';

export default (locale: { [key: string]: string }): TableMenu => {
	return [
		{
			action: 'cut',
			icon: 'cut',
			text: locale.cut,
		},
		{
			action: 'copy',
			icon: 'copy',
			text: locale.copy,
		},
		{
			action: 'mockPaste',
			icon: 'paste',
			text: locale.paste,
		},
		{
			split: true,
		},
		{
			action: 'insertColLeft',
			icon: 'insert-col-left',
			text: locale.insertColLeft,
		},
		{
			action: 'insertColRight',
			icon: 'insert-col-right',
			text: locale.insertColRight,
		},
		{
			action: 'insertRowUp',
			icon: 'insert-row-up',
			text: locale.insertRowUp,
		},
		{
			action: 'insertRowDown',
			icon: 'insert-row-down',
			text: locale.insertRowDown,
		},
		{
			split: true,
		},
		{
			action: 'mergeCell',
			icon: 'merge-cell',
			text: locale.mergeCell,
		},
		{
			action: 'splitCell',
			icon: 'split-cell',
			text: locale.splitCell,
		},
		{
			split: true,
		},
		{
			action: 'removeCol',
			icon: 'remove-col',
			text: locale.removeCol,
		},
		{
			action: 'removeRow',
			icon: 'remove-row',
			text: locale.removeRow,
		},
		{
			split: true,
		},
		{
			action: 'removeTable',
			icon: 'remove-table',
			text: locale.removeTable,
		},
		{
			split: true,
		},
		{
			action: 'clear',
			icon: 'clear',
			text: locale.clear,
		},
	];
};
