/*
	config for build umd module to use
* */
const path = require('path');
const base = require('./webpack.base');
const merge = require('webpack-merge');
const root = p => path.join(__dirname, '..', p);
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const argv = process.argv;
const showBundle = argv.includes('--report');

module.exports = merge(base, {
  mode: 'production',
  entry: root('src/package/main.js'),
  output: {
	path: path.resolve(__dirname, '../lib'),
	filename: 'sorter.js',
	publicPath: '/',
	library: 'Sorter',
	libraryTarget: 'umd',
	libraryExport: 'default', // 需要暴露的模块
	umdNamedDefine: true,
  },
  performance: false,
  optimization: {
	minimize: true,
  },
  plugins: [],
});

showBundle && module.exports.plugins.push(
	new BundleAnalyzerPlugin(),
);
