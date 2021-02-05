import { validUrl } from '../utils';
// 对 class 进行过滤
const processClassName = (
  props: { [k: string]: string },
  key: string,
  compareFunc: (name: string) => boolean,
) => {
  if (key === 'class') {
    const classList = props[key].split(' ');
    const newClassList: Array<string> = [];
    classList.forEach(className => {
      if (compareFunc(className)) {
        newClassList.push(className);
      }
    });

    if (newClassList.length > 0) {
      props[key] = newClassList.join(' ');
    } else {
      delete props[key];
    }
    return;
  }
};
// 过滤一个属性或样式
const filterProp = (props: { [k: string]: string }, rule: any, key: string) => {
  if (!rule[key]) {
    delete props[key];
    return;
  }
  // 内置规则
  if (typeof rule[key] === 'string' && rule[key].charAt(0) === '@') {
    switch (rule[key]) {
      case '@number':
        rule[key] = /^-?\d+(\.\d+)?$/;
        break;

      case '@length':
        rule[key] = /^-?\d+(\.\d+)?(\w*|%)$/;
        break;

      case '@color':
        rule[key] = /^(rgb(.+?)|#\w{3,6}|\w+)$/i;
        break;

      case '@url':
        rule[key] = validUrl;
        break;

      default:
        break;
    }
  }
  // 字符串
  if (typeof rule[key] === 'string') {
    if (rule[key] === '*') {
      return;
    }

    if (key === 'class') {
      processClassName(props, key, className => {
        return rule[key] === className;
      });
      return;
    }

    if (rule[key] !== props[key]) {
      delete props[key];
    }
    return;
  }
  // 数组
  if (Array.isArray(rule[key])) {
    if (key === 'class') {
      processClassName(props, key, className => {
        return rule[key].indexOf(className) >= 0;
      });
      return;
    }

    if (rule[key].indexOf(props[key]) < 0) {
      delete props[key];
    }
    return;
  }
  // 正则表达式
  if (typeof rule[key] === 'object' && typeof rule[key].test === 'function') {
    if (key === 'class') {
      processClassName(props, key, className => {
        return rule[key].test(className);
      });
      return;
    }

    if (!rule[key].test(props[key])) {
      delete props[key];
    }
    return;
  }
  // 自定义函数
  if (typeof rule[key] === 'function') {
    if (!rule[key](props[key])) {
      delete props[key];
    }
    return;
  }
}; // 过滤标签、属性、样式
// return true：过滤标签
// return false：不过滤标签

export default (
  rules: any,
  name: string,
  attrs: { [k: string]: string },
  styles: { [k: string]: string },
) => {
  if (!rules) {
    return false;
  }

  if (['anchor', 'focus', 'cursor', 'card'].indexOf(name) >= 0) {
    return false;
  }

  if (!rules[name]) {
    return true;
  }

  if (!attrs) {
    return false;
  }

  Object.keys(attrs).forEach(function(key) {
    filterProp(attrs, rules[name], key);
  });
  const rulesStyle = rules[name].style || {};
  Object.keys(styles).forEach(function(key) {
    filterProp(styles, rulesStyle, key);
  });
  return false;
};
