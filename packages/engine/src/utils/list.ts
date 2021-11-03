/**
 * 获取列表样式
 * @param type 类型
 * @param code
 */
export const getListStyle = (
	type?:
		| 'disc'
		| 'circle'
		| 'square'
		| 'lower-alpha'
		| 'lower-roman'
		| 'decimal'
		| string,
	code: string | number = 0,
) => {
	if (!(code = +code)) return '•';
	switch (type?.toLowerCase()) {
		case 'disc':
			return '•';
		case 'circle':
			return '◦';
		case 'square':
			return '◼';
		case 'lower-alpha':
			return String.fromCharCode('a'.charCodeAt(0) + code);
		case 'lower-roman':
			return String.fromCharCode(8559 + code);
		case 'decimal':
		default:
			return code;
	}
};
