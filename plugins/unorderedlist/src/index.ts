import {
  NodeInterface,
  List,
  isAllListedByType,
  cancelList,
} from '@aomao/engine';

export type Options = {
  hotkey?: string | Array<string>;
};

export default class extends List<Options> {
  schema(): any {
    return [
      {
        ul: {
          'data-indent': '@number',
          'data-id': '*',
        },
      },
      {
        li: {
          'data-id': '*',
        },
      },
    ];
  }

  isCurentList(node: NodeInterface) {
    return !node.hasClass('data-list') && node.name === 'ul';
  }

  execute() {
    if (!this.engine) return;
    const { change } = this.engine;
    change.separateBlocks();
    const range = change.getRange();
    const activeBlocks = range.getActiveBlocks();
    if (activeBlocks) {
      const bookmark = range.createBookmark();
      const isList = isAllListedByType(activeBlocks);
      if (isList) {
        cancelList(activeBlocks);
      } else {
        this.toNormal(activeBlocks, 'ul');
      }
      if (bookmark) range.moveToBookmark(bookmark);
      change.select(range);
      change.mergeAdjacentList();
    }
  }

  hotkey() {
    return this.options.hotkey || 'mod+shift+8';
  }
}
