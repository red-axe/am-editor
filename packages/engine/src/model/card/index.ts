import $, { isNode, isNodeEntry } from '../node';
import {
  CARD_ELEMENT_KEY,
  CARD_KEY,
  CARD_SELECTOR,
  CARD_TYPE_KEY,
  CARD_VALUE_KEY,
  READY_CARD_KEY,
  READY_CARD_SELECTOR,
} from '../../constants/card';
import {
  CardEntry,
  CardInterface,
  CardModelInterface,
  CardType,
} from '../../types/card';
import { NodeInterface } from '../../types/node';
import { RangeInterface } from '../../types/range';
import { EngineInterface } from '../../types/engine';
import { encodeCardValue, transformCustomTags } from '../../utils';
import {
  deleteContent,
  insertBlock,
  insertInline,
  unwrapBlock,
} from '../change/utils';
import { ContentViewInterface } from '../../types/content-view';

class CardModel implements CardModelInterface {
  classes: {
    [k: string]: CardEntry;
  };
  private components: Array<CardInterface>;
  private engine?: EngineInterface;
  private contentView?: ContentViewInterface;

  constructor(engine?: EngineInterface) {
    this.classes = {};
    this.components = [];
    this.engine = engine;
  }

  get active() {
    return this.components.find(component => component.activated);
  }

  get length() {
    return this.components.length;
  }

  setEngine(engine: EngineInterface) {
    this.engine = engine;
  }

  setContentView(contentView: ContentViewInterface) {
    this.contentView = contentView;
  }

  add(name: string, clazz: CardEntry) {
    this.classes[name] = clazz;
  }

  each(
    callback: (card: CardInterface, index?: number) => boolean | void,
  ): void {
    this.components.every((card, index) => {
      if (callback && callback(card, index) === false) return false;
      return true;
    });
  }

  closest(selector: Node | NodeInterface): NodeInterface | undefined {
    if (isNode(selector)) selector = $(selector);
    if (isNodeEntry(selector) && !selector.isCard()) {
      const card = selector.closest(CARD_SELECTOR, (node: Node) => {
        if (node && $(node).isRoot()) {
          return;
        }
        return node.parentNode || undefined;
      });
      if (!card || card.length === 0) return;
      selector = card;
    }
    return selector;
  }

  find(selector: string | Node | NodeInterface): CardInterface | undefined {
    if (typeof selector !== 'string') {
      const cardNode = this.closest(selector);
      if (!cardNode) return;
      selector = cardNode;
    }
    const cards = this.components.filter(item => {
      if (typeof selector === 'string') return item.id === selector;
      return item.root.equal(selector);
    });
    if (cards.length === 0) return;

    return cards[0];
  }

  findBlock(selector: Node | NodeInterface): CardInterface | undefined {
    if (isNode(selector)) selector = $(selector);
    if (!selector.get()) return;
    const parent = selector.parent();
    if (!parent) return;
    const card = this.find(parent);
    if (!card) return;
    if (card.type === CardType.BLOCK) return card;
    return this.findBlock(card.root);
  }

  private remove(card: CardInterface): void {
    this.each((c, index) => {
      if (c.root.equal(card.root)) {
        this.components.splice(index!, 1);
        return false;
      }
      return;
    });
  }

  getSingleCard(range: RangeInterface) {
    let card = this.find(range.commonAncestorNode);
    if (!card) card = this.getSingleSelectedCard(range);
    return card;
  }

  getSingleSelectedCard(range: RangeInterface) {
    const elements = range.findElementsInSimpleRange();
    let node = elements[0];
    if (elements.length === 1 && node) {
      const domNode = $(node);
      if (domNode.isCard()) {
        return this.find(domNode);
      }
    }
    return;
  }

  // 插入Card
  insertNode(range: RangeInterface, card: CardInterface) {
    const isInline = card.type === 'inline';
    // 范围为折叠状态时先删除内容
    if (!range.collapsed) {
      deleteContent(range);
    }
    this.gc();
    // 插入新 Card
    if (isInline) {
      insertInline(range, card.root);
    } else {
      insertBlock(range, card.root, true);
    }
    this.components.push(card);
    card.focus(range);
    // 矫正错误 HTML 结构
    if (
      ['ol', 'ul', 'blockquote'].indexOf(card.root.parent()?.name || '') >= 0
    ) {
      unwrapBlock(range, card.root.parent()!);
    }
    const result = card.render();
    if (result !== undefined) {
      card.getCenter().append(result);
    }
    if (card.didInsert) {
      card.didInsert();
    }
    return card;
  }

