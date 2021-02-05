import { DATA_ELEMENT } from '../../constants/root';
import $ from '../../model/node';
import { NodeInterface } from '../../types/node';
import './index.css';

type Placement =
  | 'top'
  | 'topLeft'
  | 'topRight'
  | 'bottom'
  | 'bottomLeft'
  | 'bottomRight'
  | 'left'
  | 'right';

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
  static show: (
    node: NodeInterface,
    title: string,
    options?: { placement: Placement },
  ) => void;
  static hide: () => void;
}

Tooltip.show = (
  node: NodeInterface,
  title: string,
  options: { placement: Placement } = { placement: 'top' },
) => {
  Tooltip.hide();
  const root = $(template(options));
  // 设置提示文字
  root.find('[data-role=tooltip]').html(title);
  // 计算定位
  const body = $(document.body);
  body.append(root);
  const element = root.get<Element>();
  const width = element?.clientWidth || 0;
  const height = element?.clientHeight || 0;
  const nodeWidth = node.get<Element>()?.clientWidth || 0;
  const offset = node.offset() || {};
  const left = Math.round(
    window.pageXOffset + offset.left + nodeWidth / 2 - width / 2,
  );
  const top = Math.round(window.pageYOffset + offset.top - height - 2);
  root.css({
    left: left + 'px',
    top: top + 'px',
  });
  root.addClass('data-tooltip-active');
};

Tooltip.hide = () => {
  $(`div[${DATA_ELEMENT}=tooltip]`).remove();
};

export default Tooltip;
