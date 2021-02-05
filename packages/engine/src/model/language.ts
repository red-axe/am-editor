import { merge } from 'lodash';
import { LanguageInterface } from '../types/language';

class Language implements LanguageInterface {
  private data: {} = {};

  constructor(data: {} = {}) {
    this.data = data;
  }

  add(data: {}) {
    this.data = merge(this.data, data);
  }

  get(...keys: Array<string>): string | {} {
    const get = (start: number = 0, language: {}): string | {} => {
      for (let i = start; i < keys.length; i++) {
        const value = language[keys[i]];
        if (typeof value === 'object') {
          return get(i + 1, value);
        }
        return value || '';
      }
      return language;
    };
    return get(0, this.data);
  }
}

export default Language;
