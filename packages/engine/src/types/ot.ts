import { EventEmitter2 } from 'eventemitter2';
import { Doc, Op, Path } from 'sharedb';
import { Type } from 'sharedb/lib/sharedb';
import { CardInterface } from './card';
import { NodeInterface } from './node';
import { RangeInterface } from './range';
import { DrawStyle, TinyCanvasInterface } from './tiny-canvas';

export type Attribute = {
	uuid: string;
	path: Path[];
	active: boolean;
};

export type Member = {
	id?: string;
	iid?: number;
	__uuid?: string;
	uuid: string;
	name: string;
	color: string;
};

export type Operation = {
	self?: boolean;
	ops?: Op[];
	rangePath?: Path[];
	startRangePath?: Path[];
	uid?: string;
	status?: 'undo' | 'redo';
};

export interface DocInterface<T = any> extends EventEmitter2 {
	type: Type | null;
	mode: string;
	version: number;
	data: T;
	destroy(): void;
	create(): void;
	apply(ops: Op[]): void;
	submitOp(ops: Op[]): void;
}

export interface SelectionDataInterface {
	currentRangePath: Path[];
	getAll(): Array<Attribute>;
	setAll(data: Array<Attribute>): void;
	remove(name: string): void;
	updateAll(
		currentMember: Member,
		members: Array<Member>,
	): { data: Array<Attribute>; range: RangeInterface };
}

export type CacheRange = {
	startOffset: number;
	endOffset: number;
	startContainer: Node;
	endContainer: Node;
	commonAncestorContainer: Node;
};

export type CursorRect = {
	top: string;
	left: string;
	height: string | number;
	elementHeight: number;
};

export interface RangeColoringInterface {
	destroy(): void;
	getRelativeRect(node: NodeInterface, range: RangeInterface): DOMRect;
	cacheRange(range: RangeInterface): CacheRange;
	isRangeWrap(range: RangeInterface): boolean;
	drawOneByOne(
		node: NodeInterface,
		canvas: TinyCanvasInterface,
		range: RangeInterface,
		style: DrawStyle,
	): void;
	drawBackground(
		range: RangeInterface,
		options: { uuid: string; color: string },
	): Array<RangeInterface>;
	getNodeRect(node: NodeInterface, rect: DOMRect): DOMRect;
	getCursorRect(
		selector: RangeInterface | NodeInterface,
		leftSpace?: number,
	): CursorRect;
	setCursorRect(node: NodeInterface, rect: CursorRect): void;
	showCursorInfo(node: NodeInterface, member: Member): void;
	hideCursorInfo(node: NodeInterface): void;
	drawCursor(
		selector: RangeInterface | NodeInterface,
		member: Member,
	): NodeInterface | undefined;
	drawCardMask(
		node: NodeInterface,
		cursor: NodeInterface,
		member: Member,
	): void;
	setCardSelectedByOther(card: CardInterface, member?: Member): void;
	setCardActivatedByOther(card: CardInterface, member?: Member): void;
	drawRange(range: RangeInterface, member: Member): void;
	updateBackgroundPosition(): void;
	updateCursorPosition(): void;
	updateCardMaskPosition(): void;
	updatePosition(): void;
	updateBackgroundAlpha(range: RangeInterface): void;
	render(
		data: Array<Attribute>,
		members: Array<Member>,
		idDraw: boolean,
	): void;
}

export type RemotePath = {
	start?: RemoteAttr;
	end?: RemoteAttr;
};

export type RemoteAttr = {
	id: string;
	leftText: string;
	rightText: string;
};

export type RepairOp = Op & {
	oldPath?: Path;
	newPath: Path;
};

export interface MutationInterface extends EventEmitter2 {
	/**
	 * 设置文档对象 OT 文档对象，或自定义文档对象
	 * @param doc 文档对象
	 */
	setDoc(doc: DocInterface | Doc): void;
	/**
	 * 开始监听DOM树改变
	 */
	start(): void;
	/**
	 * 停止监听DOM树改变
	 */
	stop(): void;
	/**
	 * 开始缓存操作，开启后将拦截监听并缓存起来
	 */
	startCache(): void;
	/**
	 * 将缓存提交处理，最后停止缓存
	 */
	submitCache(): void;
	/**
	 * 将缓存遗弃，并停止缓存
	 */
	destroyCache(): void;
	/**
	 * 获取缓存的记录
	 * @returns
	 */
	getCaches(): MutationRecord[];
	/**
	 * 操作读取
	 * @param ops 操作
	 */
	onOpsReady(ops: Op[]): void;
}

export interface ApplierInterface {
	elementAtPath(
		node: Node | NodeInterface,
		path: Path,
	): [Node, undefined | number, Node, number];
	setAttribute(path: Path, attr: string, value: string): void;
	removeAttribute(path: Path, attr: string): void;
	insertNode(path: Path, value: string | Op[] | Op[][]): void;
	deleteNode(path: Path): void;
	insertInText(path: Path, offset: number, text: string): void;
	deleteInText(path: Path, offset: number, text: string): void;
	applyOperation(op: Op): void;
	applyRemoteOperations(ops: Op[]): NodeInterface[];
	applySelfOperations(ops: Op[]): NodeInterface[];
	setRangeAfterOp(op: Op): void;
	getRangeRemotePath(): RemotePath | undefined;
	setRangeByRemotePath(path: RemotePath): void;
	setRangeByPath(path: Path[]): void;
	applyIndex(ops: Op[], applyNodes: NodeInterface[]): void;
}

export interface OTInterface extends EventEmitter2 {
	applier: ApplierInterface;
	selectionData: SelectionDataInterface;
	destroy(): void;
	initLockMode(): void;
	/**
	 * 初始化协同服务
	 * @param doc 文档对象
	 * @param defaultValue 如果文档不存在，则使用 defaultValue 初始化默认值
	 */
	init(doc: Doc, defaultValue?: string): void;
	handleOps(ops: Op[]): void;
	submitOps(ops: Op[]): void;
	applyAll(ops: Op[]): void;
	syncData(): void;
	setData(data: Array<any>): void;
	/**
	 * 开始监听DOM树改变
	 */
	startMutation(): void;
	/**
	 * 停止监听DOM树改变
	 */
	stopMutation(): void;
	/**
	 * 开始缓存操作，开启后将拦截监听并缓存起来
	 */
	startMutationCache(): void;
	/**
	 * 将缓存提交处理，最后停止缓存
	 */
	submitMutationCache(): void;
	/**
	 * 将缓存遗弃，并停止缓存
	 */
	destroyMutationCache(): void;
	/**
	 * 获取缓存的记录
	 * @returns
	 */
	getCaches(): MutationRecord[];
	setMemberIdToUuid(member: Member): void;
	setMemberUuidToId(member: Member): void;
	setMemberColor(member: Member): void;
	getMembers(): Array<Member>;
	setMembers(members: Array<Member>): void;
	addMember(member: Member): void;
	removeMember(member: Member): void;
	setCurrentMember(member: Member): void;
	getCurrentMember(): Member | undefined;
	doRangeColoring(attrs: Array<Attribute>, isDraw?: boolean): void;
	updateSelectionData(): void;
	initSelection(): void;
}
