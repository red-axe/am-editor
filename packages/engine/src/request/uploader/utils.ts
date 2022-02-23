import filesize from 'filesize';
import { isWindows } from '../../utils';
import mime from './mime';

/**
 * 获取文件扩展名
 * @param file 文件 或 文件名
 * @returns
 */
export const getExtensionName = (file: File | string | Blob): string => {
	if (typeof file === 'string') {
		return file.split('.').pop() ?? '';
	}

	let ext: string = mime[file.type] ? mime[file.type][0] : '';
	if (!ext && 'name' in file) {
		ext = file.name.split('.').pop() ?? '';
	}
	return ext;
};

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
