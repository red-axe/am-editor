import { isWindows } from '@aomao/engine';
import filesize from 'filesize';

/**
 * 获取文件大小
 * @param size
 * @param base
 * @returns
 */
export const getFileSize = (
	size: number,
	base: number = isWindows ? 2 : 10,
) => {
	//1M以下
	if (size < 1048576) {
		return filesize(size, {
			base,
			exponent: 1,
			round: 0,
		});
	}

	return filesize(size, {
		base,
		exponent: 2,
		round: 1,
	});
};
