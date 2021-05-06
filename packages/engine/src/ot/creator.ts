import { EventEmitter2 } from 'eventemitter2';
import { isEqual } from 'lodash-es';
import {
	diff_match_patch,
	DIFF_DELETE,
	patch_obj,
	DIFF_EQUAL,
	DIFF_INSERT,
} from 'diff-match-patch';
import {
	getOldIndex,
	isCursorOp,
	isTransientAttribute,
	isTransientElement,
	reduceOperations,
} from './utils';
import { escapeDots, escape } from '../utils/string';
import { fromDOM, getPathValue, pushAndRepair } from './jsonml';
import { EngineInterface } from '../types/engine';
import { Op, Path, StringInsertOp, StringDeleteOp, Doc } from 'sharedb';
import { NodeInterface } from '../types/node';
import { DocInterface, RepairOp } from '../types/ot';

class Creator extends EventEmitter2 {
	private engine: EngineInterface;
	private doc?: DocInterface | Doc;
	private dmp: diff_match_patch;
	private addedNodes: Array<Node> = [];
	timer: NodeJS.Timeout | null = null;
	lineStart: boolean = false;
	laterOps: Op[] | null = null;

	constructor(
		engine: EngineInterface,
		options: { doc?: DocInterface | Doc },
	) {
		super();
		this.engine = engine;
		this.doc = options.doc;
		this.dmp = new diff_match_patch();
	}

	patchesToOps(path: Path, text1: string, text2: string) {
		const ops: Array<StringDeleteOp | StringInsertOp> = [];
		const patches = this.dmp.patch_make(text1, text2);
		Object.keys(patches).forEach(key => {
			const patch: patch_obj = patches[key];
			let start1 = patch.start1;
			patch.diffs.forEach(diff => {
				const [type, data] = diff;
				if (type !== DIFF_DELETE) {
					if (type !== DIFF_INSERT) {
						if (type === DIFF_EQUAL) {
							(start1 as number) += data.length;
						}
					} else {
						const p: Path = [];

						ops.push({
							si: data,
							p: p.concat([...path], [start1 as number]),
						});
					}
				} else {
					const p: Path = [];
					ops.push({
						sd: data,
						p: p.concat([...path], [start1 as number]),
					});
				}
			});
		});
		return ops;
	}

	cacheAddedNode(node: Node) {
		this.addedNodes.push(node);
	}

	clearAddedNodeCache() {
		this.addedNodes = [];
	}

	inAddedCache(node: Node) {
		return this.addedNodes.find(
			n => this.engine.$(node).inside(n) || n === node,
		);
	}

	isTransientMutation(record: MutationRecord) {
		const { $ } = this.engine;
		const {
			addedNodes,
			removedNodes,
			target,
			type,
			attributeName,
		} = record;
		if (type === 'childList') {
			if (addedNodes[0] && isTransientElement($(addedNodes[0])))
				return true;
			if (removedNodes[0] && isTransientElement($(removedNodes[0])))
				return true;
			if (isTransientElement($(target))) return true;
		}
		return (
			!(
				type !== 'attributes' ||
				(!isTransientElement($(target)) &&
					!isTransientAttribute($(target), attributeName || ''))
			) || !(type !== 'characterData' || !isTransientElement($(target)))
		);
	}

