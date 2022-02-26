import { debounce, cloneDeep } from 'lodash';
import { EventEmitter2 } from 'eventemitter2';
import { Doc, Op } from 'sharedb';
import { EngineInterface } from '../types/engine';
import { filterOperations, updateIndex } from './utils';

import {
	ConsumerInterface,
	Attribute,
	DocInterface,
	Member,
	MutationInterface,
	OTInterface,
	RangeColoringInterface,
	SelectionInterface,
	TargetOp,
} from '../types/ot';
import OTSelection from './selection';
import RangeColoring from './range-coloring';
import OTDoc from './doc';
import Consumer from './consumer';
import Mutation from './mutation';
import { toJSON0, isCursorOp } from './utils';
import { random } from '../utils';
import './index.css';

class OTModel extends EventEmitter2 implements OTInterface {
	private engine: EngineInterface;
	private members: Array<Member>;
	private currentMember?: Member;
	private waitingOps: Array<TargetOp> = [];
	private clientId: string;
	selection: SelectionInterface;
	private rangeColoring: RangeColoringInterface;
	consumer: ConsumerInterface;
	private mutation: MutationInterface | null;
	private doc: DocInterface | Doc | null = null;

	constructor(engine: EngineInterface) {
		super();
		this.engine = engine;
		this.members = [];
		this.selection = new OTSelection(engine);
		this.rangeColoring = new RangeColoring(engine);
		this.consumer = new Consumer(engine);
		this.mutation = new Mutation(engine.container, { engine });
		this.mutation.on('onChange', (ops) => this.handleChange(ops));
		this.clientId = random(8);
		this.waitingOps = [];
		this.engine.on('select', () => {
			this.updateSelection();
		});
	}

	private updateRangeColoringPosition = debounce(() => {
		this.updateSelection();
		this.rangeColoring.updatePosition();
	}, 100);

	private applyWaitingOps = debounce(() => {
		const operations = filterOperations(this.waitingOps);
		if (operations.length > 0) {
			this.waitingOps = [];
			this.apply(
				operations.filter((op) => {
					// 过滤掉修改自身光标位置的操作
					if (
						isCursorOp(op) &&
						op.p.includes(
							`data-selection-${this.currentMember?.uuid}`,
						)
					) {
						return false;
					}
					return true;
				}),
			);
			this.engine.history.handleRemoteOps(operations);
			const selections = this.selection.getSelections();
			this.renderSelection(selections);
		}
	}, 0);

	colors = [
		'#597EF7',
		'#73D13D',
		'#FF4D4F',
		'#9254DE',
		'#36CFC9',
		'#FFA940',
		'#F759AB',
		'#40A9FF',
	];

	initLocal() {
		if (this.doc) return;
		this.stopMutation();
		this.doc = new OTDoc(this.engine);
		this.mutation?.setDoc(this.doc);
		this.startMutation();
	}

	initRemote(doc: Doc, defaultValue?: string) {
		// 没有启动协同，或者当前doc对象没有注销，就去注销
		const isDestroy = !this.doc || this.doc.type === null;
		this.stopMutation();
		if (!isDestroy) {
			this.doc!.destroy();
		}
		// 设置文档对象
		this.doc = doc;
		this.mutation?.setDoc(doc);
		// 同步数据
		this.syncValue(defaultValue);
		// 监听操作
		doc.on('op', (op, clientId) => {
			if (this.clientId !== clientId.toString()) {
				this.waitingOps = this.waitingOps.concat(op);
				this.applyWaitingOps();
			}
		});
		this.initSelection();
		this.startMutation();
		if (isDestroy) {
			this.emit('load');
		}
	}

	handleChange(ops: Op[]) {
		this.submitOps(ops);
		this.engine.history.handleSelfOps(ops.filter((op) => !op['nl']));
		if (this.doc && this.doc?.type !== null) {
			this.updateRangeColoringPosition();
		}
		this.engine.trigger('ops', ops);
	}

	submitOps(ops: Op[]) {
		if (!this.doc) return;
		try {
			(this.doc as Doc).submitOp(ops, {
				source: this.clientId,
			});
		} catch (error) {
			console.error(
				'SubmitOps Error:',
				'MSG:',
				error,
				'OPS:',
				ops,
				'DATA:',
				this.doc.data,
			);
		}
	}

