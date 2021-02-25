import { NodeInterface } from '../../types/node';
import { CardInterface, MaximizeInterface } from '../../types/card';
import { EngineInterface } from '../../types/engine';
import $ from '../../node';
import './index.css';

class Maximize implements MaximizeInterface {
	protected card: CardInterface;
	protected node?: NodeInterface;

	constructor(card: CardInterface) {
		this.card = card;
	}

	restore() {
		this.card.root.removeClass('data-card-block-max');
		if (this.node) {
			this.node.remove();
			this.node = undefined;
		}
		if (!this.card.readonly) {
			this.card.findByKey('center').removeClass('card-max-edit');
			(this.card.getEngine() as EngineInterface).event.trigger(
				'minimizecard',
			);
			(this.card.getEngine() as EngineInterface).history.reset();
		}
	}

	maximize() {
		if (this.node) return;
		const language = this.card.getLang();
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

		if (!this.card.readonly) {
			this.card.findByKey('center').addClass('card-max-edit');
			(this.card.getEngine() as EngineInterface).event.trigger(
				'maximizecard',
			);
			(this.card.getEngine() as EngineInterface).history.reset();
		}
		this.node = node;
	}
}

export default Maximize;
