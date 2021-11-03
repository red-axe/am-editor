import { EventEmitter2 } from 'eventemitter2';
import {
	diff_match_patch,
	DIFF_DELETE,
	patch_obj,
	DIFF_EQUAL,
	DIFF_INSERT,
} from 'diff-match-patch';
import {
	isCursorOp,
	isTransientAttribute,
	isTransientElement,
	filterOperations,
	updateIndex,
	opsSort,
} from './utils';
import { escapeDots, escape } from '../utils/string';
import { toJSON0, getValue } from './utils';
import { EngineInterface } from '../types/engine';
import { Op, Path, StringInsertOp, StringDeleteOp, Doc } from 'sharedb';
import { NodeInterface } from '../types/node';
import { DocInterface, RepairOp } from '../types/ot';
import { $ } from '../node';
import { DATA_ID, JSON0_INDEX, UI_SELECTOR } from '../constants';
import { getDocument } from '../utils/node';

class Producer extends EventEmitter2 {
	private engine: EngineInterface;
	private doc?: DocInterface | Doc;
	private dmp: diff_match_patch;
	private cacheNodes: Array<Node> = [];
	private cacheTransientElements?: Array<Node>;
	timer: NodeJS.Timeout | null = null;
	lineStart: boolean = false;

	constructor(
		engine: EngineInterface,
		options: { doc?: DocInterface | Doc },
	) {
		super();
		this.engine = engine;
		this.doc = options.doc;
		this.dmp = new diff_match_patch();
	}

