import { CardModelInterface } from './card';
import { ClipboardInterface } from './clipboard';
import { ConversionInterface } from './conversion';
import { LanguageInterface } from './language';
import { EventInterface, NodeInterface } from './node';
import { PluginModelInterface } from './plugin';
import { SchemaInterface } from './schema';

export interface ContentViewInterface {
  language: LanguageInterface;
  container: NodeInterface;
  card: CardModelInterface;
  plugin: PluginModelInterface;
  clipboard: ClipboardInterface;
  event: EventInterface;
  schema: SchemaInterface;
  conversion: ConversionInterface;
  messageSuccess(message: string): void;
  messageError(error: string): void;
  render(content: string): void;
}

export type ContentViewOptions = {
  lang?: string;
  card?: CardModelInterface;
  plugin?: PluginModelInterface;
};
