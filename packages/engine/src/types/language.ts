export interface LanguageInterface {
  add(data: {}): void;
  get(...keys: Array<string>): string | {};
}
