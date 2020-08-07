const elementStyle = document.createElement("div").style;

const vendor = (() => {
  let transformNames = {
    webkit: "webkitTransform",
    Moz: "MozTransform",
    O: "OTransform",
    ms: "msTransform",
    standard: "transform",
  };

  for (let key in transformNames) {
    if (elementStyle[transformNames[key]] !== undefined) {
      return key;
    }
  }

  return false;
})();

export function prefixStyle(style) {
  if (vendor === false) {
    return false;
  }

  if (vendor === "standard") {
    if (style === "transitionEnd") {
      return "transitionend";
    }
    return style;
  }

  return vendor + style.charAt(0).toUpperCase() + style.substr(1);
}

export function getParentByClassName(
  el,
  className,
  stop = document.documentElement
) {
  if (hasClass(el, className)) return el;
  let parent = el.parentNode;
  let target = null;
  while (parent) {
    if (parent === stop) {
      return null;
    }
    if (hasClass(parent, className)) {
      return parent;
    }
    parent = parent.parentNode;
  }
  return target;
}

export function css(el, style) {
  Object.keys(style).forEach((k) => {
    let val = style[k];
    if (["transform", "transition"].includes(k)) {
      k = prefixStyle(k);
    }
    el.style[k] = val;
  });
}

export function hasClass(el, className) {
  return el.classList.contains(className);
  // todo classList的polyfill
  // return el.className.indexOf(className) !== -1;
}

export function addClass(el, className) {
  if (hasClass(el, className)) return;
  el.className = `${el.className} ${className}`;
}

export function removeClass(el, className) {
  if (!hasClass(el, className)) return;
  el.className = el.className.replace(className, "").replace(/\s{2,}/, " ");
}

export const isMobile = (() => {
  return [
    "Android",
    "iPhone",
    "SymbianOS",
    "Windows Phone",
    "iPad",
    "iPod",
  ].some((k) => navigator.userAgent.indexOf(k) > 0);
})();

let supportsPassive = false;
try {
  const opts = Object.defineProperty({}, "passive", {
    get: function () {
      supportsPassive = true;
    },
  });
  window.addEventListener("test", null, opts);
} catch (e) {
  console.log("not support passive");
}

export const passiveFlag =
  isMobile && supportsPassive ? { passive: false } : false;

export const addStyle = (styles) => {
  const style = document.createElement("style");
  style.innerText = styles;
  document.head.appendChild(style);
};
