export const convertToPX = (value: string) => {
	const match = /([\d\.]+)(pt|px)$/i.exec(value);
	if (match && match[2] === 'pt') {
		return String(Math.round((parseInt(match[1], 10) * 96) / 72)) + 'px';
	}
	return value;
};
