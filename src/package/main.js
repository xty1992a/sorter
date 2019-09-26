/**
 * Created by TY-xie on 2018/3/29.
 */
import {css, getParentByClassName, isMobile, passiveFlag} from './dom'

//  region 工具函数
class Rect {
    constructor(opt) {
        Object.assign(this, opt)
    }

    get centerX() {
        return this.left + this.width / 2
    }

    get centerY() {
        return this.top + this.height / 2
    }

    get bottom() {
        return this.top + this.height
    }

    get right() {
        return this.left + this.width
    }
}

const helper = {
    // 获得元素相对于父元素的位置
    getPosOfParent(el) {
        let parent = el.parentNode
        let pR = parent.getBoundingClientRect()
        let cR = el.getBoundingClientRect()
        return new Rect({
            width: cR.width,
            height: cR.height,
            top: cR.top - pR.top,
            left: cR.left - pR.left,
            // right: cR.right - pR.left,
            // bottom: cR.bottom - pR.top,  // 子元素的bottom为距离父元素顶部的距离
            index: el.dataset.hasOwnProperty('index') ? +el.dataset.index : -1,
        })
    },
    isCover(rect1, rect2, isY = true) {
        if (isY) {
            let max = Math.max(rect1.centerY, rect2.centerY)
            let min = Math.min(rect1.centerY, rect2.centerY)
            return (max - min) < ((rect1.height + rect2.height) / 2)
        } else {
            let max = Math.max(rect1.centerX, rect2.centerX)
            let min = Math.min(rect1.centerX, rect2.centerX)
            return (max - min) < ((rect1.width + rect2.width) / 2)
        }
    },

    // 点是否在矩形内
    isHit(point, rect) {
        let {x, y} = point
        let {left, top, right, bottom} = rect
        return !(x < left || x > right || y < top || y > bottom)
    },
}

// 事件名称
const events = {
    down: isMobile ? 'touchstart' : 'mousedown',
    move: isMobile ? 'touchmove' : 'mousemove',
    up: isMobile ? 'touchend' : 'mouseup',
}

// endregion

// 允许类绑定回调
class EmitAble {
    task = {}

    on(event, callback) {
        this.task[event] = callback
    }

    fire(event, payload) {
        this.task[event] && this.task[event](payload)
    }
}

// 默认参数
const initialOption = {
    change: true,
    handlerClassName: 'drag-item', // 把手className
    dragClassName: 'drag-item', // 可拖拽项的className
    fireTime: 0 //触发时间
};


export default class Main extends EmitAble {
    // region props
    children = []
    rectList = []         // 元素的位置数组

    point = null          // 手指/鼠标落点的信息
    drag = null
    dragIndex = -1        // 手指/鼠标落点的索引
    moveRect = null
    destroyed = false

    timer = 0  //长按计时器

    constructor(el, opt) {
        super()
        this.$el = el
        this.$options = {...initialOption, ...opt}
        this.$init()
    }

    // endregion

    get currentRect() {
        return this.rectList[this.dragIndex] || null
    }

    $init() {
        this.freshThreshold()
        this.listen()
    }

    // 自动交换元素
    changeItem({source, target}) {
        if (source === target) return;

        const parent = this.$el;

        let list = [...parent.children];

        // 取出被拖拽元素
        let temp = list.splice(source, 1);
        // 截取开头到被交换位置的元素
        let start = list.splice(0, target);
        // 组装成结果数组
        list = [...start, ...temp, ...list];


        // 用fragment优化dom操作.
        const frag = document.createDocumentFragment();
        list.forEach(el => frag.appendChild(el));
        parent.innerHTML = '';
        parent.appendChild(frag);

        // 刷新dragger实例
        this.freshThreshold();
    }

    // 获取元素槛值
    freshThreshold() {
        if (this.destroyed) return
        this.children = [...this.$el.getElementsByClassName(this.$options.handlerClassName)]
        this.children.forEach((child, index) => {
            child.classList.add(this.$options.dragClassName)
            child.dataset.index = index
        })
        this.rectList = this.children.map(child => helper.getPosOfParent(child))
    }

    // 监听事件
    listen() {
        this.$el.addEventListener(events.down, this.$options.fireTime ? this.downHandler : this.down, passiveFlag)
        this.$el.addEventListener(events.move, this.move, passiveFlag)
        document.addEventListener(events.up, this.up, passiveFlag)
    }

    unbindListener() {
        this.$el.removeEventListener(events.down, this.$options.fireTime ? this.downHandler : this.down)
        this.$el.removeEventListener(events.move, this.move)
        document.removeEventListener(events.up, this.up)
    }

