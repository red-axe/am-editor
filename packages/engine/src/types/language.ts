export interface LanguageInterface {
	add(data: {}): void;
	get<T extends string | {}>(...keys: Array<string>): T;
}
