/**
 * Created by TY-xie on 2018/3/26.
 */
const path = require('path');

const baseConfig = {
  resolve: {
	extensions: ['.js'],
  },
  output: {
	path: path.resolve(__dirname, '../lib'),
	filename: '[name]/index.js',
	publicPath: './',
  },
  module: {
	rules: [
	  {
		test: /(\.jsx|\.js)$/,
		use: {
		  loader: 'babel-loader',
		},
		exclude: /(node_modules)/,
	  },
	],
  },
};

module.exports = baseConfig;

// 将路径起点指向../src/pages
function pages(p) {
  return path.join(__dirname, '../src/vue-pages', p)
}

function root(p) {
  return path.join(__dirname, '..', p)
}
