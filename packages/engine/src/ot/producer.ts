import {
	DIFF_DELETE,
	DIFF_EQUAL,
	DIFF_INSERT,
	diff_match_patch,
	patch_obj,
} from 'diff-match-patch';
import { EventEmitter2 } from 'eventemitter2';
import { Doc, Path, StringDeleteOp, StringInsertOp } from 'sharedb';
import isEqual from 'lodash/isEqual';
import { DocInterface, EngineInterface, TargetOp } from '../types';
import {
	findFromDoc,
	isTransientAttribute,
	toJSON0,
	isTransientElement,
} from './utils';
import {
	CARD_LOADING_KEY,
	CARD_KEY,
	CARD_TYPE_KEY,
	CARD_VALUE_KEY,
} from './../constants/card';
import { DATA_ID, JSON0_INDEX } from '../constants';
import { $ } from '../node';
import { isRoot } from '../node/utils';
import { decodeCardValue } from '../utils';

export default class Producer extends EventEmitter2 {
	private engine: EngineInterface;
	private doc?: DocInterface | Doc;
	private dmp: diff_match_patch;
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

	setDoc(doc: DocInterface | Doc) {
		this.doc = doc;
	}

	textToOps(path: Path, text1: string, text2: string) {
		const ops: (StringDeleteOp | StringInsertOp)[] = [];
		const patches = this.dmp.patch_make(text1, text2);
		Object.keys(patches).forEach((key) => {
			const patch: patch_obj = patches[key];
			if (patch.start1 === null) return;
			let offset: number = patch.start1;
			patch.diffs.forEach((diff) => {
				const [type, data] = diff;
				if (type !== DIFF_DELETE) {
					if (type !== DIFF_INSERT) {
						if (type === DIFF_EQUAL) {
							offset += data.length;
						}
					} else {
						const p: Path = [];

						ops.push({
							si: data,
							p: p.concat([...path], [offset]),
						});
					}
				} else {
					const p: Path = [];
					ops.unshift({
						sd: data,
						p: p.concat([...path], [offset]),
					});
				}
			});
		});
		return ops;
	}

	/**
	 * 生成属性ops
	 * @param id
	 * @param oldAttributes
	 * @param path
	 * @param newAttributes
	 * @returns
	 */
	handleAttributes(
		id: string,
		beginIndex: number,
		path: Path,
		oldAttributes: Record<string, any>,
		newAttributes: Record<string, any>,
		isLoadingCard: boolean = false,
	) {
		const ops: TargetOp[] = [];
		const oId = id === 'root' ? '' : id;
		const oBi = id === 'root' ? -1 : beginIndex;
		Object.keys(newAttributes).forEach((key) => {
			const newAttr = newAttributes[key];
			const newPath = [...path, JSON0_INDEX.ATTRIBUTE, key];
			// 旧属性没有，新增属性
			if (!oldAttributes.hasOwnProperty(key)) {
				if (newAttr !== oldAttributes[key]) {
					ops.push({
						id: oId,
						nl: isLoadingCard,
						bi: oBi,
						p: newPath,
						oi: newAttr,
					});
					return;
				}
			}
			const oldAttr = oldAttributes[key];
			// 旧属性有，修改属性
			if (newAttr !== oldAttr) {
				let nl = isLoadingCard;
				if (key === CARD_VALUE_KEY) {
					const value = decodeCardValue(newAttr);
					const component = this.engine.card.find(value.id);
					if (
						component?.writeHistoryOnValueChange &&
						component.writeHistoryOnValueChange(value) === false
					) {
						nl = true;
					}
				}
				ops.push({
					id: oId,
					nl,
					bi: oBi,
					p: newPath,
					od: oldAttr,
					oi: newAttr,
				});
			}
		});
		Object.keys(oldAttributes).forEach((key) => {
			// 旧属性有，新增没有，删除
			if (!newAttributes.hasOwnProperty(key)) {
				ops.push({
					id: oId,
					nl: isLoadingCard,
					bi: oBi,
					p: path.concat(JSON0_INDEX.ATTRIBUTE, key),
					od: oldAttributes[key],
				});
			}
		});
		return ops;
	}