    effectSibling(e) {
        let move = this.moveRect
        let point = {
            x: move.centerX,
            y: move.centerY,
        }
        // 找到移动块中心点进入了哪个块
        let hitIndex = this.rectList.findIndex(rect => helper.isHit(point, rect))
        if (hitIndex === -1) return
        if (this.hidIndex === hitIndex) return
        this.hidIndex = hitIndex
        if (hitIndex === move.index) {
            this.insetHolder(move.index)
        }
        // 往左上移动
        else if (hitIndex < move.index) {
            this.insetHolder(hitIndex)
        }
        // 往右下移动
        else {
            this.insetHolder(hitIndex + 1)
        }
    }

    animate(div) {
        let width = parseInt(div.style.width)
        div.style.width = 0
        div.style.transition = '.1s'
        setTimeout(() => {
            div.style.width = width + 'px'
            setTimeout(() => {
                div.style.transition = ''
            }, 120)
        }, 10)
    }

    insetHolder(index) {
        let div = this.getHolder()
        // this.animate(div)
        this.$el.insertBefore(div, this.$el.children[index])
    }

    getHolder() {
        if (this.$holderEl) return this.$el.removeChild(this.$holderEl)
        let el = this.$holderEl = document.createElement('div')
        let {width, height} = this.moveRect
        el.className = 'sorter-holder'
        el.style.width = width + 'px'
        el.style.height = height + 'px'
        el.style.background = '#f7f7f7'

        return el
    }

    downHandler = (e) => {
        //console.log('按下');
        this.timer = setTimeout(() => {
            clearTimeout(this.timer);
            this.timer = 0;
            this.down(e);

            try {
                if (api.systemType === 'ios') {
                    api.require('vibrateUtil').shortPop();
                } else {
                    // api.notification({
                    //     vibrate: [0, 50]
                    // });
                    // 好像安卓长按自带震动
                }
            } catch (e) {
                //console.log('请使用APICloud和vibrateUtil模块')
            }

        }, this.$options.fireTime)
    }

    down = (e) => {
        if (this.destroyed) return
        const handler = getParentByClassName(e.target, this.$options.handlerClassName)
        if (!handler) return
        let target = getParentByClassName(e.target, this.$options.dragClassName)
        if (!target) return
        this.moved = false
        this.downTime = new Date().getTime()
        this.dragStart = true
        let {clientX, clientY} = e.touches ? e.touches[0] : e
        this.drag = target
        let move = this.moveRect = helper.getPosOfParent(this.drag)
        css(target, {
            zIndex: 10,
            width: move.width + 'px',
            height: move.height + 'px',
            left: move.left + 'px',
            top: move.top + 'px',
            position: 'absolute',
        })
        this.dragIndex = +target.dataset.index
        target.classList.add('drag-handler')
        this.insetHolder(move.index)
        let rect = target.getBoundingClientRect()
        this.point = {
            posX: clientX - rect.left,
            posY: clientY - rect.top,
            startX: clientX,
            startY: clientY,
            moveX: clientX,
            moveY: clientY,
        }
    }

    move = (e) => {
        clearTimeout(this.timer);
        this.timer = 0;

        if (this.destroyed) return
        if (!this.dragStart) return
        e.preventDefault()
        this.moved = true
        let point = e.touches ? e.touches[0] : e
        let {clientX, clientY} = point
        let {startX, startY} = this.point
        let deltaY = clientY - startY
        let deltaX = clientX - startX
        this.moveRect.top = this.currentRect.top + deltaY
        this.moveRect.left = this.currentRect.left + deltaX
        css(this.drag, {
            transform: `translate3d(${deltaX}px,${deltaY}px,0)`,
        })
        this.point.moveX = clientX
        this.point.moveY = clientY
        this.effectSibling(point)
        return false
    }

    up = (e) => {
        //console.log('松开')
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = 0;
            //console.log('点击了')
        } else {
            //console.log('长按了')
        }
        if (this.destroyed) return
        if (!this.dragStart) return


        e.preventDefault()
        let targetIndex = this.hidIndex
        this.dragStart = false
        this.point = null
        this.$el.removeChild(this.$holderEl)
        this.$holderEl = null
        this.drag.style = null
        this.drag.classList.remove('drag-handler')
        let gapTime = new Date().getTime() - this.downTime
        if (this.moved && gapTime > 100) {
            let pos = {
                source: this.dragIndex,
                target: targetIndex,
            }
            this.fire('drag-over', pos)
            this.$options.change && this.changeItem(pos)
        } else {
            this.fire('click-over', {index: this.dragIndex, rect: this.currentRect})
        }
        this.drag = null
        this.moveRect = null
        this.dragIndex = -1
        return false
    }

    destroy() {
        this.destroyed = true
        this.unbindListener()
    }
}
