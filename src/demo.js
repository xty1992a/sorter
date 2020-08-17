// 未编译API,需要引入polyfill
// eruda.init();
import "core-js";
import Sorter from "./package/main";

window.Sorter = Sorter;
// 一般用法
const sorter = new window.Sorter(document.getElementById("free"), {
  animateDuration: 0,
  pressDuration: 300,
});
console.log(sorter);

new window.Vue({
  el: "#app",
  data() {
    return {
      list: [...Array(40)].map((n, i) => i),
    };
  },
  mounted() {
    this.dragger = new window.Sorter(this.$refs.list, {
      change: false,
      animateDuration: 300,
      handlerClassName: "handler",
    });
    this.dragger.on("drag-over", (pos) => {
      this.changeItem(pos);
      setTimeout(() => {
        this.dragger.freshThreshold();
      }, 20);
    });
  },
  methods: {
    changeItem({source, target}) {
      this.list = this.dragger.sortList(this.list, source, target);
    },
  },
  template: `
  <div class="app">
	<ul class="free list" ref="list">
		<li class="item" v-for="it in list" :key="it">
				<p class="handler"><span class="del-btn sorter-disabled"></span></p>
				<span>item {{it}}</span>
		</li>
	</ul>
  </div>
  `,
});