	/**
	 * 处理新数据只有一行文本的时候
	 * @param id
	 * @param path
	 * @param newText
	 * @param oldValue
	 * @returns
	 */
	handleFirstLineText = (
		id: string,
		beginIndex: number,
		path: Path,
		newText: string,
		oldChildren: any[],
		isLoadingCard: boolean = false,
	) => {
		const ops: TargetOp[] = [];
		const oldText = oldChildren[0];
		const isText = typeof oldText === 'string';
		const oId = id === 'root' ? '' : id;
		const oBi = id === 'root' ? -1 : beginIndex;
		// 都是文本
		if (isText) {
			if (newText !== oldText) {
				const tOps = this.textToOps(path, oldText, newText);
				for (let i = 0; i < tOps.length; i++) {
					ops.push(
						Object.assign({}, tOps[i], {
							id: oId,
							bi: oBi,
							nl: isLoadingCard,
						}),
					);
				}
			}
		}
		for (let c = oldChildren.length - 1; c >= (isText ? 1 : 0); c--) {
			const oldChild = oldChildren[c];
			const newPath = path.concat();
			newPath[newPath.length - 1] = c + JSON0_INDEX.ELEMENT;
			ops.push({
				id: oId,
				nl: isLoadingCard,
				bi: oBi,
				p: newPath,
				ld: oldChild,
			});
		}
		if (!isText)
			ops.push({
				id: oId,
				nl: isLoadingCard,
				bi: oBi,
				p: path,
				li: newText,
			});
		return ops;
	};

	isLoadingCard = (child: any) => {
		if (
			child.length > JSON0_INDEX.ATTRIBUTE &&
			!Array.isArray(child[1]) &&
			typeof child[1] === 'object'
		) {
			const attributes = child[JSON0_INDEX.ATTRIBUTE];
			const cardKey = attributes[CARD_KEY];
			const cardType = attributes[CARD_TYPE_KEY];
			const dataId = attributes[DATA_ID];
			if (cardKey && cardType && dataId) {
				const cardNode = this.engine.container
					.get<Element>()
					?.querySelector(`[${DATA_ID}="${dataId}"]`);
				if (cardNode?.getAttribute(CARD_LOADING_KEY)) {
					return true;
				}
			}
		}
		return false;
	};