	textToOps(path: Path, text1: string, text2: string) {
		const ops: Array<StringDeleteOp | StringInsertOp> = [];
		const patches = this.dmp.patch_make(text1, text2);
		Object.keys(patches).forEach((key) => {
			const patch: patch_obj = patches[key];
			let start1 = patch.start1;
			patch.diffs.forEach((diff) => {
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

	cacheNode(node: Node) {
		this.cacheNodes.push(node);
		node.childNodes.forEach((child) => {
			this.cacheNodes.push(child);
			this.cacheNode(child);
		});
	}

	clearCache() {
		this.cacheNodes = [];
	}

	inCache(node: Node) {
		return this.cacheNodes.find((n) => n === node);
	}

	isTransientMutation(
		record: MutationRecord,
		transientElements?: Array<Node>,
	) {
		const { addedNodes, removedNodes, target, type, attributeName } =
			record;
		const targetNode = $(target);
		if (type === 'childList') {
			const childs: Array<NodeInterface> = [];
			if (addedNodes[0]) {
				childs.push($(addedNodes[0]));
			}
			if (removedNodes[0]) {
				childs.push($(removedNodes[0]));
			}
			childs.push(targetNode);
			if (
				childs.some((child) =>
					isTransientElement(child, transientElements),
				)
			)
				return true;
		}
		return (
			(type === 'attributes' &&
				(isTransientAttribute(targetNode, attributeName || '') ||
					isTransientElement(targetNode, transientElements))) ||
			(type === 'characterData' &&
				isTransientElement(targetNode, transientElements))
		);
	}

	/**
	 * 从DOM变更记录中生产 ops
	 * @param records DOM变更记录集合
	 * @param path 路径
	 * @param oldPath
	 * @param node 开始遍历的节点，默认为编辑器根节点
	 * @returns
	 */
	generateOps(
		records: MutationRecord[],
		node: NodeInterface = this.engine.container,
	) {
		const addNodes: Array<Node> = [];
		const allOps: Array<Op & { id?: string; bi?: number }> = [];
		let ops: Array<RepairOp> = [];
		let attrOps: Array<any> = [];
		const cacheNodes: Array<Node> = [];
		// 文本数据变更标记
		let isValueString = false;
		const pathCaches: Map<NodeInterface, number[]> = new Map();
		const filter = (element: NodeInterface) => {
			//父节点就是编辑器根节点，就不需要过滤
			return element.parent()?.isRoot()
				? undefined
				: (node: Node) =>
						!isTransientElement(
							$(node),
							this.cacheTransientElements,
						);
		};

		const getPath = (root: NodeInterface) => {
			return root.isRoot() ? [] : root.getPath(node, filter(root));
		};

		const getIndex = (element: NodeInterface) => {
			return element.getIndex(filter(element));
		};
		// 循环记录集合
		for (let i = 0; records[i]; ) {
			const record = records[i];
			const { target, addedNodes, removedNodes, type } = record;
			// 当前节点在需要增加的节点记录集合中就跳过
			const inCache = this.inCache(target);

			const targetElement = $(target);
			if (
				inCache ||
				(!targetElement.inEditor() && !targetElement.isRoot())
			) {
				i++;
				continue;
			}
			// 最近的block节点
			const blockElement = targetElement.attributes(DATA_ID)
				? targetElement
				: this.engine.block.closest(targetElement);
			// 最近的block节点id
			const rootId = blockElement.attributes(DATA_ID);
			let path = pathCaches.get(targetElement);
			if (path === undefined) {
				path = getPath(targetElement).map(
					(index) => index + JSON0_INDEX.ELEMENT,
				);
				pathCaches.set(targetElement, path);
			}
			// block 节点在 path 中的开始位置
			let beginIndex = -1;
			if (!!rootId) {
				if (targetElement.equal(blockElement)) {
					beginIndex = path.length;
				} else {
					let path = pathCaches.get(blockElement);
					if (!path) {
						path = getPath(blockElement);
						pathCaches.set(blockElement, path);
					}
					beginIndex = path.length;
				}
			}

			const oldPath = path.slice();
			ops.forEach((op) => {
				for (
					let p = 0;
					p < path!.length && op.p.length < path!.length;
					p++
				) {
					if (('li' in op || 'ld' in op) && op.p.length === p + 1) {
						if (op.p[p] <= path![p]) {
							if ('li' in op) oldPath[p] = oldPath[p] - 1;
							else if ('ld' in op) oldPath[p] = oldPath[p] + 1;
						}
					}
				}
			});
			ops = [];
			attrOps = [];
			// 子节点变更
			if (type === 'childList') {
				// DOM中变更为移除
				if (removedNodes[0]) {
					// 循环要移除的节点
					Array.from(removedNodes).forEach((removedNode) => {
						// 要移除的节点同时又在增加的就不处理
						if (
							!addNodes.find((n) => n === removedNode) &&
							!cacheNodes.find((n) => n === removedNode)
						) {
							// 获取移除节点在编辑器中的索引
							const rIndex =
								removedNode['__index'] + JSON0_INDEX.ELEMENT;
							let p: Path = [];
							p = p.concat([...path!], [rIndex]);
							let op: Path = [];
							op = op.concat([...oldPath], [rIndex]);
							ops.push({
								id: rootId,
								bi: beginIndex,
								ld: true,
								p,
								newPath: p.slice(),
								oldPath: op,
							});
						}
					});
				}
				if (addedNodes[0]) {
					Array.from(addedNodes).forEach((addedNode) => {
						if (cacheNodes.includes(addedNode)) return;
						const domAddedNode = $(addedNode);
						const data = toJSON0(domAddedNode);
						if (addedNode.parentNode === target) {
							const index =
								getIndex(domAddedNode) + JSON0_INDEX.ELEMENT;
							let p: Path = [];
							p = p.concat([...path!], [index]);
							ops.push({
								id: rootId,
								bi: beginIndex,
								li: data,
								p,
								newPath: p.slice(),
							});
							cacheNodes.push(addedNode);
							this.cacheNode(addedNode);
						} else {
							addNodes.push(addedNode);
						}
					});
				}
			} else if (type === 'characterData') {
				if (!isValueString) {
					if (
						typeof getValue(this.doc?.data, oldPath) === 'string' &&
						(record['text-data'] || target['data']).length > 0
					) {
						attrOps.push({
							id: rootId,
							bi: beginIndex,
							path,
							oldPath,
							newValue: record['text-data'] || target['data'],
						});
						isValueString = true;
					}
				}
			} else if (type === 'attributes') {
				let { oldValue, attributeName } = record;
				let attrValue = attributeName
					? (target as Element).getAttribute(attributeName)
					: '';
				if (!oldValue) oldValue = '';
				attrValue = attrValue ? escape(attrValue) : '';
				if (oldValue !== attrValue) {
					const p: Path = [];
					const newOp: any = {
						id: rootId,
						bi: beginIndex,
					};
					newOp.p = p.concat(
						[...path],
						[1, escapeDots(attributeName || '')],
					);
					if (oldValue) newOp.od = oldValue;
					if (attrValue) newOp.oi = attrValue;

					attrOps.push(newOp);
				}
			}
			i++;
			ops.forEach((op) => {
				if ('ld' in op) {
					const pathValue = getValue(
						this.doc?.data,
						op.oldPath || [],
					);
					if (pathValue !== undefined) {
						const ldOp = {
							id: op.id,
							bi: beginIndex,
							ld: pathValue,
							p: op.p,
						};
						// 重复删除的过滤掉
						if (
							!allOps.find(
								(op) =>
									'ld' in op &&
									JSON.stringify(op) === JSON.stringify(ldOp),
							)
						)
							allOps.push(ldOp);
					}
				}
				if ('li' in op) {
					allOps.push({
						id: op.id,
						bi: beginIndex,
						li: op.li,
						p: op.p,
					});
				}
			});
			allOps.push(...attrOps);
		}

		return allOps;
	}

	/**
	 * 处理DOM节点变更记录
	 * @param records 记录集合
	 */
	handleMutations(records: MutationRecord[]) {
		//需要先过滤标记为非协同节点的变更，包括 data-element=ui、data-transient-element 等标记的节点，可以在 isTransientMutation 中查看逻辑
		//记录大于300的时候，先获取所有的不需要参与协同交互的节点，以提高效率
		if (records.length > 299) {
			this.cacheTransientElements = [];
			//非可编辑卡片的子节点
			const { card, container } = this.engine;
			card.each((card) => {
				if (!card.isEditable) {
					card.root.allChildren().forEach((child) => {
						if (child.type === getDocument().ELEMENT_NODE)
							this.cacheTransientElements?.push(child[0]);
					});
				}
			});
			//所有的UI子节点
			const uiElements = container.find(`${UI_SELECTOR}`);
			uiElements.each((_, index) => {
				const ui = uiElements.eq(index);
				ui?.allChildren().forEach((child) => {
					if (child.type === getDocument().ELEMENT_NODE)
						this.cacheTransientElements?.push(child[0]);
				});
			});
		}
		const targetElements: Node[] = [];
		records = records.filter((record) => {
			const isTransient = this.isTransientMutation(
				record,
				this.cacheTransientElements,
			);
			if (
				!isTransient &&
				!targetElements.includes(record.target) &&
				!targetElements.find((element) =>
					element.contains(record.target),
				)
			) {
				let index = -1;
				while (
					(index = targetElements.findIndex((element) =>
						record.target.contains(element),
					)) &&
					index > -1
				) {
					targetElements.splice(index, 1);
				}
				targetElements.push(record.target);
			}
			return !isTransient;
		});
		this.clearCache();
		let ops = this.generateOps(records);
		//重置缓存
		this.cacheTransientElements = undefined;
		ops = filterOperations(ops);
		if (!ops.every((op) => isCursorOp(op))) {
			targetElements.map((element) => {
				let node = $(element);
				if (node.isEditable() && !node.isRoot()) {
					node = this.engine.card.find(node, true)?.root || node;
				}
				updateIndex(
					node,
					(child) =>
						!isTransientElement(
							$(child),
							this.cacheTransientElements,
						),
				);
			});
		}
		if (ops.length !== 0) {
			this.emitOps(ops);
		}
	}

	emitOps(ops: ((RepairOp & { newValue?: string; path?: number[] }) | Op)[]) {
		let emitOps: Op[] = [];
		ops.forEach((op) => {
			if ('path' in op && op.newValue !== undefined) {
				const pathValue = getValue(this.doc?.data, op.oldPath || []);
				const newOps = this.textToOps(
					[...op.path!],
					pathValue,
					op.newValue,
				);
				newOps.forEach((nOp) => {
					nOp['id'] = op.id;
					nOp['bi'] = op.bi;
				});
				emitOps = emitOps.concat(newOps);
			} else if (op.p.length !== 0) {
				emitOps.push(op);
			}
		});
		if (emitOps.length !== 0) {
			opsSort(emitOps);
			this.emit('ops', emitOps);
		}
	}

	setDoc(doc: DocInterface | Doc) {
		this.doc = doc;
	}
}
export default Producer;
