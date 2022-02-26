import { EventEmitter2 } from 'eventemitter2';
import { Doc, Op, Path } from 'sharedb';
import { Type } from 'sharedb/lib/sharedb';
import { CardInterface } from './card';
import { NodeInterface } from './node';
import { RangeInterface, RangePath } from './range';
import { DrawStyle, TinyCanvasInterface } from './tiny-canvas';

/**
 * 写作者光标属性
 */
export type Attribute = {
	/**
	 * 协作者id
	 */
	uuid: string;
	/**
	 * 光标位置
	 */
	path?: { start: RangePath; end: RangePath };
	/**
	 * 是否激活
	 */
	active: boolean;
};

/**
 * 协作者信息
 */
export type Member = {
	/**
	 * 协作者id
	 */
	uuid: string;
	/**
	 * 协作者名称
	 */
	name: string;
	/**
	 * 协作者颜色
	 */
	color: string;
	/**
	 * 协作者索引，用来随机颜色
	 */
	index: number;
};

/**
 * 操作属性
 */
export type Operation = {
	self?: boolean;
	ops?: TargetOp[];
	rangePath?: { start: RangePath; end: RangePath };
	startRangePath?: { start: RangePath; end: RangePath };
	id?: string;
	type?: 'undo' | 'redo';
};

export interface DocInterface<T = any> extends EventEmitter2 {
	// json0 类型，默认本地初始化为null
	type: Type | null;
	// 文档数据
	data: T;
	// 从文档中创建json0数据
	create(): void;
	// 把操作应用到文档
	apply(ops: Op[]): void;
	// 提交操作到協同作業
	submitOp(ops: Op[]): void;
	// 注销
	destroy(): void;
}

export interface SelectionInterface {
	/**
	 * 当前光标路径
	 */
	currentRangePath?: { start: RangePath; end: RangePath };
	/**
	 * 获取所有协作者的光标路径
	 */
	getSelections(): Array<Attribute>;
	/**
	 * 设置所有的协作者的光标路径
	 * @param data
	 */
	setSelections(data: Array<Attribute>): void;
	/**
	 * 移除一个协作者的光标
	 * @param uuid
	 */
	remove(uuid: string): void;
	/**
	 * 更新协作者选区
	 * @param currentMember
	 * @param members
	 */
	updateSelections(
		currentMember: Member,
		members: Array<Member>,
	): { data: Array<Attribute>; range: RangeInterface };
}

export type CursorRect = {
	top: string;
	left: string;
	height: string | number;
	elementHeight: number;
};

