import { NodeInterface } from '../../types/node';
import { CardInterface, MaximizeInterface } from '../../types/card';
import { EditorInterface, isEngine } from '../../types/engine';
import './index.css';

class Maximize implements MaximizeInterface {
	protected card: CardInterface;
	protected node?: NodeInterface;
	private editor: EditorInterface;

	constructor(editor: EditorInterface, card: CardInterface) {
		this.editor = editor;
		this.card = card;
	}

	restore() {
		this.card.root.removeClass('data-card-block-max');
		if (this.node) {
			this.node.remove();
			this.node = undefined;
		}
		if (!this.card.readonly && isEngine(this.editor)) {
			this.editor.trigger('card:minimize', this.card);
			this.editor.history.reset();
		}
	}

	maximize() {
		if (this.node) return;
		const { $, language } = this.editor;
		const lang = language.get('maximize', 'back').toString();
		const node = $(`<div class="card-maximize-header" data-transient="true">
            <div class="header-crumb">
                <a class="split">
                    <span class="data-icon data-icon-arrow-left"></span>
                </a>
                <a>${lang}</a>
            </div>
        </div>`);

		node.on('click', (event: MouseEvent) => {
			event.stopPropagation();
		});
		this.card.root.addClass('data-card-block-max');

		const crumnNode = node.find('.header-crumb');
		crumnNode.on('click', () => {
			this.restore();
		});

		const body = this.card.findByKey('body');
		body.prepend(node);

		if (!this.card.readonly && isEngine(this.editor)) {
			this.editor.trigger('card:maximize', this.card);
			this.editor.history.reset();
		}
		this.node = node;
	}
}

export default Maximize;
