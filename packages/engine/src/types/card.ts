import { ContentViewInterface } from './content-view';
import { EngineInterface } from './engine';
import { LanguageInterface } from './language';
import { NodeInterface } from './node';
import { RangeInterface } from './range';
import {
  DropdownButtonOptions,
  DropdownSwitchOptions,
  ToolbarItemOptions,
} from './toolbar';

export enum CardType {
  INLINE = 'inline',
  BLOCK = 'block',
}

export type CardOptions = {
  engine?: EngineInterface;
  contentView?: ContentViewInterface;
  type: CardType;
  value?: any;
  root?: NodeInterface;
};

export interface CardToolbarInterface {
  /**
   * 创建卡片的toolbar
   */
  create(): void;
  /**
   * 隐藏toolbar，包含dnd
   */
  hide(): void;
  /**
   * 展示toolbar，包含dnd
   * @param event 鼠标事件，用于定位
   */
  show(event?: MouseEvent): void;
  /**
   * 只隐藏卡片的toolbar，不包含dnd
   */
  hideCardToolbar(): void;
  /**
   * 只显示卡片的toolbar，不包含dnd
   * @param event 鼠标事件，用于定位
   */
  showCardToolbar(event?: MouseEvent): void;
}

export type CardToolbarItemOptions =
  | {
      type: 'dnd';
      content?: string;
      title?: string;
    }
  | {
      type: 'separator';
      node?: NodeInterface;
    }
  | {
      type: 'delete' | 'maximize' | 'copy';
      disabled?: boolean;
      content?: string;
      title?: string;
    }
  | {
      type: 'more';
      disabled?: boolean;
      content?: string;
      title?: string | (() => string);
      items: Array<DropdownSwitchOptions | DropdownButtonOptions>;
    };

export interface CardEntry {
  prototype: CardInterface;
  new (options: CardOptions): CardInterface;
  /**
   * 是否能自动选中
   */
  autoSelected: boolean;
  /**
   * 是否能自动激活
   */
  autoActivate: boolean;
  /**
   * 是否能单独选中
   */
  singleSelectable: boolean;
  /**
   * 是否能协作，默认为true
   */
  collab: boolean;
  /**
   * 是否能聚焦
   */
  focus: boolean;
}

export interface CardInterface {
  /**
   * 卡片ID
   */
  readonly id: string;
  /**
   * 卡片名称
   */
  readonly name: string;
  /**
   * 卡片类型 block inline
   */
  readonly type: CardType;
  /**
   * 是否只读模式，没有engine
   */
  readonly readonly: boolean;
  /**
   * 卡片根节点
   */
  readonly root: NodeInterface;
  /**
   * 卡片工具栏
   */
  readonly toolbar: CardToolbarInterface;
  /**
   * 是否激活
   */
  readonly activated: boolean;
  /**
   * 是否选中
   */
  readonly selected: boolean;
  /**
   * 是否最大化
   */
  isMaximize: boolean;
  /**
   * 激活者，协同状态下有效
   */
  activatedByOther: string | false;
  /**
   * 选中者，协同状态下有效
   */
  selectedByOther: string | false;
  /**
   * 获取语言
   */
  getLang(): LanguageInterface;
  /**
   * 获取引擎，编辑引擎或者渲染引擎
   */
  getEngine(): EngineInterface | ContentViewInterface;
  /**
   * 获取Card内的 DOM 节点
   * @param selector
   */
  find(selector: string): NodeInterface;
  /**
   * 通过 data-card-element 的值，获取当前Card内的 DOM 节点
   * @param key key
   */
  findByKey(key: string): NodeInterface;
  /**
   * 获取卡片的中心节点
   */
  getCenter(): NodeInterface;
  /**
   * 判断节点是否属于卡片的中心节点
   * @param node 节点
   */
  isCenter(node: NodeInterface): boolean;
  /**
   * 判断节点是否在卡片的左右光标处
   * @param node 节点
   */
  isCursor(node: NodeInterface): boolean;
  /**
   * 判断节点是否在卡片的左光标处
   * @param node 节点
   */
  isLeftCursor(node: NodeInterface): boolean;
  /**
   * 判断节点是否在卡片的右光标处
   * @param node 节点
   */
  isRightCursor(node: NodeInterface): boolean;
  /**
   * 聚焦卡片
   * @param range 光标
   * @param toStart 是否开始位置
   */
  focus(range: RangeInterface, toStart?: boolean): void;
  /**
   * 聚焦上一个块级节点
   * @param range 光标
   * @param hasModify 没有节点时，是否创建一个空节点并聚焦
   */
  focusPrevBlock(range: RangeInterface, hasModify: boolean): void;
  /**
   * 聚焦下一个块级节点
   * @param range 光标
   * @param hasModify 没有节点时，是否创建一个空节点并聚焦
   */
  focusNextBlock(range: RangeInterface, hasModify: boolean): void;
  /**
   * 激活Card
   * @param activated 是否激活
   */
  activate(activated: boolean): void;
  /**
   * 选择Card
   * @param selected 是否选中
   */
  select(selected: boolean): void;
  /**
   * 选中状态变化时触发
   * @param selected 是否选中
   */
  onSelect?(selected: boolean): void;
  /**
   * 协同状态下，选中状态变化时触发
   * @param selected 是否选中
   * @param value { color:协同者颜色 , rgb:颜色rgb格式 }
   */
  onSelectByOther?(
    selected: boolean,
    value?: {
      color: string;
      rgb: string;
    },
  ): NodeInterface | void;
  /**
   * 激活状态变化时触发
   * @param activated 是否激活
   */
  onActivate?(activated: boolean): void;
  /**
   * 协同状态下，激活状态变化时触发
   * @param activated 是否激活
   * @param value { color:协同者颜色 , rgb:颜色rgb格式 }
   */
  onActivateByOther?(
    activated: boolean,
    value?: {
      color: string;
      rgb: string;
    },
  ): NodeInterface | void;
  /**
   * 设置卡片值
   * @param value 值
   */
  setValue(value: any): void;
  /**
   * 获取卡片值
   */
  getValue(): any;
  /**
   * 工具栏配置项
   */
  toolbarConfig?(): Array<CardToolbarItemOptions | ToolbarItemOptions>;
  /**
   * 最大化
   */
  maximize(): void;
  /**
   * 最小化
   */
  minimize(): void;
  /**
   * 渲染卡片
   */
  render(): NodeInterface | string | void;
  /**
   * 销毁
   */
  destroy?(): void;
  /**
   * 插入后触发
   */
  didInsert?(): void;
  /**
   * 更新后触发
   */
  didUpdate?(): void;
}

