import { NodeInterface } from './node';

export interface ListInterface {
  /**
   * 判断节点是否是当前插件所需的list节点
   * @param node 节点
   */
  isCurentList(node: NodeInterface): boolean;
  /**
   * 转换为正常的列表
   * @param blocks 节点集合
   * @param tagName 列表标签
   * @param start 有序列表序号
   */
  toNormal(
    blocks: Array<NodeInterface>,
    tagName: 'ul' | 'ol',
    start?: number,
  ): Array<NodeInterface>;
  /**
   * 转换为自定义列表
   * @param blocks 节点集合
   * @param inlineCard inline 卡片名称
   * @param value 卡片值
   */
  toCustomize(
    blocks: Array<NodeInterface>,
    inlineCard: string,
    value?: any,
  ): Array<NodeInterface>;
}
