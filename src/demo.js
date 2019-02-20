// 未编译API,需要引入polyfill
import 'core-js'
import Sorter from './package/main'

// 一般用法
const dragger2 = new Sorter(document.getElementById('free'), {dir: 'free'})
console.log(dragger2)

new window.Vue({
  el: '#app',
  data() {
	return {
	  list: [1, 2, 3, 4, 5, 6, 7, 8],
	}
  },
  mounted() {
	this.dragger = new Sorter(this.$refs.list, {
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
	<ul class="free list" ref="list">
		<li class="item" v-for="it in list" :key="it">item {{it}}</li>
	</ul>
  </div>
  `,
});
