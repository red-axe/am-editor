import { EventEmitter2 } from 'eventemitter2';
import { Op } from 'sharedb';
import OTJSON from 'ot-json0';
import { EngineInterface } from '../types/engine';
import { toJSON0 } from './utils';
import { DocInterface } from '../types/ot';

class Doc<T = any> extends EventEmitter2 implements DocInterface {
	private engine: EngineInterface;
	type = null;
	data: T | undefined = undefined;

	constructor(engine: EngineInterface) {
		super();
		this.engine = engine;
		this.create();
	}

	create() {
		this.data = toJSON0(this.engine.container) as any;
	}

	apply(ops: Op[]) {
		if (ops.length) {
			try {
				this.data = OTJSON.type.apply(this.data, ops);
			} catch (error) {
				console.error(error);
			}
		}
	}

	submitOp(ops: Op[]) {
		this.apply(ops);
	}

	destroy() {
		delete this.data;
	}
}

export default Doc;
