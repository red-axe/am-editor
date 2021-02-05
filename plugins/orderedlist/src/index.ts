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
        ol: {
          start: '@number',
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
    return !node.hasClass('data-list') && node.name === 'ol';
  }

  execute(start: number = 1) {
    if (!this.engine) return;
    const { change } = this.engine;
    change.separateBlocks();
    const range = change.getRange();
    const activeBlocks = range.getActiveBlocks();
    if (activeBlocks) {
      const bookmark = range.createBookmark();
      const isList = isAllListedByType(activeBlocks, 'ol');
      if (isList) {
        cancelList(activeBlocks);
      } else {
        this.toNormal(activeBlocks, 'ol', start);
      }
      if (bookmark) range.moveToBookmark(bookmark);
      change.select(range);
      change.mergeAdjacentList();
    }
  }

  hotkey() {
    return this.options.hotkey || 'mod+shift+7';
  }
}
