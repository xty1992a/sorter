/**
 * Created by TY-xie on 2018/3/29.
 */
import {addClass, addStyle, css, getParentByClassName, isMobile, passiveFlag, removeClass,} from "./dom";

// 缓存可能存在的同名对象
const oldSorter = window.Sorter;
addStyle(`
.sorter-item__on-drag-start{
  box-shadow: 0 0 20px rgba(0,0,0,0.1);
  transition: .2s;
}
.sorter-item__on-drag{
  box-shadow: 0 0 20px rgba(0,0,0,0.1);
}
`);

//  region 工具函数
class Rect {
  constructor(opt) {
    Object.assign(this, opt);
  }

  get centerX() {
    return this.left + this.width / 2;
  }

  get centerY() {
    return this.top + this.height / 2;
  }

  get bottom() {
    return this.top + this.height;
  }

  get right() {
    return this.left + this.width;
  }
}

const helper = {
  // 获得元素相对于父元素的位置
  getPosOfParent(el) {
    let parent = el.parentNode;
    let pR = parent.getBoundingClientRect();
    let cR = el.getBoundingClientRect();
    return new Rect({
      width: cR.width,
      height: cR.height,
      top: cR.top - pR.top,
      left: cR.left - pR.left,
      index: el.dataset.hasOwnProperty("index") ? +el.dataset.index : -1,
    });
  },
  isCover(rect1, rect2, isY = true) {
    if (isY) {
      let max = Math.max(rect1.centerY, rect2.centerY);
      let min = Math.min(rect1.centerY, rect2.centerY);
      return max - min < (rect1.height + rect2.height) / 2;
    } else {
      let max = Math.max(rect1.centerX, rect2.centerX);
      let min = Math.min(rect1.centerX, rect2.centerX);
      return max - min < (rect1.width + rect2.width) / 2;
    }
  },

  // 点是否在矩形内
  isHit(point, rect) {
    let {x, y} = point;
    let {left, top, right, bottom} = rect;
    return !(x < left || x > right || y < top || y > bottom);
  },
};

const order = ([min, max]) => min < max ? [min, max] : [max, min];

// 事件名称
const events = {
  down: isMobile ? "touchstart" : "mousedown",
  move: isMobile ? "touchmove" : "mousemove",
  up: isMobile ? "touchend" : "mouseup",
};

// endregion

// 允许类绑定回调
class EmitAble {
  task = {};

  on(event, callback) {
    this.task[event] = callback;
  }

  fire(event, payload) {
    this.task[event] && this.task[event](payload);
  }
}

// 默认参数
const initialOption = {
  change: true,
  animateDuration: 100, // 动画持续时间
  handlerClassName: "sorter-item", // 把手className
  sorterItemClassName: "sorter-item", // 可拖拽项的className
  disableClassName: "sorter-disabled",
  onDragClassName: "sorter-item__on-drag",
  onDragStartClassName: "sorter-item__on-drag-start",
  pressDuration: 0, // 长按多久可拖拽,默认无需长按
  vibrate: () => void 0,
};

export default class Sorter extends EmitAble {
  // region props
  children = [];
  rectList = []; // 元素的位置数组

  point = null; // 手指/鼠标落点的信息
  drag = null;
  dragIndex = -1; // 手指/鼠标落点的索引
  moveRect = null;
  destroyed = false;

  constructor(el, opt) {
    super();
    this.$el = el;
    this.$options = {...initialOption, ...opt};
    if (!opt.hasOwnProperty("vibrate")) {
      this.$options.vibrate = () => {
        if (!this.$options.pressDuration) return;
        try {
          window.navigator.vibrate && window.navigator.vibrate(100);
        } catch (e) {
          console.log("vibrate error", e);
        }
      };
    }
    this.$init();
  }

  // endregion

  get currentRect() {
    return this.rectList[this.dragIndex] || null;
  }

  static noConflict() {
    window.Sorter = oldSorter;
    return Sorter;
  }