	apply(ops: Op[]) {
		this.stopMutation();
		const applyNodes = this.consumer.handleRemoteOperations(ops);
		this.consumer.handleIndex(
			ops,
			ops.some((op) => op['bi'] < 0)
				? [this.engine.container]
				: applyNodes,
		);
		this.startMutation();
	}

	syncValue(defaultValue?: string) {
		const { doc, engine } = this;
		if (!doc) return;
		// 除了div 和 selection-data 外 还必须有其它节点
		if (doc.type && Array.isArray(doc.data) && doc.data.length > 2) {
			// 远端有数据就设置数据到当前编辑器
			this.engine.setJsonValue(doc.data, () => {
				updateIndex(this.engine.container);
			});
			return;
		}
		// 如果有设置默认值，就设置编辑器的值
		if (defaultValue)
			engine.setValue(defaultValue, () => {
				updateIndex(this.engine.container);
			});
		// 没有数据，就把当前编辑器值提交
		doc.on('create', () => {
			const data = toJSON0(engine.container);
			(doc as Doc).submitOp(
				[
					{
						p: [],
						oi: data,
					},
				],
				{
					source: this.clientId,
				},
			);
		});
	}

	startMutation() {
		if (this.mutation) this.mutation.start();
	}

	stopMutation() {
		if (this.mutation) this.mutation.stop();
	}

	isStopped() {
		return this.mutation?.isStopped ?? false;
	}

	startMutationCache() {
		if (this.mutation) this.mutation.startCache();
	}

	submitMutationCache() {
		if (this.mutation) this.mutation.submitCache();
	}

	destroyMutationCache() {
		if (this.mutation) this.mutation.destroyCache();
	}

	/**
	 * 获取缓存的记录
	 * @returns
	 */
	getCaches(): MutationRecord[] {
		return this.mutation?.getCaches() || [];
	}

	getColors() {
		return this.colors;
	}

	setColors(colors: string[]) {
		this.colors = colors;
	}

	setMemberColor(member: Member) {
		let index = member.index || this.members.length + 1;
		index = (index - 1) % this.colors.length;
		member.color = this.colors[index];
	}

	getMembers() {
		return cloneDeep(this.members);
	}

	setMembers(members: Array<Member>) {
		members = cloneDeep(members);
		members.forEach((member) => {
			this.setMemberColor(member);
		});
		this.members = members;
	}

	addMember(member: Member) {
		member = cloneDeep(member);
		this.setMemberColor(member);
		if (!this.members.find((m) => m.uuid === member.uuid)) {
			this.members.push(member);
		}
	}

	removeMember(member: Member) {
		member = cloneDeep(member);
		if (!member.uuid) return;
		this.members = this.members.filter((m) => {
			return m.uuid !== member.uuid;
		});
		this.selection.remove(member.uuid);
		const attributes = this.selection.getSelections();
		this.renderSelection(attributes);
	}

	setCurrentMember(member: Member) {
		member = cloneDeep(member);
		this.setMemberColor(member);
		const findMember = this.members.find((m) => m.uuid === member.uuid);
		if (!findMember) return;
		this.currentMember = findMember;
	}

	getCurrentMember() {
		return this.currentMember;
	}

	renderSelection(
		attributes: Array<Attribute>,
		isDraw: boolean = false,
		showInfo?: boolean,
	) {
		const { members, currentMember } = this;
		attributes = attributes.filter(
			(item) => item.uuid !== currentMember?.uuid,
		);
		this.rangeColoring.render(attributes, members, isDraw, showInfo);
		this.rangeColoring.updatePosition();
	}

	updateSelection() {
		if (!this.engine.change.isComposing() && this.currentMember) {
			const range = this.selection.updateSelections(
				this.currentMember,
				this.members,
			).range;
			this.rangeColoring.updateBackgroundAlpha(range);
		}
	}

	updateSelectionPosition() {
		this.rangeColoring.updatePosition();
	}

	initSelection(showInfo?: boolean) {
		if (!this.currentMember) return;
		const data = this.selection.updateSelections(
			this.currentMember,
			this.members,
		).data;
		this.renderSelection(data, true, showInfo);
	}

	destroy() {
		if (this.doc) this.doc.destroy();
		this.stopMutation();
		this.rangeColoring.destroy();
		this.mutation = null;
	}
}

export default OTModel;