	handleChildren = (
		id: string,
		beginIndex: number,
		path: Path,
		oldChildren: any[],
		newChildren: any[],
		isLoadingCard: boolean = false,
	) => {
		const ops: TargetOp[] = [];
		const oId = id === 'root' ? '' : id;
		const oBi = id === 'root' ? -1 : beginIndex;
		// 2.1 旧节点没有子节点数据
		if (oldChildren.length === 0) {
			// 全部插入
			for (let c = 0; c < newChildren.length; c++) {
				ops.push({
					id,
					nl: isLoadingCard,
					bi: oBi,
					p: path.concat(c + JSON0_INDEX.ELEMENT),
					li: newChildren[c],
				});
			}
		}
		// 2.2 旧节点有子节点数据
		else {
			// 2.2.1 新节点没有子节点数据
			if (newChildren.length === 0) {
				// 全部删除
				for (let c = oldChildren.length - 1; c >= 0; c--) {
					ops.push({
						id: oId,
						nl: isLoadingCard,
						bi: oBi,
						p: path.concat(c + JSON0_INDEX.ELEMENT),
						ld: oldChildren[c],
					});
				}
			}
			// 2.2.2 新节点有子节点数据，并且是字符
			else if (
				newChildren.length === 1 &&
				typeof newChildren[0] === 'string'
			) {
				ops.push(
					...this.handleFirstLineText(
						id,
						oBi,
						path.concat(JSON0_INDEX.ELEMENT),
						newChildren[0],
						oldChildren,
						isLoadingCard,
					),
				);
			}
			// 2.2.3 新节点有子节点数据，并且不是字符
			else {
				// 2.2.3.1 如果子节点都有 id，则比较 id
				if (
					newChildren.every((child) =>
						Array.isArray(child)
							? child[JSON0_INDEX.ATTRIBUTE][DATA_ID]
							: false,
					) &&
					oldChildren.every((child) =>
						Array.isArray(child)
							? child[JSON0_INDEX.ATTRIBUTE][DATA_ID]
							: false,
					)
				) {
					// 先找出需要删除的旧节点
					for (let c = oldChildren.length - 1; c >= 0; c--) {
						const oldChild = oldChildren[c];
						const newChild = newChildren.find(
							(child) =>
								child[JSON0_INDEX.ATTRIBUTE][DATA_ID] ===
								oldChild[JSON0_INDEX.ATTRIBUTE][DATA_ID],
						);
						if (!newChild) {
							ops.push({
								id: oId,
								nl: isLoadingCard,
								bi: oBi,
								p: path.concat(c + JSON0_INDEX.ELEMENT),
								ld: oldChild,
							});
							oldChildren.splice(c, 1);
						}
					}
					// 再找出需要插入的新节点
					for (let c = 0; c < newChildren.length; c++) {
						const newChild = newChildren[c];
						const oldChild = oldChildren.find(
							(child) =>
								child[JSON0_INDEX.ATTRIBUTE][DATA_ID] ===
								newChild[JSON0_INDEX.ATTRIBUTE][DATA_ID],
						);
						if (!oldChild) {
							ops.push({
								id,
								nl: isLoadingCard,
								bi: oBi,
								p: path.concat(c + JSON0_INDEX.ELEMENT),
								li: newChild,
							});
							oldChildren.splice(c, 0, newChild);
						}
						// 对比有差异的子节点
						else if (!isEqual(newChild, oldChild)) {
							// 比较属性
							const newAttributes = newChild[
								JSON0_INDEX.ATTRIBUTE
							] as Record<string, any>;
							const oldAttributes = oldChild[
								JSON0_INDEX.ATTRIBUTE
							] as Record<string, any>;
							const newPath = path.concat(
								c + JSON0_INDEX.ELEMENT,
							);
							ops.push(
								...this.handleAttributes(
									id,
									oBi,
									newPath,
									oldAttributes,
									newAttributes,
									isLoadingCard,
								),
							);
							// 比较子节点
							ops.push(
								...this.handleChildren(
									id,
									oBi,
									newPath,
									oldChild.slice(JSON0_INDEX.ELEMENT),
									newChild.slice(JSON0_INDEX.ELEMENT),
									isLoadingCard,
								),
							);
						}
					}
				}
				// 2.2.3.2 如果子节点都没有 id，则先删后插
				else {
					// 删除多余的旧节点
					if (oldChildren.length > newChildren.length) {
						for (
							let c = oldChildren.length - 1;
							c >= newChildren.length;
							c--
						) {
							ops.push({
								id: oId,
								nl: isLoadingCard,
								bi: oBi,
								p: path.concat(c + JSON0_INDEX.ELEMENT),
								ld: oldChildren[c],
							});
						}
					}
					// 对比节点是替换还是插入
					for (let c = 0; c < newChildren.length; c++) {
						const newChild = newChildren[c];
						const oldChild = oldChildren[c];
						// 没有旧节点，就插入
						if (!oldChild) {
							ops.push({
								id,
								nl: isLoadingCard,
								bi: oBi,
								p: path.concat(c + JSON0_INDEX.ELEMENT),
								li: newChild,
							});
						} else if (!isEqual(newChild, oldChild)) {
							// 如果是一样的标签和一样的类型，则比较属性和子节点
							if (
								typeof newChild !== 'string' &&
								typeof newChild === typeof oldChild &&
								newChild[JSON0_INDEX.TAG_NAME] ===
									oldChild[JSON0_INDEX.TAG_NAME]
							) {
								// 比较属性
								const newAttributes = newChild[
									JSON0_INDEX.ATTRIBUTE
								] as Record<string, any>;
								const oldAttributes = oldChild[
									JSON0_INDEX.ATTRIBUTE
								] as Record<string, any>;
								const newPath = path.concat(
									c + JSON0_INDEX.ELEMENT,
								);
								ops.push(
									...this.handleAttributes(
										id,
										oBi,
										newPath,
										oldAttributes,
										newAttributes,
										isLoadingCard,
									),
								);
								// 比较子节点
								ops.push(
									...this.handleChildren(
										id,
										oBi,
										newPath,
										oldChild.slice(JSON0_INDEX.ELEMENT),
										newChild.slice(JSON0_INDEX.ELEMENT),
										isLoadingCard,
									),
								);
							} else {
								// 直接替换旧节点
								ops.push({
									id: oId,
									nl: isLoadingCard,
									bi: oBi,
									p: path.concat(c + JSON0_INDEX.ELEMENT),
									ld: oldChild,
								});
								ops.push({
									id,
									nl: isLoadingCard,
									bi: oBi,
									p: path.concat(c + JSON0_INDEX.ELEMENT),
									li: newChild,
								});
							}
						}
					}
				}
			}
		}
		return ops;
	};

