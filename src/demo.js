// 未编译API,需要引入polyfill
import 'core-js'
import Dragger from './package/main'

// 一般用法
const dragger = new Dragger(document.getElementById('drag-wrap'));
const dragger1 = new Dragger(document.getElementById('row-drag'), {dir: 'x'});

// 结合MVVM框架使用

new window.Vue({
  el: '#app',
  data() {
	return {
	  list: [1, 2, 3, 4],
	}
  },
  mounted() {
	this.dragger = new Dragger(this.$refs.list, {
	  change: false,
	})
	this.dragger.on('drag-over', pos => {
	  this.changeItem(pos);
	  setTimeout(() => {
		this.dragger.freshThreshold();
	  }, 20)
	})
  },
  methods: {
	changeItem({source, target}) {
	  let list = this.list;
	  // 取出被拖拽元素
	  let temp = list.splice(source, 1);
	  // 截取开头到被交换位置的元素
	  let start = list.splice(0, target);
	  // 组装成结果数组
	  this.list = [...start, ...temp, ...list];
	},
  },
  template: `
  <div class="app">
  <ul class="list" ref="list">
  <li class="item" v-for="it in list" :key="it">item {{it}}</li>
</ul>
</div>
  `,
});
