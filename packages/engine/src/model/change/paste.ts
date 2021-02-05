import tinycolor2 from 'tinycolor2';
import $ from '../node';
import { NodeInterface } from '../..';
import {
  CARD_SELECTOR,
  READY_CARD_KEY,
  READY_CARD_SELECTOR,
} from '../../constants/card';
import { ROOT_SELECTOR } from '../../constants/root';
import Parser from '../../parser';
import { EngineInterface } from '../../types/engine';
import {
  addListStartNumber,
  brToParagraph,
  generateRandomIDForDescendant,
  normalize,
  removeMinusStyle,
  removeSideBr,
  setNode,
  unwrapNode,
} from '../../utils';

export default class Paste {
  protected source: string;
  protected engine: EngineInterface;

  constructor(source: string, engine: EngineInterface) {
    this.source = source;
    this.engine = engine;
  }

  parser() {
    const schema = this.engine.schema.clone();
    const conversion = this.engine.conversion.clone();
    schema.add([
      'pre',
      {
        span: {
          'data-type': '*',
          style: {
            'font-size': '@length',
          },
        },
      },
      {
        p: {
          'data-type': '*',
        },
      },
      {
        mark: {
          id: '*',
        },
      },
      {
        block: {
          id: '*',
        },
      },
    ]);
    Object.keys(this.engine.plugin.components).forEach(name => {
      const plugin = this.engine.plugin.components[name];
      if (plugin.pasteSchema) plugin.pasteSchema(schema);
    });
    return new Parser(this.source, this.engine, undefined, root => {
      Object.keys(this.engine.plugin.components).forEach(name => {
        const plugin = this.engine.plugin.components[name];
        if (plugin.pasteOrigin) plugin.pasteOrigin(root);
      });
    }).toDOM(schema.getValue(), conversion.getValue());
  }

  getDefaultStyle() {
    const defaultStyle = [
      {
        color: tinycolor2(this.engine.container.css('color')).toHex(),
      },
      {
        'background-color': tinycolor2('white').toHex(),
      },
      {
        'font-size': this.engine.container.css('font-size'),
      },
    ];
    // 表格里的子编辑器，需要添加主编辑器的颜色
    const card = this.engine.container.closest(CARD_SELECTOR);
    if (card.length > 0) {
      const container = card.closest(ROOT_SELECTOR);
      defaultStyle.push({
        color: tinycolor2(container.css('color')).toHex(),
      });
      defaultStyle.push({
        'background-color': tinycolor2(
          container.css('background-color'),
        ).toHex(),
      });
    }
    return defaultStyle;
  }

