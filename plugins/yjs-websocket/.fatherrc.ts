export default {
	esm: 'rollup',
	cjs: 'rollup',
	entry: ['src/index.ts', 'src/server.ts'],
	extraExternals: ['ws', 'http', 'buffer', 'y-leveldb', 'mongodb'],
	runtimeHelpers: true,
};
