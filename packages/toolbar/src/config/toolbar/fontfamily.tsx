import React from 'react';
import { DropdownListItem } from '../../dropdown/list';
import { checkSupportFontFamily } from '../../utils';

export const defaultData = [
	{
		key: 'default',
		value: '',
	},
	{
		key: 'arial',
		value: 'Arial',
	},
	{
		key: 'comicSansMS',
		value: '"Comic Sans MS"',
	},
	{
		key: 'courierNew',
		value: '"Courier New"',
	},
	{
		key: 'georgia',
		value: 'Georgia',
	},
	{
		key: 'helvetica',
		value: 'Helvetica',
	},
	{
		key: 'impact',
		value: 'Impact',
	},
	{
		key: 'timesNewRoman',
		value: '"Times New Roman"',
	},
	{
		key: 'trebuchetMS',
		value: '"Trebuchet MS"',
	},
	{
		key: 'verdana',
		value: 'Verdana',
	},
	{
		key: 'fangSong',
		value: 'FangSong, 仿宋, FZFangSong-Z02S, STFangsong, fangsong',
	},
	{
		key: 'stFangsong',
		value: 'STFangsong, 华文仿宋, FangSong, FZFangSong-Z02S, fangsong',
	},
	{
		key: 'stSong',
		value: 'STSong, 华文宋体, SimSun, "Songti SC", NSimSun, serif',
	},
	{
		key: 'stKaiti',
		value: 'STKaiti, 华文楷体, KaiTi, "Kaiti SC", cursive',
	},
	{
		key: 'simSun',
		value: 'SimSun, 宋体, "Songti SC", NSimSun, STSong, serif',
	},
	{
		key: 'microsoftYaHei',
		value: '"Microsoft YaHei", 微软雅黑, "PingFang SC", SimHei, STHeiti, sans-serif',
	},
	{
		key: 'kaiTi',
		value: 'KaiTi, 楷体, STKaiti, "Kaiti SC", cursive',
	},
	{
		key: 'kaitiSC',
		value: '"Kaiti SC"',
	},
	{
		key: 'simHei',
		value: 'SimHei, 黑体, "Microsoft YaHei", "PingFang SC", STHeiti, sans-serif',
	},
	{
		key: 'heitiSC',
		value: '"Heiti SC"',
	},
	{
		key: 'fzHei',
		value: 'FZHei-B01S',
	},
	{
		key: 'fzKai',
		value: 'FZKai-Z03S',
	},
	{
		key: 'fzFangSong',
		value: 'FZFangSong-Z02S',
	},
];
/**
 * 生成字体下拉列表项
 * @param data key-value 键值对数据，key 名称，如果有传语言则是语言键值对的key否则就直接显示
 * @param language 语言，可选
 */
export default (
	data: Array<{ key: string; value: string }>,
	language?: { [key: string]: string },
): Array<DropdownListItem> => {
	return checkSupportFontFamily((check) => {
		return data.map(({ key, value }) => {
			const disabled =
				key !== 'default'
					? !value.split(',').some((v) => check(v.trim()))
					: false;
			return {
				key: value,
				faimlyName: language ? language[key] : key,
				content: () => (
					<span style={{ fontFamily: value }}>
						{language ? language[key] : key}
					</span>
				),
				hotkey: false,
				disabled,
				title: disabled
					? (language && language['notInstalled']) ||
					  'The font may not be installed'
					: undefined,
			};
		});
	});
};
