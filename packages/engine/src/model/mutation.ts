import { EventEmitter2 } from 'eventemitter2';
import { EngineInterface } from '../types/engine';

const config = {
	childList: true,
	subtree: true,
	attributes: true,
	characterData: true,
	attributeOldValue: true,
	characterDataOldValue: true,
};

const MUTATION_TO_ENGINE = new WeakMap<EngineInterface, Mutation>();

export interface Mutation {
	isStopped: boolean;
	isCache: boolean;
	onChange(fn: (records: MutationRecord[]) => void): void;
	offChange(fn: (records: MutationRecord[]) => void): void;
	start(): void;
	stop(): void;
	startCache(): void;
	submitCache(): void;
	destroyCache(): void;
	getCaches(): MutationRecord[];
	destroy(): void;
}

const createMutation = (engine: EngineInterface) => {
	let isCache = false;
	let isStopped = true;
	let cachedRecords: MutationRecord[] = [];
	const ee = new EventEmitter2();
	const observer = new MutationObserver((records) => {
		if (isCache) {
			cachedRecords.push(...records);
		}
		if (!isStopped && !isCache) {
			ee.emit('change', records);
		}
	});

	const mutation: Mutation = {
		get isStopped() {
			return isStopped;
		},
		get isCache() {
			return isCache;
		},
		onChange: (fn) => {
			ee.on('change', fn);
		},

		offChange: (fn) => {
			ee.off('change', fn);
		},

		start: () => {
			const container = engine.container[0];
			if (isStopped) {
				observer.observe(container, config);
				isStopped = false;
			}
		},
		stop: () => {
			if (!isStopped) {
				observer.disconnect();
				isStopped = true;
			}
		},
		startCache: () => {
			if (!isCache) {
				cachedRecords = [];
				isCache = true;
			}
		},
		submitCache: () => {
			if (isCache) {
				setTimeout(() => {
					if (engine.change.isComposing()) return;
					isCache = false;
					cachedRecords = cachedRecords.map((record) => {
						if (record.type === 'characterData') {
							if (record.target.nodeType === document.TEXT_NODE) {
								record['text-data'] = record.target.textContent;
							}
						}
						return record;
					});
					if (cachedRecords.length > 0)
						ee.emit('change', cachedRecords);
					cachedRecords = [];
				}, 20);
			}
		},
		destroyCache: () => {
			if (isCache) {
				setTimeout(() => {
					isCache = false;
					cachedRecords = [];
				}, 20);
			}
		},
		getCaches: () => {
			return cachedRecords;
		},
		destroy: () => {
			ee.removeAllListeners();
			mutation.stop();
		},
	};

	return mutation;
};

export const Mutation = {
	from: (engine: EngineInterface) => {
		let mutation = MUTATION_TO_ENGINE.get(engine);
		if (!mutation) {
			mutation = createMutation(engine);
			MUTATION_TO_ENGINE.set(engine, mutation);
		}
		return mutation;
	},

	destroy: (engine: EngineInterface) => {
		const mutation = MUTATION_TO_ENGINE.get(engine);
		mutation?.destroy();
	},
};
