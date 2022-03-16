import { ViewInterface, ViewOptions } from './types/view';
import Parser from './parser';
import Editor from './editor';
import { Selector } from './types';
import { VIEW_CLASS_NAME } from './constants';

class View<T extends ViewOptions = ViewOptions>
	extends Editor<T>
	implements ViewInterface<T>
{
	readonly kind = 'view';

	constructor(selector: Selector, options?: ViewOptions) {
		super(selector, options);
		this.init();
		if (!this.container.hasClass(VIEW_CLASS_NAME)) {
			this.container.addClass(VIEW_CLASS_NAME);
		}
	}

	render(content: string, trigger: boolean = true) {
		const parser = new Parser(content, this);
		const value = parser.toValue(this.schema, this.conversion, false, true);
		this.container.html(value);
		this.card.render(this.container, () => {
			if (trigger) this.trigger('render', this.container);
		});
	}
}

export default View;
