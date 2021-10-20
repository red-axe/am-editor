const { rollup, watch } = require('rollup');
const signale = require('signale');
const vue = require('rollup-plugin-vue');
const getRollupConfig = require('father-build/lib/getRollupConfig').default;
const normalizeBundleOpts =
	require('father-build/lib/normalizeBundleOpts').default;

async function build(entry, opts) {
	const { cwd, rootPath, type, log, bundleOpts, importLibToEs, dispose } =
		opts;
	const rollupConfigs = getRollupConfig({
		cwd,
		rootPath: rootPath || cwd,
		type,
		entry,
		importLibToEs,
		bundleOpts: normalizeBundleOpts(entry, bundleOpts),
	});
	rollupConfigs.forEach((config) => {
		const { plugins } = config;
		const index = plugins.findIndex((p) => p.name === 'postcss');
		if (index < plugins.length)
			plugins.splice(index, 0, vue({ preprocessStyles: true }));
		else plugins.push(vue({ preprocessStyles: true }));
	});
	for (const rollupConfig of rollupConfigs) {
		if (opts.watch) {
			const watcher = watch([
				{
					...rollupConfig,
					watch: {},
				},
			]);
			watcher.on('event', (event) => {
				if (event.error) {
					signale.error(event.error);
				} else if (event.code === 'START') {
					log(`[${type}] Rebuild since file changed`);
				}
			});
			process.once('SIGINT', () => {
				watcher.close();
			});
			if (dispose) dispose.push(() => watcher.close());
		} else {
			const { output, ...input } = rollupConfig;
			const bundle = await rollup(input); // eslint-disable-line
			await bundle.write(output); // eslint-disable-line
		}
	}
}

module.exports = async function (opts) {
	if (Array.isArray(opts.entry)) {
		const { entry: entries } = opts;
		for (const entry of entries) {
			await build(entry, opts);
		}
	} else {
		await build(opts.entry, opts);
	}
};
