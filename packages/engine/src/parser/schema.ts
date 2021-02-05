import { BLOCK_TAG_MAP, INLINE_TAG_MAP, MARK_TAG_MAP } from '../constants/tags';
import cloneDeep from 'lodash/cloneDeep';

const mergeProps = (
  props: { [k: string]: any },
  otherProps: { [k: string]: any },
) => {
  // merge attributes
  Object.keys(otherProps).forEach(key => {
    if (key !== 'style') {
      props[key] = otherProps[key];
    }
  });
  // merge styles
  if (otherProps.style) {
    if (!props.style) {
      props.style = {};
    }
    Object.keys(otherProps.style).forEach(key => {
      props.style[key] = otherProps.style[key];
    });
  }
};

const addOne = (data: any, rule: string | {}) => {
  let tagName: string;

  if (typeof rule === 'string') {
    tagName = rule;
    rule = {};
    rule[tagName] = {};
  } else {
    tagName = Object.keys(rule)[0];
  }
  // 非常重要！！！
  // div 标签有特殊用途，不允许设置白名单，可以用于Card修饰元素
  if (tagName === 'div') {
    throw 'setting div is not allowed';
  }

  if (BLOCK_TAG_MAP[tagName]) {
    data.blocks.push(rule);
    return;
  }

  if (INLINE_TAG_MAP[tagName]) {
    data.inlines.push(rule);
    return;
  }

  if (MARK_TAG_MAP[tagName]) {
    data.marks.push(rule);
  }

  if (['block', 'inline', 'mark'].indexOf(tagName) >= 0) {
    if (!data.globals[tagName]) {
      data.globals[tagName] = {};
      mergeProps(data.globals[tagName], rule[tagName]);
    }
  }
};

class Schema {
  data: { blocks: any[]; inlines: any[]; marks: any[]; globals: {} };

  constructor() {
    this.data = {
      blocks: [],
      inlines: [],
      marks: [],
      globals: {},
    };
  }

  add(rules: any) {
    rules = cloneDeep(rules);
    if (!Array.isArray(rules)) {
      rules = [rules];
    }

    rules.forEach((rule: any) => {
      addOne(this.data, rule);
    });
  }

  clone() {
    const dupData = cloneDeep(this.data);
    const dupSchema = new Schema();
    dupSchema.data = dupData;
    return dupSchema;
  }

  getValue() {
    // merge global props to each tag
    Object.keys(this.data.globals).forEach(type => {
      const props = this.data.globals[type];
      this.data[type + 's'].forEach((rule: any) => {
        const name = Object.keys(rule)[0];
        mergeProps(rule[name], props);
      });
    });
    // merge same tag props
    const map = {};
    Object.keys(this.data).forEach(type => {
      if (type === 'globals') {
        return;
      }

      const rules = this.data[type];
      rules.forEach((rule: {}) => {
        const tagName = Object.keys(rule)[0];
        const props = rule[tagName];

        if (map[tagName]) {
          mergeProps(map[tagName], props);
        } else {
          map[tagName] = props;
        }
      });
    });
    return map;
  }
}
export default Schema;
// data 示例

/**
{
  blocks : [
    { h1: {} },
    { h2: {} },
    { h3: {} },
    {
      p: {
        style: {
          'text-align': ['left', 'right', 'center', 'justify'],
        },
      },
    },
  ],
  marks : [
    { strong: {} },
    { em: {} },
    { u: {} },
    {
      span, {
        style: {
          color: '@color',
          'background-color': '@color',
        },
      },
    }],
  ],
}
*/
