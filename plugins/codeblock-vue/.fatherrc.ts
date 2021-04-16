import vue from 'rollup-plugin-vue';
import commonjs from '@rollup/plugin-commonjs';

export default {
	extraExternals: ['vue'],
	extraRollupPlugins: [
		{ before: 'postcss', plugins: [vue({ preprocessStyles: true })] },
		commonjs(),
	],
};
