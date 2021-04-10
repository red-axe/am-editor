import mime from './mime';

/**
 * 获取文件扩展名
 * @param file 文件 或 文件名
 * @returns
 */
export const getExtensionName = (file: File | string | Blob) => {
	if (typeof file === 'string') {
		return file.split('.').pop();
	}

	let ext = mime[file.type] && mime[file.type][0];
	if (!ext && file['name']) {
		ext = file['name'].split('.').pop();
	}
	return ext;
};