  noticeDragStart(target) {
    try {
      this.$options.vibrate && this.$options.vibrate();
      addClass(target, this.$options.onDragStartClassName);
      setTimeout(() => {
        removeClass(target, this.$options.onDragStartClassName);
      }, 200);
    } catch (e) {
      console.error(e);
    }
  }

  $init() {
    this.freshThreshold();
    this.listen();
  }

  // 自动交换元素
  changeItem({source, target}) {
    if (source === target) return;
    const parent = this.$el;

    const s = parent.removeChild(parent.children[source]);
    parent.insertBefore(s, parent.children[target]);

    // 刷新dragger实例
    this.freshThreshold();
  }

  // 提供给调用者的排序方法.
  sortList(list, source, target) {
    list = [...list];
    let temp = list.splice(source, 1);
    // 截取开头到被交换位置的元素
    let start = list.splice(0, target);
    // 组装成结果数组

    return [...start, ...temp, ...list];
  }

  // 获取元素槛值
  freshThreshold() {
    if (this.destroyed) return;
    this.children = [...this.$el.children];
    this.children.forEach((child, index) => {
      addClass(child, this.$options.sorterItemClassName);
      child.dataset.index = index;
    });
    this.rectList = this.children.map((child) => helper.getPosOfParent(child));
  }

  fresh() {
    this.freshThreshold();
  }

  // 监听事件
  listen() {
    this.$el.addEventListener(events.down, this.down, passiveFlag);
    this.$el.addEventListener(events.move, this.move, passiveFlag);
    document.addEventListener(events.up, this.up, passiveFlag);
  }

  unbindListener() {
    this.$el.removeEventListener(events.down, this.down);
    this.$el.removeEventListener(events.move, this.move);
    document.removeEventListener(events.up, this.up);
  }

  effectSibling(e) {
    let move = this.moveRect;
    let point = {
      x: move.centerX,
      y: move.centerY,
    };
    // 找到移动块中心点进入了哪个块
    let hitIndex = this.rectList.findIndex((rect) => helper.isHit(point, rect));
    if (hitIndex === -1) return;
    if (this.hidIndex === hitIndex) return;
    this.hidIndex = hitIndex;

    let index = move.index;
    if (hitIndex === move.index) {
    }
    // 往左上移动
    else if (hitIndex < move.index) {
      index = hitIndex;
    }
    // 往右下移动
    else {
      index = hitIndex + 1;
    }
    this.animate(index);
    // this.insetHolder(index);
  }

  animate(index) {
    const duration = this.$options.animateDuration;
    if (duration <= 0) return this.insetHolder(index);
    if (!this.hasOwnProperty("lastInsetIndex")) this.lastInsetIndex = this.moveRect.index;
    //过滤出受影响的dom
    const [min, max] = order([index, this.lastInsetIndex]);
    // 保存每次的插入索引
    this.lastInsetIndex = index;
    const effectElList = this.children.slice(min, max);

    // 获取其位置信息
    const rectList = effectElList.map((child) => helper.getPosOfParent(child));
    // 调整holder位置
    this.insetHolder(index);
    // 延时保证逻辑在位置交换完（insetHolder）之后执行
    effectElList.forEach((child, index) => {
      if (child === this.drag) return;
      // 此时获取的位置信息是交换后的
      const now = helper.getPosOfParent(child);
      const old = rectList[index];

      css(child, {
        // 使dom在当前位置偏移，回到交换前的位置
        transform: `translate3d(${old.left - now.left}px, ${old.top - now.top}px, 0)`
      });
      // 再次延时，使上面的位置偏移生效
      setTimeout(() => {
        // 取消偏移，dom回到原位（交换后的位置），并设置过渡，使效果可见
        css(child, {
          transition: duration + "ms",
          transform: "translate3d(0,0,0)"
        });
        // 过渡结束，清除样式
        setTimeout(() => {
          child.style.transition = "";
          child.style.transform = "";
        }, duration);
      }, 20);
    });
  }

