import {
  $,
  NodeInterface,
  List,
  isAllListedByType,
  cancelList,
  CARD_KEY,
} from '@aomao/engine';
import Checkbox from './checkbox';
import './index.css';

export type Options = {
  hotkey?: string | Array<string>;
};

export default class extends List<Options> {
  schema(): any {
    const rules = super.schema();
    rules[0].ul?.class.push('data-list-task');
    return rules;
  }

  isCurentList(node: NodeInterface) {
    if (node.name === 'li')
      return (
        node.hasClass('data-list-node') &&
        node.first()?.attr(CARD_KEY) === 'checkbox'
      );
    return node.hasClass('data-list') && node.hasClass('data-list-task');
  }

  execute(value?: any) {
    if (!this.engine) return;
    const { change, card } = this.engine;
    change.separateBlocks();
    const range = change.getRange();
    const activeBlocks = range.getActiveBlocks();
    if (activeBlocks) {
      const bookmark = range.createBookmark();
      const isList = isAllListedByType(activeBlocks, 'ul', 'checkbox');
      if (isList) {
        cancelList(activeBlocks);
      } else {
        const listBlocks = this.toCustomize(activeBlocks, 'checkbox', value);
        listBlocks.forEach(list => {
          list.addClass('data-list-task');
        });
      }
      if (bookmark) range.moveToBookmark(bookmark);
      if (
        range.collapsed &&
        range.startContainer.nodeType === Node.ELEMENT_NODE &&
        range.startContainer.childNodes.length === 0 &&
        range.startContainer.parentNode
      ) {
        const brNode = document.createElement('br');
        range.startNode.before(brNode);
        range.startContainer.parentNode.removeChild(range.startContainer);
        range.select(brNode);
        range.collapse(false);
      }
      change.select(range);
      change.mergeAdjacentList();
    }
  }

  hotkey() {
    return this.options.hotkey || 'mod+shift+9';
  }

  parseHtml(root: NodeInterface) {
    root.find(`[${CARD_KEY}=checkbox`).each(checkboxNode => {
      const node = $(checkboxNode);
      const checkbox = $(
        '<span>'.concat(
          'checked' === node.find('input').attr('checked') ? '✅' : '🔲',
          '<span/>',
        ),
      );
      checkbox.css({
        margin: '3px 0.5ex',
        'vertical-align': 'middle',
        width: '16px',
        height: '16px',
        color: 'color: rgba(0, 0, 0, 0.65)',
      });
      node.empty();
      node.append(checkbox);
    });
  }
}
export { Checkbox };
