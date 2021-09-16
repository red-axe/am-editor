import { EventEmitter2 } from 'eventemitter2';
import { Op } from 'sharedb';
import OTJSON from 'ot-json0';
import { EngineInterface } from '../types/engine';
import { fromDOM } from './jsonml';
import { DocInterface } from '../types/ot';

class Doc<T = any> extends EventEmitter2 implements DocInterface {
	private engine: EngineInterface;
	type = null;
	mode: string = 'lock';
	version: number = 0;
	data: T | undefined = undefined;

	constructor(engine: EngineInterface) {
		super();
		this.engine = engine;
		this.create();
	}

	destroy() {
		delete this.data;
	}

	create() {
		this.data = fromDOM(this.engine.container) as any;
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
}

export default Doc;
