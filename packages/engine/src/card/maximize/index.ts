import {
	CardInterface,
	MaximizeInterface,
	EditorInterface,
	NodeInterface,
} from '../../types';
import { $ } from '../../node';
import { DATA_ELEMENT, DATA_TRANSIENT_ELEMENT, UI } from '../../constants';
import { isEngine } from '../../utils';
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
		const editor = this.editor;
		if (isEngine(editor)) {
			editor.trigger('card:minimize', this.card);
			editor.history.reset();
		}
	}

	maximize() {
		if (this.node) return;
		const editor = this.editor;
		const { language } = editor;
		const lang = language.get('maximize', 'back').toString();
		const node =
			$(`<div class="card-maximize-header" ${DATA_TRANSIENT_ELEMENT}="true" ${DATA_ELEMENT}="${UI}">
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
			this.card.minimize();
		});

		const body = this.card.findByKey('body');
		body?.prepend(node);

		if (isEngine(editor)) {
			editor.trigger('card:maximize', this.card);
			editor.history.reset();
		}
		this.node = node;
	}
}

export default Maximize;
