import $ from '../../model/node';
import { ChangeInterface } from '../../types/change';
// shift 键 + 回车键
export default (change: ChangeInterface, e: KeyboardEvent) => {
  e.preventDefault();
  const range = change.getRange();
  const br = $('<br />');
  change.insertInline(br);
  // Chrome 问题：<h1>foo<br /><cursor /></h1> 时候需要再插入一个 br，否则没有换行效果
  if (range.isBlockLastOffset('end')) {
    if (!br.next() || br.next()?.name !== 'br') {
      br.after('<br />');
    }
  }
};
