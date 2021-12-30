import { DATA_ELEMENT } from '../../constants/root';
import { NodeInterface } from '../../types/node';
import { Placement } from '../../types/position';
import { $ } from '../../node';
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
		const body = $(document.body);
		body.append(root);
		const element = root.get<Element>();
		const width = element?.clientWidth || 0;
		const height = element?.clientHeight || 0;
		const nodeElement = node.get<Element>()!;
		const nodeWidth = nodeElement.clientWidth;
		const nodeRect = nodeElement.getBoundingClientRect();
		const left = Math.round(
			window.pageXOffset + nodeRect.left + nodeWidth / 2 - width / 2,
		);
		let top = Math.round(window.pageYOffset + nodeRect.top - height - 2);
		if (options.placement === 'bottom') {
			top += nodeRect.height + height + 2;
		}
		root.css({
			left: left + 'px',
			top: top + 'px',
		});
		root.addClass('data-tooltip-active');
	}
	static hide() {
		$(`div[${DATA_ELEMENT}=tooltip]`).remove();
	}
}

export default Tooltip;
