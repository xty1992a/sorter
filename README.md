## 这是一个用于拖拽排序的包.

### DEMO
[DEMO](https://codepen.io/xty1992a/pen/GzLggR)

### 安装
`npm i @redbuck/sorter`或者
`yarn add @redbuck/sorter`

### 引入
插件打包格式为UMD

因此既可以使用`<script>`标签引入,然后直接使用`window.Sorter`

也可以通过`import`或`require`的方式引入.
> 注意,插件使用了部分ES6API,如需兼容需要添加polyfill或者配置babel-runtime等.

### 使用
1. 一般用法
```html
<ul class="free" id="free">
  <li class="item item-1">item-1</li>
  <li class="item item-2">item-2</li>
  <li class="item item-3">item-3</li>
  <li class="item item-4">item-4</li>
  <li class="item item-5">item-5</li>
  <li class="item item-6">item-6</li>
  <li class="item item-7">item-7</li>
  <li class="item item-8">item-8</li>
</ul>
 ```

```javascript
new Sorter(document.getElementById('free'))
 ```

2. 结合MVVM框架
以VUE为例
```
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
  }
```
知道了需要交换位置的元素,开发者可以自行操作数据,示例如下
```
	changeItem({source, target}) {
	  let list = this.list;
	  let temp = list.splice(source, 1);
	  let start = list.splice(0, target);
	  // do something
	  this.list = [...start, ...temp, ...list];
	},
```

### 预览
1. 运行`git clone https://github.com/xty1992a/sorter.git`
2. 进入项目根目录,运行`npm i`或`yarn`
3. 运行`npm run dev`
4. 浏览器查看`localhost:8080`


