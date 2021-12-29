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
	NodeIdInterface,
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
import NodeId from './node/id';
import { DATA_ELEMENT, ROOT } from './constants';

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
	nodeId: NodeIdInterface;
	#_scrollNode: NodeInterface | null = null;

	constructor(selector: Selector, options?: ContentViewOptions) {
		this.options = { ...this.options, ...options };
		this.language = new Language(this.options.lang || 'zh-CN', language);
		this.event = new Event();
		this.command = new Command(this);
		this.schema = new Schema();
		this.schema.add(schemaDefaultData);
		this.conversion = new Conversion(this);
		this.card = new CardModel(this, this.options.lazyRender);
		this.clipboard = new Clipboard(this);
		this.plugin = new PluginModel(this);
		this.node = new NodeModel(this);
		this.nodeId = new NodeId(this);
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
		this.container.attributes(DATA_ELEMENT, ROOT);
		this.mark.init();
		this.inline.init();
		this.block.init();
		this.list.init();
		this.card.init(this.options.cards || []);
		this.plugin.init(this.options.plugins || [], this.options.config || {});
		this.nodeId.init();
	}

	setScrollNode(node?: HTMLElement) {
		this.#_scrollNode = node ? $(node) : null;
	}

	get scrollNode(): NodeInterface | null {
		if (this.#_scrollNode) return this.#_scrollNode;
		const { scrollNode } = this.options;
		let sn = scrollNode
			? typeof scrollNode === 'function'
				? scrollNode()
				: scrollNode
			: null;
		// 查找父级样式 overflow 或者 overflow-y 为 auto 或者 scroll 的节点
		const targetValues = ['auto', 'scroll'];
		let parent = this.container.parent();
		while (!sn && parent && parent.length > 0 && parent.name !== 'body') {
			if (
				targetValues.includes(parent.css('overflow')) ||
				targetValues.includes(parent.css('overflow-y'))
			) {
				sn = parent.get<HTMLElement>();
				break;
			} else {
				parent = parent.parent();
			}
		}
		if (sn === null) sn = document.documentElement;
		this.#_scrollNode = sn ? $(sn) : null;
		return this.#_scrollNode;
	}

	on<R = any, F extends EventListener<R> = EventListener<R>>(
		eventType: string,
		listener: F,
		rewrite?: boolean,
	) {
		this.event.on(eventType, listener, rewrite);
		return this;
	}

	off(eventType: string, listener: EventListener) {
		this.event.off(eventType, listener);
		return this;
	}

	trigger<R = any>(eventType: string, ...args: any): R {
		return this.event.trigger<R>(eventType, ...args);
	}

	render(content: string, trigger: boolean = true) {
		const parser = new Parser(content, this);
		const value = parser.toValue(this.schema, this.conversion, false, true);
		this.container.html(value);
		this.card.render(this.container, () => {
			if (trigger) this.trigger('render', this.container);
		});
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
