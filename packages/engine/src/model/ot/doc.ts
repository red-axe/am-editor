import { EventEmitter2 } from 'eventemitter2';
import { Op } from 'sharedb';
import OTJSON from 'ot-json0';
import { EngineInterface } from '../../types/engine';
import { fromDOM } from './jsonml';
import { DocInterface } from '../../types/ot';

class Doc extends EventEmitter2 implements DocInterface {
  private engine: EngineInterface;
  mode: string = 'lock';
  version: number = 0;
  data: any | undefined;

  constructor(engine: EngineInterface) {
    super();
    this.engine = engine;
    this.create();
  }

  destroy() {
    delete this.data;
  }

  create() {
    this.data = fromDOM(this.engine.container);
  }

  apply(ops: Op[]) {
    if (ops.length) {
      try {
        this.data = OTJSON.type.apply(this.data, ops);
      } catch (error) {
        console.log(error);
      }
    }
  }

  submitOp(ops: Op[]) {
    this.apply(ops);
  }
}

export default Doc;