	/**
	 * 处理DOM节点变更记录
	 * @param records 记录集合
	 */
	handleMutations(records: MutationRecord[]) {
		let targetRoots: Element[] = [];
		const data = this.doc?.data;
		if (!data || records.length === 0) return;
		if (data.length === 0) {
			targetRoots.push(this.engine.container.get<Element>()!);
		} else {
			for (let r = 0; r < records.length; r++) {
				const record = records[r];
				if (!record) continue;
				const { type } = record;
				let target: Node | null = record.target;
				// 根节点直接跳出
				const isRT = target instanceof Element && isRoot(target);
				// 根节点属性变化不处理
				if (
					type === 'attributes' &&
					((record.attributeName &&
						isTransientAttribute(target, record.attributeName)) ||
						isRT)
				) {
					continue;
				}

				if (target instanceof Text) target = target.parentElement;
				if (
					!target ||
					!target.isConnected ||
					!(target instanceof Element) ||
					isTransientElement(target)
				)
					continue;

				if (isRT) {
					targetRoots = [target];
					break;
				}
				// 判断不能是已有的节点或者已有节点的子节点
				if (
					targetRoots.length === 0 ||
					(!targetRoots.includes(target) &&
						targetRoots.every((root) => !root.contains(target)))
				) {
					let len = targetRoots.length;
					for (let t = 0; t < len; t++) {
						// 如果当前节点包含已有的节点就把已有的节点删除
						if (target.contains(targetRoots[t])) {
							targetRoots.splice(t, 1);
							len--;
							t--;
						}
					}
					targetRoots.push(target);
				}
			}
		}

		if (targetRoots.length === 0) return;
		const ops: TargetOp[] = [];
		targetRoots.forEach((root) => {
			ops.push(...this.diff(root, data));
		});
		if (ops.length > 0) {
			this.emit('ops', ops);
		}
	}

	diff(root: Element, data: any = this.doc?.data || []) {
		const ops: TargetOp[] = [];
		if (!root.isConnected) return [];
		let id = isRoot(root) ? 'root' : root.getAttribute(DATA_ID);
		if (!id) {
			const cRoot = this.engine.block
				.closest($(root), (node) => !!node.attributes(DATA_ID))
				.get<Element>();
			if (!(cRoot instanceof Element)) return [];
			root = cRoot;
			id = root.getAttribute(DATA_ID);
		}
		if (!id) return [];
		const newJson = toJSON0(root) as any[];
		if (!newJson) return [];
		const isRootId = id === 'root';
		const oldValue = isRootId
			? data
			: findFromDoc(data, (attributes) => attributes[DATA_ID] === id);
		if (!oldValue) return [];
		// 比较新旧数据
		const { path } = oldValue;
		const isLoadingCard = this.isLoadingCard(newJson);
		// 1. 根节点属性变更
		if (id !== 'root') {
			const newAttributes = newJson[JSON0_INDEX.ATTRIBUTE] as Record<
				string,
				any
			>;
			const oldAttributes = oldValue.attributes;
			ops.push(
				...this.handleAttributes(
					id,
					path.length,
					path,
					oldAttributes,
					newAttributes,
					isLoadingCard,
				),
			);
		}
		// 2. 子节点变更
		const newChildren = newJson.slice(2);
		const oldChildren = Array.isArray(oldValue)
			? oldValue.slice(2)
			: oldValue.children;
		ops.push(
			...this.handleChildren(
				isRootId ? '' : id,
				isRootId ? -1 : path.length,
				path ?? [],
				oldChildren,
				newChildren,
				isLoadingCard,
			),
		);
		return ops;
	}
}
