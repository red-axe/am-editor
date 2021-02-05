export interface HotkeyInterface {
  handleKeydown(e: KeyboardEvent): void;
  set(key: string, name: string, ...args: any): void;
  enable(): void;
  disable(): void;
  destroy(): void;
}