  insetHolder(index) {
    let div = this.getHolder();
    this.$el.insertBefore(div, this.$el.children[index]);
  }

  getHolder() {
    if (this.$holderEl) return this.$el.removeChild(this.$holderEl);
    let el = (this.$holderEl = document.createElement("div"));
    let {width, height} = this.moveRect;
    el.className = "sorter-holder";
    el.style.width = width + "px";
    el.style.height = height + "px";
    el.style.background = "#f7f7f7";

    return el;
  }

  down = (e) => {
    if (this.destroyed) return;
    const handler = getParentByClassName(
      e.target,
      this.$options.handlerClassName
    );
    if (!handler) return;
    const disableEl = getParentByClassName(
      e.target,
      this.$options.disableClassName
    );
    if (disableEl) return;
    let target = getParentByClassName(
      e.target,
      this.$options.sorterItemClassName
    );
    if (!target) return;
    this.fire("drag-down");
    this.moved = false;
    this.downTime = new Date().getTime();
    let {clientX, clientY} = e.touches ? e.touches[0] : e;
    let rect = target.getBoundingClientRect();
    this.point = {
      posX: clientX - rect.left,
      posY: clientY - rect.top,
      startX: clientX,
      startY: clientY,
      moveX: clientX,
      moveY: clientY,
    };

    // 延迟一段时间再处理dom
    this.__pressTimer = setTimeout(() => {
      this.fire("drag-start");
      this.noticeDragStart(target);
      this.drag = target;
      this.dragStart = true;
      this.cachedStyle = target.getAttribute("style");
      let move = (this.moveRect = helper.getPosOfParent(this.drag));
      this.dragIndex = +target.dataset.index;

      css(target, {
        zIndex: 10,
        width: move.width + "px",
        height: move.height + "px",
        left: move.left + "px",
        top: move.top + "px",
        position: "absolute",
      });

      addClass(target, this.$options.onDragClassName);
      this.insetHolder(move.index);
    }, this.$options.pressDuration);
  };

  move = (e) => {
    // 一旦移动取消延迟的start操作
    clearTimeout(this.__pressTimer);
    if (this.destroyed) return;
    if (!this.dragStart) return;
    removeClass(this.drag, this.$options.onDragStartClassName);
    this.moved = true;
    e.preventDefault();
    let point = e.touches ? e.touches[0] : e;
    let {clientX, clientY} = point;
    let {startX, startY} = this.point;
    let deltaY = clientY - startY;
    let deltaX = clientX - startX;
    this.moveRect.top = this.currentRect.top + deltaY;
    this.moveRect.left = this.currentRect.left + deltaX;
    css(this.drag, {
      transform: `translate3d(${deltaX}px,${deltaY}px,0)`,
    });
    this.point.moveX = clientX;
    this.point.moveY = clientY;
    this.effectSibling(point);
    return false;
  };

  up = (e) => {
    // 一旦移动取消延迟的start操作
    clearTimeout(this.__pressTimer);
    if (this.destroyed) return;
    if (!this.dragStart) return;
    e.preventDefault();
    let targetIndex = this.hidIndex;
    this.dragStart = false;
    this.point = null;
    this.$el.removeChild(this.$holderEl);
    this.$holderEl = null;
    this.drag.setAttribute("style", this.cachedStyle || "");
    removeClass(this.drag, this.$options.onDragClassName);
    let gapTime = new Date().getTime() - this.downTime;
    if (this.moved && gapTime > 100) {
      let pos = {
        source: this.dragIndex,
        target: targetIndex,
      };
      this.fire("drag-over", pos);
      this.$options.change && this.changeItem(pos);
    } else {
      this.fire("click-over", {
        index: this.dragIndex,
        rect: this.currentRect,
      });
    }
    this.drag = null;
    this.moveRect = null;
    this.dragIndex = -1;
    return false;
  };

  destroy() {
    this.destroyed = true;
    this.unbindListener();
  }
}
