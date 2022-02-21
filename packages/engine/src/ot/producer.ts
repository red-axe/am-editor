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
import { escapeDots, escape, decodeCardValue } from '../utils/string';
import { toJSON0, getValue } from './utils';
import { EngineInterface } from '../types/engine';
import { Op, Path, StringInsertOp, StringDeleteOp, Doc } from 'sharedb';
import { NodeInterface } from '../types/node';
import { DocInterface, RepairOp } from '../types/ot';
import { $ } from '../node';
import {
	CARD_CENTER_SELECTOR,
	CARD_KEY,
	CARD_LOADING_KEY,
	CARD_SELECTOR,
	CARD_VALUE_KEY,
	DATA_ELEMENT,
	DATA_ID,
	DATA_TRANSIENT_ELEMENT,
	JSON0_INDEX,
	ROOT,
	UI,
	UI_SELECTOR,
} from '../constants';
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
		loadingCards?: NodeInterface[],
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
					isTransientElement(child, transientElements, loadingCards),
				)
			)
				return true;
		}
		return (
			(type === 'attributes' &&
				(isTransientElement(
					targetNode,
					transientElements,
					loadingCards,
				) ||
					isTransientAttribute(targetNode, attributeName || ''))) ||
			(type === 'characterData' &&
				isTransientElement(targetNode, transientElements, loadingCards))
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
	): Array<Op> {
		const addNodes: Array<Node> = [];
		const allOps: Array<
			Op & {
				id?: string;
				bi?: number;
				addNode?: NodeInterface;
				childIds?: string[];
				oldPath?: Path;
			}
		> = [];
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
						if (
							op.p[p] < path![p] ||
							(op.p[p] === path![p] &&
								op.p.length === path!.length)
						) {
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

							const _index =
								removedNode['__index'] !== undefined
									? removedNode['__index']
									: this.getRemoveNodeIndex(record, records);
							const rIndex = _index + JSON0_INDEX.ELEMENT;
							// 删除的情况下，目标节点也应该获取 __index ，不然在还有新增的情况会导致path不正确
							const newPath = path?.concat();
							if (newPath && newPath.length > 0) {
								newPath.pop();
								newPath.push(
									target['__index'] + JSON0_INDEX.ELEMENT,
								);
							}
							const newOldPath = oldPath?.concat();
							if (newOldPath.length > 0) {
								newOldPath.pop();
								newOldPath.push(
									target['__index'] + JSON0_INDEX.ELEMENT,
								);
							}

							let p: Path = [];
							p = p.concat([...newPath!], [rIndex]);
							let op: Path = [];
							op = op.concat([...newOldPath], [rIndex]);
							let childIds: string[] = [];
							if (removedNode.nodeType === Node.ELEMENT_NODE) {
								$(removedNode)
									.allChildren()
									.forEach((child) => {
										const dataId = child.isElement()
											? child.attributes(DATA_ID)
											: undefined;
										if (dataId) childIds.push(dataId);
									});
							}
							const newOp = {
								id: rootId,
								bi: beginIndex,
								ld: true,
								childIds,
								p,
								newPath: p.slice(),
								oldPath: op,
							};
							if (record['nl']) {
								newOp['nl'] = true;
							}
							ops.push(newOp);
						}
					});
				}
				if (addedNodes[0]) {
					Array.from(addedNodes).forEach((addedNode) => {
						if (cacheNodes.includes(addedNode)) return;
						const domAddedNode = $(addedNode);
						const data = toJSON0(domAddedNode);
						if (addedNode.parentNode === target) {
							domAddedNode.traverse((child) => {
								const liIndex = allOps.findIndex(
									(op) =>
										'li' in op &&
										op.addNode &&
										child.equal(op.addNode),
								);
								if (liIndex > -1) {
									allOps.splice(liIndex, 1);
								}
							});
							const index =
								getIndex(domAddedNode) + JSON0_INDEX.ELEMENT;
							let p: Path = [...(path || [])];
							// 卡片没有完全渲染就在插入body位置插入
							p = p.concat([index]);
							const op = {
								id: rootId,
								bi: beginIndex,
								li: data,
								addNode: domAddedNode,
								p,
								newPath: p.slice(),
							};

							if (record['nl']) {
								op['nl'] = true;
							}
							ops.push(op);
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
						typeof getValue(this.doc?.data, oldPath, rootId) ===
							'string' &&
						(record['text-data'] || target['data']).length > 0
					) {
						const newOp = {
							id: rootId,
							bi: beginIndex,
							path,
							oldPath,
							newValue: record['text-data'] || target['data'],
						};
						if (record['nl']) {
							newOp['nl'] = true;
						}
						attrOps.push(newOp);
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
					if (record['nl']) {
						newOp.nl = true;
					}
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
						const childIds = op.childIds || [];
						const opDataId =
							Array.isArray(pathValue) && pathValue[1]
								? pathValue[1][DATA_ID]
								: undefined;
						const loopValue = (value: any) => {
							if (Array.isArray(value)) {
								const attr = value[1];
								if (
									attr &&
									attr[DATA_ID] &&
									attr[DATA_ID] !== op.id &&
									(!opDataId || attr[DATA_ID] !== opDataId)
								) {
									childIds.push(attr[DATA_ID]);
								}
								for (let i = 2; i < value.length; i++) {
									loopValue(value[i]);
								}
							}
						};
						loopValue(pathValue);
						op.childIds = childIds;
						const ldOp = {
							id: op.id,
							bi: beginIndex,
							ld: pathValue,
							p: op.p,
							nl: op['nl'],
							childIds,
							oldPath: op.oldPath,
						};
						let has = false;
						// 修复index
						// 如果删除后合并，__index 可能会发生变化，如果 <ul></ul> 被删除了，那么里面的 li 就取ul的路径组合当前li的路径
						allOps.forEach((aOp) => {
							if ('ld' in aOp) {
								if (aOp.id && op.childIds?.includes(aOp.id)) {
									aOp.p = op.p.concat(
										aOp.p.slice(op.p.length),
									);
									aOp.oldPath = op.oldPath?.concat(
										aOp.oldPath?.slice(op.oldPath.length) ||
											[],
									);
									aOp.ld = getValue(
										this.doc?.data,
										aOp.oldPath || [],
									);
								} else if (
									op.id &&
									aOp.childIds?.includes(op.id)
								) {
									ldOp.p = aOp.p.concat(
										op.p.slice(aOp.p.length),
									);
									ldOp.oldPath = aOp.oldPath?.concat(
										op.oldPath?.slice(aOp.oldPath.length) ||
											[],
									);
									ldOp.ld = getValue(
										this.doc?.data,
										ldOp.oldPath || [],
									);
								}
								const strP = aOp.p.join(',');
								const strLdP = ldOp.p.join(',');
								// 相等，不需要增加
								if (!has && strP === strLdP) {
									has = true;
								}
								// 比较删除深度，当前删除深度比已有的要深就忽略，当前删除的深度比已有的要浅就替换
								// 删除深度比已有的要深，忽略
								// if(strLdP.startsWith(strP)) {
								// 	return true
								// }
								// // 删除深度比已有的要浅，替换
								// if(strP.startsWith(strLdP)) {
								// 	allOps.splice(index, 1, ldOp);
								// 	return true
								// }
							}
						});
						if (!has) allOps.push(ldOp);
					}
				}
				if ('li' in op) {
					allOps.push({
						id: op.id,
						bi: beginIndex,
						li: op.li,
						p: op.p,
						nl: op['nl'],
						addNode: op['addNode'],
					} as any);
				}
			});
			allOps.push(...attrOps);
		}

		return allOps.map((op) => {
			if ('li' in op) {
				delete op.addNode;
			} else if ('ld' in op) {
				delete op.childIds;
				delete op.oldPath;
			}
			return op;
		});
	}
	/**
	 * 从 doc 中查找目标卡片
	 * @param data
	 * @param name
	 * @param callback
	 * @returns 返回卡片属性，以及是否已渲染
	 */
	findCardForDoc = (
		data: any,
		name: string,
		callback?: (attriables: { [key: string]: string }) => boolean,
	): { attriables: any; rendered: boolean } | void => {
		if (!Array.isArray(data)) {
			return;
		}
		for (let i = 1; i < data.length; i++) {
			if (i === 1) {
				const attriables = data[i];
				if (attriables && attriables['data-card-key'] === name) {
					if (callback && callback(attriables)) {
						const body = data[i + 1];
						return {
							attriables,
							rendered:
								Array.isArray(body) &&
								Array.isArray(body[2]) &&
								Array.isArray(body[2][2]),
						};
					}
				}
			} else if (Array.isArray(data[i])) {
				const result = this.findCardForDoc(data[i], name, callback);
				if (result) return result;
			}
		}
	};
	/**
	 * 处理DOM节点变更记录
	 * @param records 记录集合
	 */
	handleMutations(records: MutationRecord[]) {
		// 初次加载中的卡片，在提交ops后把loading状态移除
		const loadingCards: NodeInterface[] = [];
		//需要先过滤标记为非协同节点的变更，包括 data-element=ui、data-transient-element 等标记的节点，可以在 isTransientMutation 中查看逻辑
		//记录大于300的时候，先获取所有的不需要参与协同交互的节点，以提高效率
		if (records.length > 299) {
			this.cacheTransientElements = [];
			//非可编辑卡片的子节点
			const { card, container } = this.engine;
			card.each((card) => {
				// 增加异步加载的卡片子节点
				if (!card.isEditable || card.loading) {
					// 正在加载的可编辑卡片要获取内部子节点
					const isEditableLoading = card.isEditable && card.loading;
					card.root.allChildren().forEach((child) => {
						if (child.type === getDocument().ELEMENT_NODE) {
							if (isEditableLoading)
								child[0]['__card_root'] = card.root;
							this.cacheTransientElements?.push(child[0]);
						}
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
		const cardMap = new Map<Node, boolean>();
		records = records.filter((record) => {
			const beginCardIndex = loadingCards.length;
			let isTransient = this.isTransientMutation(
				record,
				this.cacheTransientElements,
				loadingCards,
			);
			// 判断要过滤的卡片是否在协同数据中渲染成功
			if (loadingCards.length > beginCardIndex && this.doc) {
				// 删除卡片不需要过滤
				const cardElement = loadingCards[loadingCards.length - 1];
				if (
					record.removedNodes.length === 1 &&
					cardElement.equal(record.removedNodes[0])
				) {
					return true;
				}
				const tMapValue = cardMap.get(cardElement[0]);
				if (tMapValue === undefined && cardElement.isEditableCard()) {
					const cardName = cardElement.attributes(CARD_KEY);
					const cardValue = decodeCardValue(
						cardElement.attributes(CARD_VALUE_KEY),
					);
					const result = this.findCardForDoc(
						this.doc.data,
						cardName,
						(attriables) => {
							// 卡片id一致
							const value = decodeCardValue(
								attriables[CARD_VALUE_KEY],
							);
							return value.id === cardValue.id;
						},
					);
					// 没有这个卡片节点，或者卡片内部已经渲染了才需要过滤
					if (result && !result.rendered) {
						isTransient = false;
						record['nl'] = true;
					} else {
						isTransient = true;
					}
					cardMap.set(cardElement[0], isTransient);
				} else if (tMapValue !== undefined) {
					isTransient = tMapValue;
				}
				// 标记节点为已处理
				record.addedNodes.forEach((addNode) => {
					addNode['__card_rendered'] = true;
				});
				// 需要比对异步加载的卡片子节点(body -> center -> 非 ui 和 data-transient-element节点)是否已经处理完，处理完就移除掉卡片根节点的 CARD_LOADING_KEY 标记
				// card.root.removeAttributes(CARD_LOADING_KEY);
				// 判断卡片下面的节点
				const children = cardElement
					.find(CARD_CENTER_SELECTOR)
					.children()
					.toArray();

				const isRendered =
					children.length > 0 &&
					children.every((child) => {
						if (child.length === 0) return true;
						const attributes = child.attributes();
						if (
							(attributes[DATA_ELEMENT] === UI ||
								!!attributes[DATA_TRANSIENT_ELEMENT]) &&
							!child.hasClass(CARD_LOADING_KEY)
						) {
							return true;
						}
						if (child[0]['__card_rendered'] === true) {
							return true;
						}
						return false;
					});
				if (isRendered) {
					const handleEditableCard = (
						editableCard: NodeInterface,
					) => {
						const childAllLoaded = editableCard
							.find(CARD_SELECTOR)
							.toArray()
							.every((childCard) => {
								const childLoading =
									childCard.attributes(CARD_LOADING_KEY);
								if (
									!childLoading ||
									childCard[0]['__card_rendered']
								) {
									return true;
								}
								return false;
							});
						if (childAllLoaded) {
							editableCard.removeAttributes(CARD_LOADING_KEY);
						}
					};
					// 可编辑卡片需要查看子卡片是否都渲染成功
					if (cardElement.isEditableCard()) {
						handleEditableCard(cardElement);
					} else {
						cardElement.removeAttributes(CARD_LOADING_KEY);
						// 非可编辑卡片需要判断当前是否在可编辑器卡内，加载成功需要判断父级的可编辑卡片是否都加载成功
						const cardParentElement = cardElement.parent();
						if (cardParentElement) {
							const parentEditableCard = this.engine.card.closest(
								cardParentElement,
								true,
							);
							if (
								parentEditableCard &&
								parentEditableCard.length > 0
							) {
								handleEditableCard(parentEditableCard);
							}
						}
					}
				}
			}
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
		//重置缓存
		this.cacheTransientElements = undefined;
		let ops = this.generateOps(records);
		ops = filterOperations(ops);
		if (!ops.every((op) => isCursorOp(op))) {
			targetElements.forEach((element) => {
				let node = $(element);
				if (node.isEditable() && !node.isRoot()) {
					const card = this.engine.card.find(node, true);
					node = card?.root || node;
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
				if (!pathValue) return;
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

	/**
	 * 获取要移除节点的索引
	 * @param record 当前记录
	 * @param records 记录集合
	 * @returns
	 */
	getRemoveNodeIndex(
		record: MutationRecord,
		records: MutationRecord[],
	): number {
		const { target, nextSibling, previousSibling, addedNodes } = record;
		const targetElement = target as Element;
		// 获取目标节点的过滤后非协同节点后的所有子节点
		const childNodes =
			target.nodeType === getDocument().ELEMENT_NODE &&
			targetElement.getAttribute(DATA_ELEMENT) === ROOT
				? Array.from(target.childNodes)
				: Array.from(target.childNodes).filter(
						(node) =>
							!isTransientElement(
								$(node),
								this.cacheTransientElements,
							),
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
			(record) =>
				record.target === target && record.removedNodes[0] === node,
		);
		if (record) {
			return this.getRemoveNodeIndex(record, records);
		}
		return 0;
	}
}
export default Producer;
