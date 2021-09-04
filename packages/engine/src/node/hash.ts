import md5 from 'blueimp-md5';
import { isNode, isNodeEntry, NodeInterface } from '../types';
import $ from '../node/query';

const _counters: { [key: string]: number } = {};

export default (
	value: string | NodeInterface | Node,
	unique: boolean = true,
) => {
	let prefix = '';
	if (isNode(value)) value = $(value);
	if (isNodeEntry(value)) {
		const attributes = value.attributes();
		const styles = attributes['style'];
		delete attributes['style'];
		prefix = value.name.substring(0, 1);
		value = `${value.name}_${Object.keys(attributes || {}).join(
			',',
		)}_${Object.values(attributes || {}).join(',')}_${Object.keys(
			styles || {},
		).join(',')}_${Object.values(styles || {}).join(',')}`;
	}
	const md5Value = md5(value);
	let hash =
		prefix + md5Value.substr(0, 4) + md5Value.substr(md5Value.length - 4);
	if (unique) {
		const counter = _counters[hash] || 0;
		_counters[hash] = counter + 1;
		const time = new Date().getTime().toString();
		const text =
			time.substr(2) +
			md5(
				`${_counters[hash]}-${time.substr(6)}-${md5Value.substr(8, 4)}`,
			).substr(5, 10);
		hash = `${hash}-${text}`;
	}

	return hash;
};
