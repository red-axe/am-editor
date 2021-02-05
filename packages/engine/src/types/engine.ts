import { EventInterface, NodeInterface, Selector, EventListener } from './node';
import { ChangeInterface } from './change';
import { OTInterface } from './ot';
import { SchemaInterface } from './schema';
import { ConversionInterface } from './conversion';
import { HistoryInterface } from './history';
import { PluginInterface, PluginModelInterface } from './plugin';
import { CommandInterface } from './command';
import { CardModelInterface } from './card';
import { ClipboardInterface } from './clipboard';
import { LanguageInterface } from './language';

export type EngineOptions = {
  lang?: string;
  className?: string;
  tabIndex?: number;
  root?: Node;
  scrollNode?: Node;
  plugin?: { [k: string]: {} };
};

export interface EngineEntry {
  /**
   * 构造函数
   */
  new (selector: Selector, options?: EngineOptions): EngineInterface;
  plugin: PluginModelInterface;
  card: CardModelInterface;
}

export interface EngineInterface {
  /**
   * 滚动条节点
   */
  scrollNode: NodeInterface | null;
  /**
   * 是否只读
   */
  readonly: boolean;
  /**
   * 语言
   */
  language: LanguageInterface;
  /**
   * 编辑器渲染节点
   */
  container: NodeInterface;
  /**
   * 编辑器根节点，默认为 document.body
   */
  root: NodeInterface;
  /**
   * 卡片
   */
  card: CardModelInterface;
  /**
   * 插件
   */
  plugin: PluginModelInterface;
  /**
   * 编辑器更改
   */
  change: ChangeInterface;
  /**
   * 事件
   */
  event: EventInterface;
  /**
   * 编辑器命令
   */
  command: CommandInterface;
  /**
   * 协同编辑
   */
  ot: OTInterface;
  /**
   * 标签过滤规则
   */
  schema: SchemaInterface;
  /**
   * 标签转换规则
   */
  conversion: ConversionInterface;
  /**
   * 历史记录
   */
  history: HistoryInterface;
  /**
   * 剪切板
   */
  clipboard: ClipboardInterface;
  /**
   * 绑定事件
   * @param eventType 事件类型
   * @param listener 事件回调
   * @param rewrite 是否重写
   */
  on(eventType: string, listener: EventListener, rewrite?: boolean): void;
  /**
   * 移除绑定事件
   * @param eventType 事件类型
   * @param listener 事件回调
   */
  off(eventType: string, listener: EventListener): void;
  /**
   * 用户是否有更改
   */
  hasUserChanged(): boolean;
  /**
   * 重置用户更改变量
   */
  resetUserChange(): void;
  /**
   * 标志为用户更改
   */
  setUserChanged(): void;
  /**
   * 聚焦到编辑器
   */
  focus(): void;
  /**
   * 是否是子编辑器
   */
  isSub(): boolean;
  /**
   * 是否聚焦到编辑器
   */
  isFocus(): boolean;
  /**
   * 获取编辑器值
   * @param ignoreCursor 是否包含光标位置信息
   */
  getValue(ignoreCursor?: boolean): string;
  /**
   * 获取编辑器的html
   */
  getHtml(): string;
  /**
   * 设置编辑器值
   * @param value 值
   */
  setValue(value: string): EngineInterface;
  /**
   * 设置json格式值，主要用于协同
   * @param value 值
   */
  setJsonValue(value: Array<any>): EngineInterface;
  /**
   * 显示成功的信息
   * @param message 信息
   */
  messageSuccess(message: string): void;
  /**
   * 显示错误信息
   * @param error 错误信息
   */
  messageError(error: string): void;
  /**
   * 销毁
   */
  destroy(): void;
}
