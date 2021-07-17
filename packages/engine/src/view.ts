import NodeModel, { Event, $ } from './node';
import language from './locales';
import {
	EventInterface,
	NodeInterface,
	Selector,
	EventListener,
	NodeModelInterface,
} from './types/node';
import schemaDefaultData from './constants/schema';
import Schema from './schema';
import Conversion from './parser/conversion';
import { ViewInterface, ContentViewOptions } from './types/view';
import { CardModelInterface } from './types/card';
import { PluginModelInterface } from './types/plugin';
import { SchemaInterface } from './types/schema';
import { ConversionInterface } from './types/conversion';
import CardModel from './card';
import PluginModel from './plugin';
import { ClipboardInterface } from './types/clipboard';
import Clipboard from './clipboard';
import { LanguageInterface } from './types/language';
import Language from './language';
import Parser from './parser';
import {
	CommandInterface,
	MarkModelInterface,
	RequestInterface,
} from './types';
import { BlockModelInterface } from './types/block';
import { InlineModelInterface } from './types/inline';
import { ListModelInterface } from './types/list';
import List from './list';
import Mark from './mark';
import Inline from './inline';
import Block from './block';
import Command from './command';
import Request from './request';

class View implements ViewInterface {
	private options: ContentViewOptions = {
		lang: 'zh-CN',
		plugins: [],
		cards: [],
	};
	readonly kind = 'view';
	root: NodeInterface;
	language: LanguageInterface;
	container: NodeInterface;
	card: CardModelInterface;
	plugin: PluginModelInterface;
	node: NodeModelInterface;
	list: ListModelInterface;
	mark: MarkModelInterface;
	inline: InlineModelInterface;
	block: BlockModelInterface;
	clipboard: ClipboardInterface;
	event: EventInterface;
	schema: SchemaInterface;
	conversion: ConversionInterface;
	command: CommandInterface;
	request: RequestInterface;

	constructor(selector: Selector, options?: ContentViewOptions) {
		this.options = { ...this.options, ...options };
		this.language = new Language(this.options.lang || 'zh-CN', language);
		this.event = new Event();
		this.command = new Command(this);
		this.schema = new Schema();
		this.schema.add(schemaDefaultData);
		this.conversion = new Conversion(this);
		this.card = new CardModel(this);
		this.clipboard = new Clipboard(this);
		this.plugin = new PluginModel(this);
		this.node = new NodeModel(this);
		this.list = new List(this);
		this.mark = new Mark(this);
		this.inline = new Inline(this);
		this.block = new Block(this);
		this.clipboard = new Clipboard(this);
		this.request = new Request();
		this.container = $(selector);
		this.root = $(
			this.options.root || this.container.parent() || document.body,
		);
		this.container.addClass('am-engine-view');
		this.mark.init();
		this.inline.init();
		this.block.init();
		this.list.init();
		this.card.init(this.options.cards || []);
		this.plugin.init(this.options.plugins || [], this.options.config || {});
	}

	on(eventType: string, listener: EventListener, rewrite?: boolean) {
		this.event.on(eventType, listener, rewrite);
		return this;
	}

	off(eventType: string, listener: EventListener) {
		this.event.off(eventType, listener);
		return this;
	}

	trigger(eventType: string, ...args: any) {
		return this.event.trigger(eventType, ...args);
	}

	render(content: string, trigger: boolean = true) {
		const parser = new Parser(content, this);
		const value = parser.toValue(this.schema, this.conversion, false, true);
		this.container.html(value);
		this.card.render();
		if (trigger) this.trigger('render', this.container);
	}

	messageSuccess(message: string) {
		console.log(`success:${message}`);
	}

	messageError(error: string) {
		console.log(`error:${error}`);
	}

	messageConfirm(message: string): Promise<boolean> {
		console.log(`confirm:${message}`);
		return Promise.reject(false);
	}
}

export default View;
