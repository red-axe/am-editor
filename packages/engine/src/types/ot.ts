import { EventEmitter2 } from 'eventemitter2';
import { Doc, Op, Path } from 'sharedb';
import { CardInterface } from './card';
import { NodeInterface } from './node';
import { RangeInterface } from './range';

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

export interface DocInterface extends EventEmitter2 {
  mode: string;
  version: number;
  data: any;
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
  render(data: Array<Attribute>, members: Array<Member>, idDraw: boolean): void;
}

export type DrawStyle = {
  fill?: string;
  stroke?: string;
};

export type DrawOptions = DOMRect & DrawStyle;

export interface TinyCanvasInterface {
  resize(width: number, height: number): void;
  getImageData(options: DOMRect): ImageData | undefined;
  draw(type: 'Rect', options: DrawOptions): void;
  clearRect(options: DOMRect): void;
  clear(): void;
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

export type RepairOp = Op & {
  oldPath?: Path;
  newPath: Path;
};

export interface MutationInterface extends EventEmitter2 {
  setDoc(doc: DocInterface | Doc): void;
  start(): void;
  stop(): void;
  onOpsReady(ops: Op[]): void;
}

export interface ApplierInterface {
  setAttribute(path: Path, attr: string, value: string): void;
  removeAttribute(path: Path, attr: string): void;
  insertNode(path: Path, value: string | Op[] | Op[][]): void;
  deleteNode(path: Path): void;
  insertInText(path: Path, offset: number, text: string): void;
  deleteInText(path: Path, offset: number, text: string): void;
  applyOperation(op: Op): void;
  applyRemoteOperations(ops: Op[]): void;
  applySelfOperations(ops: Op[]): void;
  setRangeAfterOp(op: Op): void;
  getRangeRemotePath(): RemotePath | undefined;
  setRangeByRemotePath(path: RemotePath): void;
  setRangeByPath(path: Path[]): void;
}

export interface OTInterface extends EventEmitter2 {
  applier: ApplierInterface;
  selectionData: SelectionDataInterface;
  destroy(): void;
  initLockMode(): void;
  init(doc: Doc): void;
  handleOps(ops: Op[]): void;
  submitOps(ops: Op[]): void;
  applyAll(ops: Op[]): void;
  syncData(): void;
  setData(data: Array<any>): void;
  startMutation(): void;
  stopMutation(): void;
  setMemberIdToUuid(member: Member): void;
  setMemberUuidToId(member: Member): void;
  setMemberColor(member: Member): void;
  getMembers(): Array<Member>;
  setMembers(members: Array<Member>): void;
  addMember(member: Member): void;
  removeMember(member: Member): void;
  setCurrentMember(member: Member): void;
  doRangeColoring(attrs: Array<Attribute>, isDraw?: boolean): void;
  updateSelectionData(): void;
  initSelection(): void;
}
