export interface CommandInterface {
  queryEnabled(name: string): boolean;

  queryState(name: string, ...args: any): any;

  execute(name: string, ...args: any): any;
}
