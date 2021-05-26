import md5 from 'blueimp-md5';

class HeadingId {
	private _counters: Map<string, number>;

	constructor() {
		this._counters = new Map();
	}

	id(value: string) {
		let hash;
		if (value.length <= 64 && /^[\w\.\-]+$/.test(value)) {
			hash = value;
		} else {
			hash = md5(value).substr(0, 8);
		}
		const counter = this._counters.get(hash) || 0;
		this._counters.set(hash, counter + 1);
		if (counter > 0) {
			hash = `${hash}-${counter}`;
		}
		return hash;
	}
}

export default HeadingId;
