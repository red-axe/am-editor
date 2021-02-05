import { Path } from 'sharedb';
import { EngineInterface } from '../../types/engine';
import { Attribute, Member, SelectionDataInterface } from '../../types/ot';
import { toPath } from './utils';

class SelectionData implements SelectionDataInterface {
  private engine: EngineInterface;
  currentRangePath: Path[] = [];

  constructor(engine: EngineInterface) {
    this.engine = engine;
  }

  getAll() {
    const { container } = this.engine;
    const data: Array<Attribute> = [];
    const attributes = container.get<Element>()?.attributes;
    if (!attributes) return data;
    for (let i = 0; i < attributes.length; i++) {
      const item = attributes.item(i);
      if (!item) continue;
      const { nodeName, nodeValue } = item;
      if (/^data-selection-/.test(nodeName) && nodeValue) {
        const value = JSON.parse(decodeURIComponent(nodeValue));
        if (value) {
          data.push(value);
        }
      }
    }
    return data;
  }

  setAll(data: Array<Attribute>) {
    const { container } = this.engine;
    const dataState: { [key: string]: boolean } = {};
    data.forEach(item => {
      if (item) {
        const name = 'data-selection-'.concat(item.uuid);
        dataState[name] = true;
        const value = container.attr(name);
        const value_str = encodeURIComponent(JSON.stringify(item));
        if (value !== value_str) {
          container.attr(name, value_str);
        }
      }
    });
    const attributes = container.get<Element>()?.attributes;
    if (!attributes) return;
    for (let i = 0; i < attributes.length; i++) {
      const item = attributes.item(i);
      if (!item) continue;
      const { nodeName } = item;
      if (/^data-selection-/.test(nodeName) && !dataState[nodeName]) {
        container.removeAttr(nodeName);
      }
    }
  }

  remove(name: string) {
    const { container } = this.engine;
    container.removeAttr('data-selection-'.concat(name));
  }

  updateAll(currentMember: Member, members: Array<Member>) {
    const { change, card } = this.engine;
    const range = change.getSelectionRange().cloneRange();
    const activeCard = card.active;
    if (activeCard) {
      const center = activeCard.getCenter();
      if (center && center.length > 0) range.select(center.get()!, true);
    }

    const path = toPath(range);
    this.currentRangePath = path;
    const pathString = JSON.stringify(path);
    let data: Array<Attribute | null> = this.getAll();
    let isMember = false;
    let isUpdate = false;
    data = data.map(attr => {
      if (!attr) {
        isUpdate = true;
        return null;
      }

      if (attr.uuid === currentMember.uuid) {
        isMember = true;
        if (pathString !== JSON.stringify(attr.path)) {
          isUpdate = true;
          attr.path = path;
          attr.active = true;
        }
        return attr;
      } else {
        if (members.find(member => member.uuid === attr.uuid)) {
          attr.active = false;
          return attr;
        } else {
          isUpdate = true;
          return null;
        }
      }
    });

    const newData: Array<Attribute> = [];
    data.forEach(attr => {
      if (!!attr) newData.push(attr);
    });

    if (!isMember) {
      isUpdate = true;
      newData.push({
        path,
        uuid: currentMember.uuid,
        active: true,
      });
    }
    if (isUpdate) {
      this.setAll(newData);
    }
    return {
      data: newData,
      range,
    };
  }
}

export default SelectionData;
