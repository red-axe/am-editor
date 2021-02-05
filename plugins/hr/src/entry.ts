import {
  Card,
  CardToolbarItemOptions,
  ToolbarItemOptions,
} from '@aomao/engine';
import './index.css';
class Hr extends Card {
  toolbarConfig(): Array<ToolbarItemOptions | CardToolbarItemOptions> {
    return [
      {
        type: 'dnd',
      },
      {
        type: 'copy',
      },
      {
        type: 'separator',
      },
      {
        type: 'delete',
      },
    ];
  }

  onSelect(selected: boolean) {
    const selectedClass = 'hr-selected';
    const center = this.getCenter();
    if (selected) center.addClass(selectedClass);
    else center.removeClass(selectedClass);
  }

  onActivate(activated: boolean) {
    const activatedClass = 'hr-activated';
    const center = this.getCenter();
    if (activated) center.addClass(activatedClass);
    else center.removeClass(activatedClass);
  }

  onSelectByOther(selected: boolean, value?: { color: string; rgb: string }) {
    const center = this.getCenter();
    center.css('background-color', selected ? value!.rgb : '');
    center.find('hr').css('background-color', selected ? value!.rgb : '');
  }

  onActivateByOther(
    activated: boolean,
    value?: { color: string; rgb: string },
  ) {
    this.onSelectByOther(activated, value);
  }

  render() {
    this.getCenter().addClass('card-hr');
    return '<hr />';
  }
}
Hr.autoActivate = false;
export default Hr;
