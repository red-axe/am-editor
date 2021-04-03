import { debounce, cloneDeep } from 'lodash-es';
import { EventEmitter2 } from 'eventemitter2';
import { Doc, Op } from 'sharedb';
import { EngineInterface } from '../types/engine';
import { randomString, reduceOperations } from './utils';
import {
	ApplierInterface,
	Attribute,
	DocInterface,
	Member,
	MutationInterface,
	OTInterface,
	RangeColoringInterface,
	SelectionDataInterface,
} from '../types/ot';
import SelectionData from './selection-data';
import RangeColoring from './range-coloring';
import OTDoc from './doc';
import Applier from './applier';
import Mutation from './mutation';
import { fromDOM } from './jsonml';
import './index.css';

const colors = [
	'#597EF7',
	'#73D13D',
	'#FF4D4F',
	'#9254DE',
	'#36CFC9',
	'#FFA940',
	'#F759AB',
	'#40A9FF',
];

class OTModel extends EventEmitter2 implements OTInterface {
	private engine: EngineInterface;
	private members: Array<Member>;
	private currentMember: Member = { uuid: '', name: '', color: '' };
	private waitingOps: Array<Op> = [];
	private clientId: string;
	selectionData: SelectionDataInterface;
	private rangeColoring: RangeColoringInterface;
	applier: ApplierInterface;
	private mutation: MutationInterface | null;
	private doc: DocInterface | Doc | null = null;

	constructor(engine: EngineInterface) {
		super();
		this.engine = engine;
		this.members = [];
		this.selectionData = new SelectionData(engine);
		this.rangeColoring = new RangeColoring(engine);
		this.applier = new Applier(engine);
		this.mutation = new Mutation(engine.container, { engine });
		this.mutation.on('ops', ops => this.handleOps(ops));
		this.clientId = randomString();
		this.waitingOps = [];
		this.engine.on('select', () => {
			this.updateSelectionData();
		});
	}

	private updateRangeColoringPosition = debounce(() => {
		this.updateSelectionData();
		this.rangeColoring.updatePosition();
	}, 100);

	private applyWaitingOps = debounce(() => {
		const operations = reduceOperations(this.waitingOps);
		if (operations.length > 0) {
			this.waitingOps = [];
			this.applyAll(operations);
			this.engine.history.collectRemoteOps(operations);
			const allData = this.selectionData.getAll();
			this.doRangeColoring(allData);
		}
	}, 0);

	destroy() {
		if (this.doc) this.doc.destroy();
		this.stopMutation();
		this.rangeColoring.destroy();
		this.mutation = null;
	}

	initLockMode() {
		this.stopMutation();
		this.doc = new OTDoc(this.engine);
		this.mutation?.setDoc(this.doc);
		this.startMutation();
	}

	init(doc: Doc) {
		const isDestroy = !this.doc || this.doc['mode'] === 'lock';
		this.stopMutation();
		if (!isDestroy) {
			this.doc!.destroy();
		}
		this.doc = doc;
		this.mutation?.setDoc(doc);
		this.syncData();
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

	handleOps(ops: Op[]) {
		this.submitOps(ops);
		this.engine.history.collectSelfOps(ops);
		if (this.doc!['mode'] !== 'lock') {
			this.updateRangeColoringPosition();
		}
	}

	submitOps(ops: Op[]) {
		if (!this.doc) return;
		(this.doc as Doc).submitOp(ops, {
			source: this.clientId,
		});
	}

	applyAll(ops: Op[]) {
		this.stopMutation();
		this.applier.applyRemoteOperations(ops);
		this.startMutation();
	}

	syncData() {
		const { doc, engine } = this;
		if (!doc) return;
		if (
			Array.isArray(doc.data) &&
			doc.data.length > 0 &&
			doc['mode'] !== 'lock'
		) {
			this.setData(doc.data);
			return;
		}
		const data = fromDOM(engine.container);
		if (doc.data) {
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
		} else {
			doc.create(data, 'ot-json0', {
				source: this.clientId,
			});
		}
	}

	setData(data: Array<any>) {
		this.engine.setJsonValue(data);
	}

	startMutation() {
		if (this.mutation) this.mutation.start();
	}

	stopMutation() {
		if (this.mutation) this.mutation.stop();
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

	setMemberIdToUuid(member: Member) {
		member.__uuid = member.uuid;
		member.uuid = String(member.id).toLowerCase();
	}

	setMemberUuidToId(member: Member) {
		member.uuid = member.__uuid!;
		delete member.__uuid;
	}

	setMemberColor(member: Member) {
		const iid = member.iid || 1;
		const index = (iid - 1) % colors.length;
		member.color = colors[index];
	}

	getMembers() {
		const members = cloneDeep(this.members);
		members.forEach(member => {
			this.setMemberUuidToId(member);
		});
		return members;
	}

	setMembers(members: Array<Member>) {
		members = cloneDeep(members);
		members.forEach(member => {
			this.setMemberIdToUuid(member);
			this.setMemberColor(member);
		});
		this.members = members;
	}

	addMember(member: Member) {
		member = cloneDeep(member);
		this.setMemberIdToUuid(member);
		this.setMemberColor(member);
		if (!this.members.find(m => m.uuid === member.uuid)) {
			this.members.push(member);
		}
	}

	removeMember(member: Member) {
		member = cloneDeep(member);
		if (!member.uuid) return;
		this.setMemberIdToUuid(member);
		this.members = this.members.filter(m => {
			return m.uuid !== member.uuid;
		});
		this.selectionData.remove(member.uuid);
		const attrs = this.selectionData.getAll();
		this.doRangeColoring(attrs);
	}

	setCurrentMember(member: Member) {
		member = cloneDeep(member);
		this.setMemberIdToUuid(member);
		this.setMemberColor(member);
		const findMember = this.members.find(m => m.uuid === member.uuid);
		if (!findMember) return;
		this.currentMember = findMember;
	}

	getCurrentMember() {
		return this.currentMember && !!this.currentMember.id
			? this.currentMember
			: undefined;
	}

	doRangeColoring(attrs: Array<Attribute>, isDraw: boolean = false) {
		const { members, currentMember } = this;
		attrs = attrs.filter(item => item.uuid !== currentMember?.uuid);
		this.rangeColoring.render(attrs, members, isDraw);
		this.rangeColoring.updatePosition();
	}

	updateSelectionData() {
		if (!this.engine.change.isComposing()) {
			const range = this.selectionData.updateAll(
				this.currentMember,
				this.members,
			).range;
			this.rangeColoring.updateBackgroundAlpha(range);
		}
	}

	initSelection() {
		const data = this.selectionData.updateAll(
			this.currentMember,
			this.members,
		).data;
		this.doRangeColoring(data, true);
	}
}

export default OTModel;
