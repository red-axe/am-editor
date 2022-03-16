import { EventEmitter2 } from 'eventemitter2';
import { EngineInterface } from '../types/engine';
import { Attribute, Member, SelectionInterface } from '../types/ot';
import { isTransientElement } from './utils';
import { RangePath } from '../types/range';
import { CardType } from '../card/enum';

class OTSelection extends EventEmitter2 implements SelectionInterface {
	private engine: EngineInterface;
	currentRangePath?: { start: RangePath; end: RangePath };
	data: Attribute[] = [];

	constructor(engine: EngineInterface) {
		super();
		this.engine = engine;
	}

	updateSelections(currentMember: Member, members: Array<Member>) {
		const { change, card } = this.engine;
		const range = change.range.get().cloneRange();
		const activeCard = card.active;
		if (activeCard && !activeCard.isEditable) {
			const center = activeCard.getCenter();
			if (isTransientElement(activeCard.root)) {
				const prev = activeCard.root.prev();
				if (prev) {
					range.select(prev, true).collapse(false);
				} else {
					range.setStartBefore(activeCard.root);
					range.collapse(true);
				}
			} else if (center && center.length > 0) {
				range.select(center.get()!, true);
			}
		} else if (
			activeCard?.isEditable &&
			activeCard.updateBackgroundSelection
		) {
			activeCard.updateBackgroundSelection(range);
		}
		if (!activeCard && !range.collapsed) {
			const startCard = this.engine.card.find(range.startNode, true);
			if (startCard && startCard.type === CardType.BLOCK) {
				range.setStart(startCard.getCenter().parent()!, 1);
			}
			const endCard = this.engine.card.find(range.endNode, true);
			if (endCard && endCard.type === CardType.BLOCK) {
				range.setEnd(endCard.getCenter().parent()!, 1);
			}
		}
		// 显示协作信息时包含左右光标位置
		const path = range.toPath(true);
		// 用作历史记录的不包含卡片左右光标位置
		this.currentRangePath = range.toPath();
		const pathString = JSON.stringify(path);
		let data: Array<Attribute | null> = this.data;
		let isMember = false;
		let isUpdate = false;
		data = data.map((attr) => {
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
				if (members.find((member) => member.uuid === attr.uuid)) {
					attr.active = false;
					return attr;
				} else {
					isUpdate = true;
					return null;
				}
			}
		});

		const newData: Array<Attribute> = [];
		data.forEach((attr) => {
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
			this.data = newData;
			this.emit('change', newData);
		}
		return {
			data: newData,
			range,
		};
	}
}

export default OTSelection;
