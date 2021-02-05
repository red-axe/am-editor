import { RangeInterface } from './range';

export type ClipboardData = {
  html?: string;
  text?: string;
  files: Array<File>;
};
export interface ClipboardInterface {
  getData(event: DragEvent | ClipboardEvent): ClipboardData;
  write(
    event: ClipboardEvent,
    range?: RangeInterface | null,
    callback?: (data: { html: string; text: string }) => void,
  ): void;
  cut(): void;
  copy(data: Node | string, trigger?: boolean): boolean;
}