export interface RangeColoringInterface {
	/**
	 * 获取节点相对于光标的位置
	 * @param node
	 * @param range
	 */
	getRectWithRange(node: NodeInterface, range: RangeInterface): DOMRect;
	/**
	 * 光标开始节点和结束节点是否在一条水平线上
	 * @param range
	 */
	isWrapByRange(range: RangeInterface): boolean;
	/**
	 * 绘制子光标
	 * @param node 节点
	 * @param canvas
	 * @param range
	 * @param style
	 */
	drawSubRang(
		node: NodeInterface,
		canvas: TinyCanvasInterface,
		range: RangeInterface,
		style: DrawStyle,
	): void;
	/**
	 * 绘制背景
	 * @param range
	 * @param options
	 */
	drawBackground(
		range: RangeInterface,
		options: { uuid: string; color: string },
	): Array<RangeInterface>;
	/**
	 * 获取节点 rect
	 * @param node
	 * @param rect
	 */
	getNodeRect(node: NodeInterface, rect: DOMRect): DOMRect;
	/**
	 * 获取光标 rect
	 * @param selector
	 * @param leftSpace
	 */
	getCursorRect(
		selector: RangeInterface | NodeInterface,
		leftSpace?: number,
	): CursorRect;
	/**
	 * 设置光标 rect
	 * @param node
	 * @param rect
	 */
	setCursorRect(node: NodeInterface, rect: CursorRect): void;
	/**
	 * 展示协作者信息
	 * @param node
	 * @param member
	 */
	showCursorInfo(node: NodeInterface, member: Member): void;
	/**
	 * 隐藏协作者信息
	 * @param node
	 */
	hideCursorInfo(node: NodeInterface): void;
	/**
	 * 绘制协作者光标
	 * @param selector
	 * @param member
	 */
	drawCursor(
		selector: RangeInterface | NodeInterface,
		member: Member,
		showInfo?: boolean,
	): NodeInterface | undefined;
	/**
	 * 绘制卡片光标
	 * @param node
	 * @param cursor
	 * @param member
	 */
	drawCard(node: NodeInterface, cursor: NodeInterface, member: Member): void;
	/**
	 * 设置卡片被协作者选中
	 * @param card
	 * @param member
	 */
	setCardSelectedByOther(card: CardInterface, member?: Member): void;
	/**
	 * 设置卡片被协作者激活
	 * @param card
	 * @param member
	 */
	setCardActivatedByOther(card: CardInterface, member?: Member): void;
	/**
	 * 绘制
	 * @param range
	 * @param member
	 */
	drawRange(range: RangeInterface, member: Member, showInfo?: boolean): void;
	/**
	 * 更新绘制的背景位置
	 */
	updateBackgroundPosition(): void;
	/**
	 * 更新绘制的协作者光标位置
	 */
	updateCursorPosition(): void;
	/**
	 * 更新绘制的卡片背景位置
	 */
	updateCardPosition(): void;
	/**
	 * 更新绘制的光标位置
	 */
	updatePosition(): void;
	/**
	 * 更新背景的透明度
	 * @param range
	 */
	updateBackgroundAlpha(range: RangeInterface): void;
	/**
	 * 渲染
	 * @param data
	 * @param members
	 * @param idDraw
	 */
	render(
		data: Array<Attribute>,
		members: Array<Member>,
		idDraw: boolean,
		showInfo?: boolean,
	): void;
	/**
	 * 销毁
	 */
	destroy(): void;
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

export type TargetOp = Op & {
	id?: string;
	bi?: number;
};

export type RepairOp = TargetOp & {
	oldPath?: Path;
	newPath: Path;
	childIds?: string[];
};

export interface MutationInterface extends EventEmitter2 {
	/**
	 * 是否终止中
	 */
	isStopped: boolean;
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
	 * 操作改变
	 * @param ops 操作
	 */
	onChange(ops: Op[]): void;
}

export interface ConsumerInterface {
	/**
	 * 根据路径还原目标节点
	 * @param node
	 * @param path [开始节点，开始offset，结束节点，结束offset]
	 */
	getElementFromPath(
		node: Node | NodeInterface,
		path: Path,
	): {
		startNode: Node;
		startOffset: number;
		endNode: Node;
		endOffset: number;
	};
	/**
	 * 设置属性操作
	 * @param root 根节点
	 * @param path 路径
	 * @param attr 属性名称
	 * @param value 属性值
	 */
	setAttribute(
		root: NodeInterface,
		path: Path,
		attr: string,
		value: string,
	): void;
	/**
	 * 删除属性操作
	 * @param root 根节点
	 * @param path 路径
	 * @param attr 属性名称
	 */
	removeAttribute(root: NodeInterface, path: Path, attr: string): void;
	/**
	 * 插入一个节点
	 * @param root 根节点
	 * @param path 路径
	 * @param value 操作值
	 */
	insertNode(
		root: NodeInterface,
		path: Path,
		value: string | Op[] | Op[][],
	): void;
	/**
	 * 删除一个节点
	 * @param root 根节点
	 * @param path 路径
	 */
	deleteNode(root: NodeInterface, path: Path): void;
	/**
	 * 插入文本
	 * @param root 根节点
	 * @param path 路径
	 * @param offset 文本节点的偏移量
	 * @param text 插入的文本
	 */
	insertText(
		root: NodeInterface,
		path: Path,
		offset: number,
		text: string,
	): void;
	/**
	 * 删除文本
	 * @param root 根节点
	 * @param path 路径
	 * @param offset 文本节点的偏移量
	 * @param text 删除的文本
	 */
	deleteText(
		root: NodeInterface,
		path: Path,
		offset: number,
		text: string,
	): void;
	/**
	 * 处理操作
	 * @param op
	 */
	handleOperation(op: TargetOp): void;
	/**
	 * 处理远程操作
	 * @param ops
	 */
	handleRemoteOperations(ops: TargetOp[]): NodeInterface[];
	/**
	 * 处理本地操作
	 * @param ops
	 */
	handleSelfOperations(ops: TargetOp[]): NodeInterface[];
	/**
	 * 处理完操作后设置光标位置
	 * @param op
	 */
	setRangeAfterOp(op: Op): void;
	/**
	 * 获取远程光标位置路径
	 */
	getRangeRemotePath(): RemotePath | undefined;
	/**
	 * 设置远程光标位置路径
	 * @param path
	 */
	setRangeByRemotePath(path: RemotePath): void;
	/**
	 * 设置光标路径
	 * @param path
	 */
	setRangeByPath(path: { start: RangePath; end: RangePath }): void;
	/**
	 * 处理完操作后更新节点的 __index
	 * @param ops
	 * @param applyNodes
	 */
	handleIndex(ops: Op[], applyNodes: NodeInterface[]): void;
}

export interface OTInterface extends EventEmitter2 {
	// 操作消费者
	consumer: ConsumerInterface;
	selection: SelectionInterface;
	getColors(): string[];
	setColors(colors: string[]): void;
	/**
	 * 初始化本地操作监听ops，用于记录历史记录
	 */
	initLocal(): void;
	/**
	 * 初始化协同服务
	 * @param doc 文档对象
	 * @param defaultValue 如果文档不存在，则使用 defaultValue 初始化默认值
	 */
	initRemote(doc: Doc, defaultValue?: string): void;
	/**
	 * 处理操作改变
	 * @param ops 操作集合
	 */
	handleChange(ops: Op[]): void;
	/**
	 * 提交操作到协同服务
	 * @param ops
	 */
	submitOps(ops: Op[]): void;
	/**
	 * 应用操作
	 * @param ops
	 */
	apply(ops: Op[]): void;
	/**
	 * 同步数据
	 */
	syncValue(): void;
	/**
	 * 开始监听DOM树改变
	 */
	startMutation(): void;
	/**
	 * 停止监听DOM树改变
	 */
	stopMutation(): void;
	/**
	 * 是否终止中
	 */
	isStopped(): boolean;
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
	/**
	 * 设置用户颜色
	 * @param member
	 */
	setMemberColor(member: Member): void;
	/**
	 * 获取所有用户
	 */
	getMembers(): Array<Member>;
	/**
	 * 设置用户
	 * @param members
	 */
	setMembers(members: Array<Member>): void;
	/**
	 * 增加一个用户
	 * @param member
	 */
	addMember(member: Member): void;
	/**
	 * 移除一个用户
	 * @param member
	 */
	removeMember(member: Member): void;
	/**
	 * 设置当前用户
	 * @param member
	 */
	setCurrentMember(member: Member): void;
	/**
	 * 获取当前用户
	 */
	getCurrentMember(): Member | undefined;
	/**
	 * 渲染用戶選區
	 */
	renderSelection(
		attributes: Array<Attribute>,
		isDraw?: boolean,
		showInfo?: boolean,
	): void;
	/**
	 * 更新用户选区
	 */
	updateSelection(): void;
	/**
	 * 更新选区位置
	 */
	updateSelectionPosition(): void;
	/**
	 * 实例化选区
	 */
	initSelection(showInfo?: boolean): void;
	/**
	 * 销毁
	 */
	destroy(): void;
}
