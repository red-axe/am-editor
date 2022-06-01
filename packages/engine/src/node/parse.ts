import { Selector, Context } from '../types/node';
import { getDocument } from '../utils/node';
import { isNode, isNodeEntry, isNodeList } from '../node/utils';

/**
 * 缓存selector创建的node
 */
const nodeCaches = new Map<string, Element>();
/**
 * 解析节点
 * @param selector 选择器
 * @param isSpecialText 是否为特殊文本比如 \u200b 0宽字符
 * @param context 上下文节点，默认使用 getDocument 获取document
 */
function domParser(
	selector: Selector,
	context?: Context | null | false,
): NodeList | Array<Node> {
	if (!selector) return [];
	//文本字符串
	if (typeof selector === 'string') {
		//特殊字符，或者html代码
		if (!context || /<[^>]+>/g.test(selector)) {
			const isTr = selector.indexOf('<tr') === 0;
			const isTd = selector.indexOf('<td') === 0;
			//替换注释
			selector = selector.trim().replace(/<!--[^>]*-->/g, '');

			const cacheNode = nodeCaches.get(selector);
			if (cacheNode) {
				if (isTr) {
					const tbody = cacheNode.querySelector('tbody');
					return tbody ? tbody.cloneNode(true).childNodes : [];
				}

				if (isTd) {
					const tr = cacheNode.querySelector('tr');
					return tr ? tr.cloneNode(true).childNodes : [];
				}
				return cacheNode.cloneNode(true).childNodes;
			}
			/**
			 * 无法单独解析 tr、td 标签，如果有tr、td标签这里需要补充 table 节点的结构
			 */
			if (isTr) {
				selector = '<table><tbody>'.concat(
					selector,
					'</tbody></table>',
				);
			}

			if (isTd) {
				selector = '<table><tbody><tr>'.concat(
					selector,
					'</tr></tbody></table>',
				);
			}
			//创建一个空节点，用来包裹需要生成的节点
			const container = getDocument().createElement('div');
			container.innerHTML = selector;
			nodeCaches.set(selector, container.cloneNode(true) as Element);
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
		selector.each((node) => {
			nodes.push(node);
		});
		return nodes;
	}
	// 片段
	if (isNode(selector) && selector.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
		const nodes: Node[] = [];
		for (const child of selector.childNodes) {
			nodes.push(child);
		}
		return nodes;
	}
	// 其他
	return [selector as Node];
}

export default domParser;