  // 移除Card
  removeNode(card: CardInterface) {
    if (card.destroy) card.destroy();
    if (card.type === CardType.BLOCK && this.engine) {
      this.engine.readonly = false;
    }
    this.remove(card);
    card.root.remove();
  }

  // 更新Card
  updateNode(card: CardInterface, value: any) {
    if (card.destroy) card.destroy();
    const container = card.findByKey('center');
    container.empty();
    card.setValue(value);
    const result = card.render();
    if (result !== undefined) {
      card.getCenter().append(result);
    }
    if (card.didUpdate) {
      card.didUpdate();
    }
  }
  // 将指定节点替换成等待创建的Card DOM 节点
  replaceNode(node: NodeInterface, name: string, type: CardType, value?: any) {
    const clazz = this.classes[name];
    if (!clazz) throw ''.concat(name, ': This card does not exist');
    value = encodeCardValue(value);
    const cardNode = transformCustomTags(
      `<card type="${type}" name="${name}" value="${value}"></card>`,
    );
    const readyCard = $(cardNode);
    node.before(readyCard);
    readyCard.append(node);
  }

  // 创建Card DOM 节点
  create(
    name: string,
    type: CardType,
    options?: {
      value?: any;
      root?: NodeInterface;
    },
  ): CardInterface {
    const clazz = this.classes[name];
    if (!clazz) throw ''.concat(name, ': This card does not exist');

    if (['inline', 'block'].indexOf(type) < 0) {
      throw ''.concat(name, ': the type of card must be "inline", "block"');
    }
    if (options?.root) options.root.empty();
    const component = new clazz({
      engine: this.engine,
      contentView: this.contentView,
      type,
      value: options?.value,
      root: options?.root,
    });

    component.root.attr(CARD_TYPE_KEY, type);
    component.root.attr(CARD_KEY, name);
    //如果没有指定是否能聚集，那么当card不是只读的时候就可以聚焦
    const hasFocus =
      clazz.focus !== undefined ? clazz.focus : !component.readonly;
    const tagName = type === CardType.INLINE ? 'span' : 'div';
    //center
    const center = $(`<${tagName} />`);
    center.attr(CARD_ELEMENT_KEY, 'center');

    if (hasFocus) {
      center.attr('contenteditable', 'false');
    } else {
      component.root.attr('contenteditable', 'false');
    }
    //body
    const body = $(
      '<'.concat(tagName, ' ').concat(CARD_ELEMENT_KEY, '="body" />'),
    );
    //可以聚焦的情况下，card左右两边添加光标位置
    if (hasFocus) {
      //left
      const left = $(
        '<span '.concat(CARD_ELEMENT_KEY, '="left">&#8203;</span>'),
      );
      //right
      const right = $(
        '<span '.concat(CARD_ELEMENT_KEY, '="right">&#8203;</span>'),
      );
      body.append(left);
      body.append(center);
      body.append(right);
    } else {
      body.append(center);
    }

    component.root.append(body);
    component.toolbar.create();
    return component;
  }

  /**
   * 渲染
   * @param container 需要重新渲染包含卡片的节点，如果不传，则渲染全部待创建的卡片节点
   */
  render(container?: NodeInterface) {
    if (!container && !this.engine && !this.contentView)
      throw ''.concat('Engine Or ContentView does not exist');
    const cards = container
      ? container.isCard()
        ? container
        : container.find(CARD_SELECTOR)
      : (this.engine || this.contentView)!.container.find(READY_CARD_SELECTOR);
    this.gc();
    cards.each(node => {
      const cardNode = $(node);
      const readyKey = cardNode.attr(READY_CARD_KEY);
      const key = cardNode.attr(CARD_KEY);
      const name = readyKey || key;
      if (this.classes[name]) {
        const type = cardNode.attr(CARD_TYPE_KEY);
        const value = cardNode.attr(CARD_VALUE_KEY);
        let card: CardInterface | undefined;
        if (key) {
          card = this.find(cardNode);
          if (card) {
            if (card.destroy) card.destroy();
            this.remove(card);
          }
        }
        //ready_card_key 待创建的需要重新生成节点，并替换当前待创建节点
        card = this.create(name, type as CardType, {
          value,
          root: key ? cardNode : undefined,
        });
        if (readyKey) cardNode.replaceWith(card.root);
        this.components.push(card);
        // 重新渲染
        const result = card.render();
        if (result !== undefined) {
          card.getCenter().append(result);
        }
      }
    });
  }

  gc() {
    for (let i = 0; i < this.components.length; i++) {
      const component = this.components[i];
      if (!component.root[0] || component.root.closest('body').length === 0) {
        if (component.destroy) component.destroy();
        this.components.splice(i, 1);
        i--;
      }
    }
  }
}

export default CardModel;
