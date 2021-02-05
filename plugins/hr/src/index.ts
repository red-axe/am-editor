import {
  $,
  Plugin,
  NodeInterface,
  CARD_KEY,
  CARD_VALUE_KEY,
} from '@aomao/engine';
import HrEntry from './entry';
const CARD_NAME = 'hr';

export type Options = {
  hotkey?: string | Array<string>;
};
export default class extends Plugin<Options> {
  execute() {
    if (!this.engine) return;
    const { change } = this.engine;
    change.insertCard(CARD_NAME);
  }

  hotkey() {
    return this.options.hotkey || 'mod+shift+e';
  }

  parseHtml(root: NodeInterface) {
    root.find(`[${CARD_KEY}=${CARD_NAME}`).each(hrNode => {
      const node = $(hrNode);
      const hr = node.find('hr');
      hr.css({
        'background-color': '#e8e8e8',
        border: '1px solid transparent',
        margin: '18px 0',
      });
      node.removeAttr(CARD_VALUE_KEY);
      node.empty();
      node.append(hr);
    });
  }
}
export { HrEntry };