  commonNormalize(fragment: DocumentFragment) {
    const defaultStyle = this.getDefaultStyle();
    // 第一轮预处理，主要处理 span 节点
    let nodes = $(fragment).allChildren();
    nodes.forEach(child => {
      const node = $(child);
      // 跳过Card
      if (node.isCard()) {
        return;
      }
      // 删除与默认样式一样的 inline 样式
      if (node.isElement()) {
        defaultStyle.forEach(style => {
          const key = Object.keys(style)[0];
          const defaultValue = style[key];
          let value = node.get<HTMLElement>()?.style[key];
          if (value) {
            if (/color$/.test(key)) {
              value = tinycolor2(value).toHex();
            }
            if (value === defaultValue) {
              node.css(key, '');
            }
          }
        });
      }
      removeMinusStyle(node, 'text-indent');
      if (['ol', 'ul'].includes(node.name || '')) {
        node.css('padding-left', '');
      }
      // 删除空 style 属性
      if (node.isElement()) {
        if (!node.attr('style')) {
          node.removeAttr('style');
        }
      }
      // 删除空 span
      if (
        node.name === 'span' &&
        Object.keys(node.attr()).length === 0 &&
        Object.keys(node.css()).length === 0 &&
        (node.text().trim() === '' ||
          (node.first() && (node.first()!.isMark() || node.first()!.isBlock())))
      ) {
        unwrapNode(node);
        return;
      }

      // br 换行改成正常段落
      if (node.isBlock()) {
        brToParagraph(node);
      }
    });
    // 第二轮处理
    nodes = $(fragment).allChildren();
    nodes.forEach(child => {
      const node = $(child);
      // 跳过已被删除的节点
      if (!node.parent()) {
        return;
      }
      // 删除 google docs 根节点
      // <b style="font-weight:normal;" id="docs-internal-guid-e0280780-7fff-85c2-f58a-6e615d93f1f2">
      if (/^docs-internal-guid-/.test(node.attr('id'))) {
        unwrapNode(node);
        return;
      }
      // 跳过Section
      if (node.attr(READY_CARD_KEY)) {
        return;
      }
      // 删除零高度的空行
      if (
        node.isBlock() &&
        node.attr('data-type') !== 'p' &&
        !node.isVoid() &&
        !node.isSolid() &&
        node.html() === ''
      ) {
        node.remove();
        return;
      }
      // 段落
      if (node.attr('data-type') === 'p') {
        node.removeAttr('data-type');
      }
      // 补齐 ul 或 ol
      if (
        node.name === 'li' &&
        ['ol', 'ul'].indexOf(node.parent()?.name || '') < 0
      ) {
        const ul = $('<ul />');
        node.before(ul);
        ul.append(node);
        return;
      }
      // 补齐 li
      if (
        ['ol', 'ul'].indexOf(node.name || '') >= 0 &&
        ['ol', 'ul'].indexOf(node.parent()?.name || '') >= 0
      ) {
        const li = $('<li />');
        node.before(li);
        li.append(node);
        return;
      }
      // <li>two<ol><li>three</li></ol>four</li>
      if (
        ['ol', 'ul'].indexOf(node.name || '') >= 0 &&
        node.parent()?.name === 'li' &&
        (node.prev() || node.next())
      ) {
        const parent = node.parent();
        let li: NodeInterface | null;
        const isCustomizeList = parent?.parent()?.hasClass('data-list');
        parent?.children().each(child => {
          const node = $(child);
          if (node.isEmptyWithTrim()) {
            return;
          }
          const isList = ['ol', 'ul'].indexOf(node.name || '') >= 0;
          if (!li || isList) {
            li = isCustomizeList
              ? $('<li class="data-list-node" />')
              : $('<li />');
            parent.before(li);
          }
          li.append(child);
          if (isList) {
            li = null;
          }
        });
        parent?.remove();
        return;
      }
      // p 改成 li
      if (
        node.name === 'p' &&
        ['ol', 'ul'].indexOf(node.parent()?.name || '') >= 0
      ) {
        setNode(node, $('<li />'));
        return;
      }
      // 处理空 Block
      if (node.isBlock() && !node.isVoid() && node.html().trim() === '') {
        // <p></p> to <p><br /></p>
        if (node.isHeading() || node.name === 'li') {
          node.html('<br />');
        }
      }
      // <li><p>foo</p></li>
      if (node.isHeading() && node.parent()?.name === 'li') {
        // <li><p><br /></p></li>
        if (node.children().length === 1 && node.first()?.name === 'br') {
          // nothing
        } else {
          node.after('<br />');
        }
        unwrapNode(node);
        return;
      }
      // 移除两边的 BR
      removeSideBr(node);
    });
  }

  normalize() {
    const fragment = this.parser();
    this.commonNormalize(fragment);
    const range = this.engine.change.getRange();
    const root = range.commonAncestorNode;
    // 光标在行内代码里
    if (root.closest('code').length > 0) {
      this.removeElementNodes($(fragment));
      return fragment;
    }
    if (root.isText() && range.startContainer === range.endContainer) {
      const text = root[0].nodeValue;
      const leftText = text?.substr(0, range.startOffset);
      const rightText = text?.substr(range.endOffset);
      // 光标在 [text](|) 里
      if (/\[.*?\]\($/.test(leftText || '') && /^\)/.test(rightText || '')) {
        this.removeElementNodes($(fragment));
        return fragment;
      }
    }

    let nodes = $(fragment).allChildren();
    nodes.forEach(child => {
      const node = $(child);
      Object.keys(this.engine.plugin.components).forEach(name => {
        const plugin = this.engine.plugin.components[name];
        if (plugin.pasteEach) plugin.pasteEach(node);
      });
    });
    nodes = $(fragment).allChildren();
    nodes.forEach(child => {
      const node = $(child);
      // 删除包含Section的 pre 标签
      if (node.name === 'pre' && node.find(READY_CARD_SELECTOR).length > 0) {
        unwrapNode(node);
      }
    });
    normalize($(fragment));
    fragment.normalize();
    nodes = $(fragment).allChildren();
    nodes.forEach(child => {
      const node = $(child);
      if (['ol', 'ul'].includes(node.name || '')) {
        addListStartNumber(node);
      }
    });
    generateRandomIDForDescendant(fragment, true);
    return fragment;
  }

  removeElementNodes(fragment: NodeInterface) {
    const nodes = fragment.allChildren();
    nodes.forEach(child => {
      const node = $(child);
      if (node.isElement()) {
        unwrapNode(node);
      }
    });
  }
}
