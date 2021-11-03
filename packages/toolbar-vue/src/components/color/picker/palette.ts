class Palette {
	static colors: Array<Array<string>>;
	static _map: { [k: string]: { x: number; y: number } };
	/**
	 * 获取描边颜色
	 * 默认为当前 color，浅色不明显区域：第 3 组、第 4 组的第 3、4 个用第 5 组的颜色描边
	 *
	 * @param {string} color 颜色
	 * @return {string} 描边颜色
	 */
	static getStroke: (color: string) => string;
	static getColors: () => Array<Array<string>>;
}

Palette.colors = [
	[
		'#000000',
		'#262626',
		'#595959',
		'#8C8C8C',
		'#BFBFBF',
		'#D9D9D9',
		'#E9E9E9',
		'#F5F5F5',
		'#FAFAFA',
		'#FFFFFF',
	],
	[
		'#F5222D',
		'#FA541C',
		'#FA8C16',
		'#FADB14',
		'#52C41A',
		'#13C2C2',
		'#1890FF',
		'#2F54EB',
		'#722ED1',
		'#EB2F96',
	],
	[
		'#FFE8E6',
		'#FFECE0',
		'#FFEFD1',
		'#FCFCCA',
		'#E4F7D2',
		'#D3F5F0',
		'#D4EEFC',
		'#DEE8FC',
		'#EFE1FA',
		'#FAE1EB',
	],
	[
		'#FFA39E',
		'#FFBB96',
		'#FFD591',
		'#FFFB8F',
		'#B7EB8F',
		'#87E8DE',
		'#91D5FF',
		'#ADC6FF',
		'#D3ADF7',
		'#FFADD2',
	],
	[
		'#FF4D4F',
		'#FF7A45',
		'#FFA940',
		'#FFEC3D',
		'#73D13D',
		'#36CFC9',
		'#40A9FF',
		'#597EF7',
		'#9254DE',
		'#F759AB',
	],
	[
		'#CF1322',
		'#D4380D',
		'#D46B08',
		'#D4B106',
		'#389E0D',
		'#08979C',
		'#096DD9',
		'#1D39C4',
		'#531DAB',
		'#C41D7F',
	],
	[
		'#820014',
		'#871400',
		'#873800',
		'#614700',
		'#135200',
		'#00474F',
		'#003A8C',
		'#061178',
		'#22075E',
		'#780650',
	],
];

Palette._map = (function () {
	let map: { [k: string]: { x: number; y: number } } = {};
	const colors = Palette.colors;
	for (let i = 0, l1 = colors.length; i < l1; i++) {
		const group = colors[i];
		for (let k = 0, l2 = group.length; k < l2; k++) {
			const color = colors[i][k];
			map[color] = {
				y: i,
				x: k,
			};
		}
	}
	return map;
})();

/**
 * 获取描边颜色
 * 默认为当前 color，浅色不明显区域：第 3 组、第 4 组的第 3、4 个用第 5 组的颜色描边
 *
 * @param {string} color 颜色
 * @return {string} 描边颜色
 */
Palette.getStroke = function (color: string): string {
	const pos = Palette._map[color];
	if (!pos) return color;

	if (pos.y === 2 || (pos.y === 3 && pos.x > 2 && pos.x < 5)) {
		return this.colors[4][pos.x];
	}

	return color;
};

Palette.getColors = function () {
	return this.colors;
};

export default Palette;
