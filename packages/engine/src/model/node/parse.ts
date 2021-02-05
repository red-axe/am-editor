import { Selector, Context } from '../../types/node';
import {
  generateRandomIDForDescendant,
  getDocument,
  getWindow,
} from '../../utils';
import { isNode, isNodeEntry, isNodeList } from '../node';

/**
 * 根据选择器转换为 NodeList
 */
function domParser(
  selector: Selector,
  context: Context = getDocument(),
): NodeList | Array<Node> {
  if (!selector) {
    return [];
  }

  if (typeof selector === 'string') {
    const length = selector.length;
    if (selector.charAt(0) === '@') {
      selector = selector.substr(1);
    }
    //html 标签处理
    if (selector.length !== length || /<.+>/.test(selector)) {
      const isTr = selector.indexOf('<tr') === 0;
      const isTd = selector.indexOf('<td') === 0;
      selector = selector.trim().replace(/<!--[^>]*-->/g, '');
      /**
       * DOMParser 无法单独解析 tr、td 标签，需要补全 table 结构
       */
      if (isTr) {
        selector = '<table><tbody>'.concat(selector, '</tbody></table>');
      }

      if (isTd) {
        selector = '<table><tbody><tr>'.concat(
          selector,
          '</tr></tbody></table>',
        );
      }
      const container = getDocument().createElement('div');
      container.innerHTML = selector;
      generateRandomIDForDescendant(container);

      if (isTr) {
        const tbody = container.querySelector('tbody');
        return tbody ? tbody.childNodes : [];
      }

      if (isTd) {
        const tr = container.querySelector('tr');
        return tr ? tr.childNodes : [];
      }
      // 返回解析后的所有子级
      return container.childNodes;
    }
    //默认根据选择器查询所有
    return context.querySelectorAll(selector);
  }
  //类型为 NodeList ，node数组 直接返回
  if (isNodeList(selector) || Array.isArray(selector)) {
    return selector;
  }

  //类型为 DOMNode 类型
  if (isNodeEntry(selector)) {
    const nodes: Array<Node> = [];
    selector.each(node => {
      nodes.push(node);
    });
    return nodes;
  }
  // 片段
  if (
    isNode(selector) &&
    selector.nodeType === getWindow().Node.DOCUMENT_FRAGMENT_NODE
  ) {
    const nodes: Node[] = [];
    let node = selector.firstChild;
    while (node) {
      nodes.push(node);
      node = node.nextSibling;
    }

    return nodes;
  }
  // 其他
  return [selector as Node];
}

export default domParser;