	makeOpsFromMutations(
		records: MutationRecord[],
		path: Path = [],
		oldPath: Path = [],
		node: NodeInterface = this.engine.container,
	) {
		const addNodes: Array<Node> = [];
		const ops: Array<RepairOp> = [];
		const attrOps: Array<any> = [];
		const cacheNodes: Array<Node> = [];
		const mutationsNodes: Array<Node> = [];

		let isDataString = false;
		const { $ } = this.engine;
		const setNodeMutations = (root: Node, record: MutationRecord) => {
			if (!cacheNodes.includes(root)) {
				if (!mutationsNodes.includes(root)) mutationsNodes.push(root);
				root['mutations'] = root['mutations'] || [];
				root['mutations'].push(record);
			}
		};
		for (let i = 0; records[i]; ) {
			const record = records[i];
			const { target, addedNodes, removedNodes, type } = record;
			if (this.inAddedCache(target)) {
				i++;
				continue;
			}
			if (type === 'childList') {
				if (node.equal(target)) {
					if (removedNodes[0]) {
						const removeIndex = this.getRemoveNodeIndex(
							record,
							records,
						);
						Array.from(removedNodes).forEach(removedNode => {
							if (!addNodes.find(n => n === removedNode)) {
								let p: Path = [];
								p = p.concat([...path], [removeIndex + 2]);
								let op: Path = [];
								op = op.concat([...oldPath], [removeIndex + 2]);
								pushAndRepair(ops, {
									ld: true,
									p,
									newPath: p.slice(),
									oldPath: op,
								});
							}
						});
					}
					if (addedNodes[0]) {
						Array.from(addedNodes).forEach(addedNode => {
							const domAddedNode = $(addedNode);
							const data = fromDOM(domAddedNode);
							if (addedNode.parentNode === node.get()) {
								let p: Path = [];
								p = p.concat(
									[...path],
									[
										domAddedNode.getIndex(
											node =>
												!isTransientElement($(node)),
										) + 2,
									],
								);
								pushAndRepair(ops, {
									li: data,
									p,
									newPath: p.slice(),
								});
								cacheNodes.push(addedNode);
								this.cacheAddedNode(addedNode);
							} else if (addedNode.parentNode !== null) {
								const parent = $(addedNode).findParent(node);
								if (parent && parent.length > 0)
									setNodeMutations(parent.get()!, record);
								addNodes.push(addedNode);
							} else {
								addNodes.push(addedNode);
							}
						});
					}
				} else {
					const parent = $(target).findParent(node);
					if (parent && parent.length > 0)
						setNodeMutations(parent.get()!, record);
				}
			} else if (type === 'characterData') {
				if (node.equal(target)) {
					if (!isDataString) {
						if (
							typeof getPathValue(this.doc?.data, path) ===
							'string'
						) {
							attrOps.push({
								path,
								newValue: target['data'],
							});
							isDataString = true;
						}
					}
				} else {
					const parent = $(target).findParent(node);
					if (parent && parent.length > 0)
						setNodeMutations(parent.get()!, record);
				}
			} else if (type === 'attributes') {
				if (node.equal(target)) {
					const { oldValue, attributeName } = record;
					let attrValue = attributeName
						? (target as Element).getAttribute(attributeName)
						: '';
					attrValue = attrValue ? escape(attrValue) : '';
					if (oldValue !== attrValue) {
						const p: Path = [];
						const newOp: any = {};
						newOp.p = p.concat(
							[...path],
							[1, escapeDots(attributeName || '')],
						);
						if (oldValue) newOp.od = oldValue;
						if (attrValue) newOp.oi = attrValue;

						attrOps.push(newOp);
					}
				} else {
					const parent = $(target).findParent(node);
					if (parent && parent.length > 0)
						setNodeMutations(parent.get()!, record);
				}
			}
			i++;
		}
		let allOps: Array<Op> = [];
		ops.forEach(op => {
			if ('ld' in op) {
				const pathValue = getPathValue(
					this.doc?.data,
					op.oldPath || [],
				);
				if (pathValue !== undefined) {
					allOps.push({
						ld: pathValue,
						p: op.p,
					});
				}
			}
			if ('li' in op) {
				allOps.push({
					li: op.li,
					p: op.p,
				});
			}
		});
		allOps = allOps.concat(attrOps);
		mutationsNodes.forEach(node => {
			const mutations = node['mutations'];
			delete node['mutations'];
			if (node !== null) {
				const index = $(node).getIndex(
					node => !isTransientElement($(node)),
				);
				const oldIndex = getOldIndex(index, ops);
				const p: Path = [];
				allOps = allOps.concat(
					this.makeOpsFromMutations(
						mutations,
						p.concat(...path, [index + 2]),
						p.concat([...oldPath], [oldIndex + 2]),
						$(node),
					),
				);
			}
		});
		return allOps;
	}