export interface CardModel {
  prototype: CardModelInterface;
  new (): CardModelInterface;
}

export interface CardModelInterface {
  readonly classes: { [k: string]: CardEntry };
  /**
   * 当前激活的卡片
   */
  readonly active: CardInterface | undefined;
  /**
   * 当前卡片实例长度
   */
  readonly length: number;
  /**
   * 设置引擎实例
   * @param engine 引擎实例
   */
  setEngine(engine: EngineInterface): void;
  /**
   * 设置内容渲染实例
   * @param engine 引擎实例
   */
  setContentView(contentView: ContentViewInterface): void;
  /**
   * 增加卡片
   * @param name 名称
   * @param clazz 类
   */
  add(name: string, clazz: CardEntry): void;
  /**
   * 遍历所有已创建的卡片
   * @param callback 回调函数
   */
  each(callback: (card: CardInterface) => boolean | void): void;
  /**
   * 查询父节点距离最近的卡片
   * @param selector 查询器
   */
  closest(selector: Node | NodeInterface): NodeInterface | undefined;
  /**
   * 根据选择器查找Card
   * @param selector 卡片ID，或者子节点
   */
  find(selector: NodeInterface | Node | string): CardInterface | undefined;
  /**
   * 根据选择器查找Block 类型 Card
   * @param selector 卡片ID，或者子节点
   */
  findBlock(selector: Node | NodeInterface): CardInterface | undefined;
  /**
   * 获取单个卡片
   * @param range 光标范围
   */
  getSingleCard(range: RangeInterface): CardInterface | undefined;
  /**
   * 获取选区选中一个节点时候的卡片
   * @param rang 选区
   */
  getSingleSelectedCard(rang: RangeInterface): CardInterface | undefined;
  /**
   * 插入卡片
   * @param range 选区
   * @param card 卡片
   */
  insertNode(range: RangeInterface, card: CardInterface): CardInterface;
  /**
   * 移除卡片节点
   * @param card 卡片
   */
  removeNode(card: CardInterface): void;
  /**
   * 将指定节点替换成等待创建的Card DOM 节点
   * @param node 节点
   * @param name 卡片名称
   * @param type 类型
   * @param value 卡片值
   */
  replaceNode(
    node: NodeInterface,
    name: string,
    type: CardType,
    value?: any,
  ): void;
  /**
   * 更新卡片重新渲染
   * @param card 卡片
   * @param value 值
   */
  updateNode(card: CardInterface, value: any): void;
  /**
   * 创建卡片
   * @param name 插件名称
   * @param type 类型
   * @param options 选项
   */
  create(
    name: string,
    type: CardType,
    options?: {
      value?: any;
      root?: NodeInterface;
    },
  ): CardInterface;
  /**
   * 渲染卡片
   * @param container 需要重新渲染包含卡片的节点，如果不传，则渲染全部待创建的卡片节点
   */
  render(container?: NodeInterface): void;
  /**
   * 释放卡片
   */
  gc(): void;
}

export enum ActiveTrigger {
  UPDATE_CARD = 'update_card',
  INSERT_CARD = 'insert_card',
  CUSTOM_SELECT = 'custom_select',
  CLICK = 'click',
  MOUSE_DOWN = 'mouse_down',
  MANUAL = 'manual',
}

export interface MaximizeInterface {
  /**
   * 恢复
   */
  restore(): void;
  /**
   * 最大化
   */
  maximize(): void;
}
