import domAlign from 'dom-align';
import { DATA_ELEMENT } from '../../constants/root';
import { NodeInterface } from '../../types/node';
import { Placement } from '../../types/position';
import { $ } from '../../node';
import { getDocument } from '../../utils';
import placements from '../../position/placements';
import './index.css';

const template = (options: { placement: Placement }) => {
	return `
    <div ${DATA_ELEMENT}="tooltip" class="data-tooltip data-tooltip-placement-${options.placement} data-tooltip-hidden" style="transform-origin: 50% 45px 0px;">
        <div class="data-tooltip-content">
            <div class="data-tooltip-arrow"></div>
            <div class="data-tooltip-inner" data-role="tooltip"></div>
        </div>
    </div>`;
};

class Tooltip {
	static show(
		node: NodeInterface,
		title: string | NodeInterface,
		options: { placement: Placement } = { placement: 'top' },
	) {
		Tooltip.hide();
		const root = $(template(options));
		// 设置提示文字
		if (typeof title === 'string')
			root.find('[data-role=tooltip]').html(title);
		else root.find('[data-role=tooltip]').append(title);
		// 计算定位
		const doc = getDocument();
		const body = $(doc.body);
		body.append(root);
		const rect = domAlign(
			root.get<HTMLElement>(),
			node.get<HTMLElement>(),
			{
				...placements[options.placement],
			},
		);
		const align = Object.keys(placements).find((p) => {
			const points = placements[p].points;
			return points[0] === rect.points[0] && points[1] === rect.points[1];
		});
		if (align !== options.placement) {
			root.removeClass(
				`data-tooltip-placement-${options.placement}`,
			).addClass(`data-tooltip-placement-${align}`);
		}
		root.addClass('data-tooltip-active');
	}
	static hide() {
		const doc = getDocument();
		$(doc.body).find(`div[${DATA_ELEMENT}=tooltip]`).remove();
	}
}

export default Tooltip;
