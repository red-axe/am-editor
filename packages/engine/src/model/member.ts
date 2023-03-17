import { EngineInterface, RangePath } from '../types';

/**
 * 写作者光标属性
 */
export type CursorAttribute = {
	/**
	 * 协作者id
	 */
	uuid: string;
	/**
	 * 光标位置
	 */
	path?: { start: RangePath; end: RangePath };
	/**
	 * 是否激活
	 */
	active: boolean;
	/**
	 * 是否强制更新
	 */
	force?: boolean;
};

/**
 * 协作者信息
 */
export type CollaborationMember = {
	/**
	 * 协作者id
	 */
	uuid: string;
	/**
	 * 协作者名称
	 */
	name: string;
	/**
	 * 协作者颜色
	 */
	color: string;
};

const ENGINE_TO_MEMBER = new WeakMap<
	EngineInterface,
	ReturnType<typeof createMember>
>();

const createMember = () => {
	let current: CollaborationMember | null = null;
	const members: CollaborationMember[] = [];

	return {
		getMembers() {
			return members;
		},
		add(collaborationMember: CollaborationMember) {
			members.push(collaborationMember);
		},
		remove(uuid: string) {
			const index = members.findIndex((m) => m.uuid === uuid);
			if (index !== -1) {
				members.splice(index, 1);
			}
		},
		getCurrent() {
			return current;
		},
		setCurrent(uuid: string | CollaborationMember) {
			const collaborationMember =
				typeof uuid === 'string'
					? members.find((m) => m.uuid === uuid)
					: uuid;
			if (collaborationMember) {
				current = collaborationMember;
			}
		},
	};
};

export const CollaborationMember = {
	fromEngine: (engine: EngineInterface) => {
		let member = ENGINE_TO_MEMBER.get(engine);
		if (!member) {
			member = createMember();
			ENGINE_TO_MEMBER.set(engine, member);
		}
		return member;
	},
};
