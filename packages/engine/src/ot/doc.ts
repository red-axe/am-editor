import { EventEmitter2 } from 'eventemitter2';
import { Op } from 'sharedb';
import OTJSON from 'ot-json0';
import { EngineInterface } from '../types/engine';
import { toJSON0 } from './utils';
import { DocInterface } from '../types/ot';

class Doc<T = any> extends EventEmitter2 implements DocInterface {
	private engine?: EngineInterface;
	type = null;
	data: T | undefined = undefined;

	constructor(engine?: EngineInterface) {
		super();
		this.engine = engine;
		this.create();
	}

	create(data: any = this.engine ? toJSON0(this.engine.container) : []) {
		this.data = data;
	}

	apply(ops: Op[], callback?: (err?: any) => void) {
		if (ops.length > 0) {
			try {
				this.data = OTJSON.type.apply(this.data, ops);
				if (callback) callback(undefined);
			} catch (error: any) {
				if (callback) callback(error);
				else this.engine?.messageError('ot', error);
			}
		}
	}

	submitOp(ops: Op[], options?: any, callback?: (err?: any) => void) {
		this.apply(ops, callback);
	}

	destroy() {
		delete this.data;
	}
}

export default Doc;