	getRemoveNodeIndex(
		record: MutationRecord,
		records: MutationRecord[],
	): number {
		const { target, nextSibling, previousSibling, addedNodes } = record;
		const childNodes = Array.from(target.childNodes).filter(
			node => !isTransientElement(this.engine.$(node)),
		);
		const addedIndex = childNodes.indexOf(addedNodes[0] as ChildNode);
		const prevIndex = childNodes.indexOf(previousSibling as ChildNode);
		const nextIndex = childNodes.indexOf(nextSibling as ChildNode);
		let index;
		if (prevIndex !== -1) {
			index = prevIndex + 1;
		} else if (nextIndex !== -1) {
			index = nextIndex;
		} else if (addedIndex !== -1) {
			index = addedIndex;
		} else if (previousSibling) {
			if (nextSibling) {
				if (previousSibling) {
					index = this.getRemoveNodeIndexFromMutation(
						previousSibling,
						target,
						records,
					);
				}
			} else {
				index = target.childNodes.length;
			}
		} else index = 0;
		return index !== undefined ? index : 0;
	}

	getRemoveNodeIndexFromMutation(
		node: Node,
		target: Node,
		records: MutationRecord[],
	) {
		const record = records.find(
			record =>
				record.target === target && record.removedNodes[0] === node,
		);
		if (record) {
			return this.getRemoveNodeIndex(record, records);
		}
		return 0;
	}

	handleMutations(records: MutationRecord[]) {
		records = records.filter(record => !this.isTransientMutation(record));
		this.clearAddedNodeCache();
		let ops = this.makeOpsFromMutations(records);
		ops = reduceOperations(ops);
		if (ops.length !== 0) {
			this.normalizeOps(ops);
		}
	}

	normalizeOps(ops: Op[]) {
		if (this.engine.change.isComposing()) {
			if (
				ops.length === 2 &&
				'ld' in ops[1] &&
				ops[1].ld[0] &&
				'li' in ops[0] &&
				typeof ops[0].li === 'string'
			) {
				this.lineStart = true;
				ops[0].li = '';
				this.readyToEmitOps(ops);
				return;
			}
			if (ops.length === 1 && isCursorOp(ops[0])) return;
			if (ops.length === 2 && 'si' in ops[0] && isEqual(ops[0], ops[1]))
				ops.splice(1, 1);
			this.laterOps = ops;
			if (this.timer) clearTimeout(this.timer);
			this.timer = setTimeout(() => {
				if (!this.engine.change.isComposing()) {
					if (this.lineStart) {
						this.engine.history.hold();
						this.lineStart = false;
					}
					if (this.laterOps) {
						this.readyToEmitOps(this.laterOps);
						this.laterOps = null;
					}
					this.timer = null;
				}
			}, 0);
		}
		if (this.laterOps) {
			const equal = isEqual(this.laterOps, ops);
			this.readyToEmitOps(this.laterOps);
			this.laterOps = null;
			if (equal) return;
		}
		this.readyToEmitOps(ops);
	}

	setDoc(doc: DocInterface | Doc) {
		this.doc = doc;
	}

	readyToEmitOps(ops: any[]) {
		let emitOps: Op[] = [];
		ops.forEach(op => {
			if ('path' in op && op.newValue !== undefined) {
				const pathValue = getPathValue(this.doc?.data, op.path);
				emitOps = emitOps.concat(
					this.patchesToOps([...op.path], pathValue, op.newValue),
				);
			} else if (op.p.length !== 0) {
				emitOps.push(op);
			}
		});
		if (emitOps.length !== 0) this.emit('ops', emitOps);
	}
}
export default Creator;
