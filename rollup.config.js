import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import { babel } from '@rollup/plugin-babel'
import { terser } from "@rollup/plugin-terser"; 

export default { 
	input: "src/index.js",
	output: [
		{
			file: "dist/error-monitor.js",
			format: "umd",
			sourceMap:true,
			name: "ErrorMonitor"
		},
		{
			file: "dist/error-monitor.esm.js",
			format: "es",
			name: "ErrorMonitor",
			sourceMap:true,
		},
		{
			file: "dist/error-monitor.cjs.js",
			format: "cjs",
			sourceMap:true,
			exports: "default",
			plugins: [
				terser()
			],
			name: "ErrorMonitor"
		}
	],
	plugins: [
		resolve(),
		commonjs(),
		babel({
			babelHelpers: 'bundled',
			exclude: 'node_modules/**',
		})
	]
}