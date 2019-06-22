// 未编译API,需要引入polyfill
import 'core-js'
import Sorter from './package/main'

window.Sorter = Sorter
// 一般用法
const dragger2 = new window.Sorter(document.getElementById('free'))
console.log(dragger2)

new window.Vue({
    el: '#app',
    data() {
        return {
            list: [1, 2, 3, 4, 5, 6, 7, 8],
        }
    },
    created() {
        this.list = [...Array(40)].map((n, i) => i)
    },
    mounted() {
        this.dragger = new window.Sorter(this.$refs.list, {
            change: false,
            handlerClassName: 'handler'
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
		<li class="item" v-for="it in list" :key="it">
		<p class="handler"></p>
		<span>item {{it}}</span>
</li>
	</ul>
  </div>
  `,
});
