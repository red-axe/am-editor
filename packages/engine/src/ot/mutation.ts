import { EventEmitter2 } from 'eventemitter2';
import { Doc, Op } from 'sharedb';
import { EngineInterface } from '../types/engine';
import { NodeInterface } from '../types/node';
import { DocInterface, MutationInterface } from '../types/ot';
import Creator from './creator';

const config = {
	childList: true,
	subtree: true,
	attributes: true,
	characterData: true,
	attributeOldValue: true,
	characterDataOldValue: true,
};

type Options = {
	engine: EngineInterface;
	doc?: DocInterface | Doc;
};

class Mutation extends EventEmitter2 implements MutationInterface {
	private node: NodeInterface;
	private engine: EngineInterface;
	private doc?: DocInterface | Doc;
	private isStopped: boolean;
	private observer: MutationObserver;
	private creator: Creator;

	constructor(node: NodeInterface, options: Options) {
		super();
		this.node = node;
		this.isStopped = true;
		this.engine = options.engine;
		this.doc = options.doc;
		this.creator = new Creator(this.engine, { doc: this.doc });
		this.observer = new MutationObserver(records => {
			if (!this.isStopped) {
				this.creator.handleMutations(records);
			}
		});
		this.creator.on('ops', ops => {
			this.onOpsReady(ops);
		});
	}

	setDoc(doc: DocInterface | Doc) {
		this.doc = doc;
		this.creator.setDoc(doc);
	}

	start() {
		if (this.isStopped) {
			this.observer.observe(this.node[0], config);
			this.isStopped = false;
		}
	}

	stop() {
		if (!this.isStopped) {
			this.observer.disconnect();
			this.isStopped = true;
		}
	}

	onOpsReady(ops: Op[]) {
		if (!this.isStopped) this.emit('ops', ops);
	}
}
export default Mutation;
