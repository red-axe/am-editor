export interface SchemaInterface {
  data: { blocks: any[]; inlines: any[]; marks: any[]; globals: {} };
  add(rules: any): void;
  clone(): SchemaInterface;
  getValue(): any;
}
