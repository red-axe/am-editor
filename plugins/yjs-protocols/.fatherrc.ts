export default {
	esm: 'rollup',
	cjs: 'rollup',
	entry: ['src/sync.ts', 'src/awareness.ts', 'src/auth.ts'],
	runtimeHelpers: true,
};
