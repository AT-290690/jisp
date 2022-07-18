import { VOID } from '../core/tokens.js';
import { HyperList } from './list.js';
export const consoleElement = document.getElementById('console');
export const editorContainer = document.getElementById('editor-container');
export const canvasContainer = document.getElementById('canvas-container');
export const mainContainer = document.getElementById('main-container');
export const focusButton = document.getElementById('focus-button');
export const appButton = document.getElementById('app-button');
// export const helpButton = document.getElementById('help');
// export const featuredButton = document.getElementById('featured');
// export const keyButton = document.getElementById('key');
export const headerContainer = document.getElementById('header');
export const fullRunButton = document.getElementById('full-run');
export const nextButton = document.getElementById('next');
// export const exitFullButton = document.getElementById('exit-full');
export const editorResizerElement = document.getElementById('editor-resizer');
export const consoleResizerElement = document.getElementById('console-resizer');
export const dowloadButton = document.getElementById('download');
export const alertIcon = document.getElementById('alert');
export const errorIcon = document.getElementById('error');
export const compositionContainer = document.getElementById(
  'composition-container'
);
const prefixDep = (dep, prefix = '') =>
  prefix
    ? Object.entries(dep).reduce((acc, [key, value]) => {
        if (!acc[prefix]) acc[prefix] = {};
        acc[prefix][key] = value;
        return acc;
      }, {})
    : Object.entries(dep).reduce((acc, [key, value]) => {
        add[key] = value;
        return acc;
      }, {});

export const print = function (...values) {
  if (values.length === 0) {
    return VOID;
  }
  values.forEach(
    x => (consoleElement.value += `[ ${JSON.stringify(x) ?? null} ]`)
  );
  return values;
};

const object = {
  has: (obj, ...props) => +props.every(x => x in obj),
  keys: obj => Object.keys(obj),
  values: obj => Object.values(obj),
  entries: obj => Object.entries(obj),
  fromEntries: entries => Object.fromEntries(entries),
  freeze: obj => void Object.freeze(obj) ?? obj,
  size: obj => Object.keys(obj).length,
  float32Array: (...items) => new Float32Array(items),
  float64Array: (...items) => new Float64Array(items)
  // set: (entity, prop, ...values) => entity[prop].set(...values),
  // get: (entity, prop) => entity[prop] ?? VOID
};
const array = {
  makeArray: (...items) => items,
  makeMatrix: (...dimensions) => {
    if (dimensions.length > 0) {
      const dim = dimensions[0];
      const rest = dimensions.slice(1);
      const arr = [];
      for (let i = 0; i < dim; i++) arr[i] = array.makeMatrix(...rest);
      return arr;
    } else {
      return VOID;
    }
  },
  unique: entity => {
    const set = new Set();
    return entity.reduce((acc, item) => {
      if (!set.has(item)) {
        set.add(item);
        acc.push(item);
      }
      return acc;
    }, []);
  },
  partition: (entity, groups = 1) =>
    entity.reduce((acc, _, index, arr) => {
      if (index % groups === 0) {
        const part = [];
        for (let i = 0; i < groups; i++) {
          part.push(arr[index + i]);
        }
        acc.push(part);
      }
      return acc;
    }, []),
  indexedIteration: (entity, fn) =>
    entity.forEach((x, i, arr) => fn(i)) ?? VOID,
  forOf: (entity, fn) => entity.forEach((x, i, arr) => fn(x)) ?? VOID,
  each: (entity, fn) => entity.forEach((x, i, arr) => fn(x, i)) ?? VOID,
  from: items => Array.from(items),
  transform: (entity, callback) => {
    for (let i = 0; i < entity.length; i++) {
      entity[i] = callback(entity[i], i, entity);
    }
    return entity;
  },
  tail: entity => {
    entity.shift();
    return entity;
  },
  head: entity => {
    entity.pop();
    return entity;
  },
  map: (entity, callback) => entity.map(callback),
  filter: (entity, callback) => entity.filter(callback),
  reduce: (entity, callback, acc) => entity.reduce(callback, acc),
  forEach: (entity, callback) => entity.forEach(callback),
  reverse: entity => entity.reverse(),
  insertAtEnd: (entity, ...args) => {
    entity.push(...args);
    return entity;
  },
  removeFromEnd: entity => {
    entity.pop();
    return entity;
  },
  push: (entity, ...args) => entity.push(...args),
  pop: entity => entity.pop(),
  includes: (entity, arg) => +entity.includes(arg),
  isArray: entity => +entity.isArray(),
  unshift: (entity, ...args) => entity.unshift(...args),
  shift: entity => entity.shift(),
  fill: (entity, filling) => entity.fill(filling),
  find: (entity, callback) => entity.find(callback) ?? VOID,
  findIndex: (entity, callback) => entity.findIndex(callback),
  indexOf: (entity, item) => entity.indexOf(item),
  some: (entity, callback) => +entity.some(callback),
  every: (entity, callback) => +entity.every(callback),
  split: (str, separator) => str.split(separator),
  join: (entity, separator) => entity.join(separator),
  flat: (entity, level) => entity.flat(level),
  flatMap: (entity, callback) => entity.flatMap(callback),
  sort: (entity, callback) => entity.sort(callback),
  slice: (entity, ...args) => entity.slice(...args),
  splice: (entity, ...args) => entity.splice(...args),
  range: (start, end, step = 1) => {
    const arr = [];
    if (start > end) {
      for (let i = start; i >= end; i -= 1) {
        arr.push(i * step);
      }
    } else {
      for (let i = start; i <= end; i += 1) {
        arr.push(i * step);
      }
    }
    return arr;
  },
  at: (entity, index) => entity.at(index)
};

export const protolessModule = methods => {
  const env = Object.create(null);
  for (const method in methods) {
    env[method] = methods[method];
  }
  return env;
};

const bitwise = protolessModule({
  ['!']: operand => +!operand,
  ['^']: (left, right) => left ^ right,
  ['>>>']: (left, right) => left >>> right,
  ['>>']: (left, right) => left >> right,
  ['<<']: (left, right) => left << right,
  ['~']: operand => ~operand,
  ['|']: (left, right) => left | right,
  ['&']: (left, right) => left & right
});

const operations = protolessModule({
  ['+']: (first, ...args) => args.reduce((acc, x) => (acc += x), first),
  ['-']: (first, ...args) => args.reduce((acc, x) => (acc -= x), first),
  ['*']: (first, ...args) => args.reduce((acc, x) => (acc *= x), first),
  ['/']: (first, ...args) => args.reduce((acc, x) => (acc /= x), first),
  ['==']: (first, ...args) => +args.every(x => first === x),
  ['!=']: (first, ...args) => +args.every(x => first != x),
  ['>']: (first, ...args) => +args.every(x => first > x),
  ['<']: (first, ...args) => +args.every(x => first < x),
  ['>=']: (first, ...args) => +args.every(x => first >= x),
  ['<=']: (first, ...args) => +args.every(x => first <= x),
  ['%']: (left, right) => left % right,
  ['**']: (left, right) => left ** (right ?? 2)
});

const isSimilar = (a, b) => {
  const typeA = typeof a,
    typeB = typeof b;
  if (typeA !== typeB) return 0;
  if (typeA === 'number' || typeA === 'string' || typeA === 'boolean') {
    return +(a === b);
  }
  if (typeA === 'object') {
    const isArrayA = Array.isArray(a),
      isArrayB = Array.isArray(b);
    if (isArrayA !== isArrayB) return 0;
    if (isArrayA && isArrayB) {
      return a.length < b.length
        ? +a.every((item, index) => isSimilar(item, b[index]))
        : +b.every((item, index) => isSimilar(item, a[index]));
    } else {
      if (a === undefined || a === null || b === undefined || b === null)
        return +(a === b);

      for (const key in a) {
        if (!isSimilar(a[key], b[key])) {
          return 0;
        }
      }
      return 1;
    }
  }
};
const isEqual = (a, b) => {
  const typeA = typeof a,
    typeB = typeof b;
  if (typeA !== typeB) return 0;
  if (typeA === 'number' || typeA === 'string' || typeA === 'boolean') {
    return +(a === b);
  }
  if (typeA === 'object') {
    const isArrayA = Array.isArray(a),
      isArrayB = Array.isArray(b);
    if (isArrayA !== isArrayB) return 0;
    if (isArrayA && isArrayB) {
      if (a.length !== b.length) return 0;
      return +a.every((item, index) => isEqual(item, b[index]));
    } else {
      if (a === undefined || a === null || b === undefined || b === null)
        return +(a === b);
      if (Object.keys(a).length !== Object.keys(b).length) return 0;
      for (const key in a) {
        if (!isEqual(a[key], b[key])) {
          return 0;
        }
      }
      return 1;
    }
  }
};

export const colors = {
  makeRgbColor: (r, g, b) => `rgb(${r}, ${g}, ${b})`,
  makeRgbAlphaColor: (r, g, b, a = 1) => `rgba(${r}, ${g}, ${b}, ${a})`,
  randomColor: () => `#${Math.floor(Math.random() * 16777215).toString(16)}`,
  randomLightColor: () =>
    '#' +
    ('00000' + Math.floor(Math.random() * Math.pow(16, 6)).toString(16)).slice(
      -6
    ),
  invertColor: hex =>
    '#' +
    (Number(`0x1${hex.split('#')[1]}`) ^ 0xffffff)
      .toString(16)
      .substr(1)
      .toUpperCase()
};
const list = {
  node: prev => next => ({ prev, next }),
  prev: n => n.prev,
  next: n => n.next,
  range: low => high =>
    low > high ? null : list.node(low)(list.range(low + 1)(high)),
  map: f => n =>
    n === null ? null : list.node(f(list.prev(n)))(list.map(f)(list.next(n))),
  nodeToArray: node => {
    const result = [];
    while (node !== null) {
      result.push(list.prev(node));
      node = list.next(node);
    }
    return result;
  },
  arrayToNode: arrayLike => {
    let result = null;
    const array = Array.from(arrayLike);
    for (let i = array.length; i >= 0; i--) {
      result = list.node(array[i])(result);
    }
    return result;
  }
};

const DOM = {
  // noCanvas: () => (canvasContainer.innerHTML = ''),
  makeUserInterface: () => {
    canvasContainer.innerHTML = '';
    const el = document.getElementById('_user-interface');
    if (!el) {
      const div = document.createElement('div');
      div.id = '_user-interface';
      const styles = document.createElement('style');
      styles.textContent = `
      ._user-interface-tooltip {
        position: relative;
        display: inline-block;
      }
      
      ._user-interface-tooltip ._user-interface-tooltiptext {
        visibility: hidden;
        width: 140px;
        background-color: #5c5fb8;
        font-weight: 900;
        text-align: center;
        border-radius: 2px;
        padding: 5px;
        position: absolute;
        z-index: 1;
        bottom: 150%;
        left: 50%;
        margin-left: -75px;
        opacity: 0;
        transition: opacity 0.3s;
      }
      
      ._user-interface-tooltip ._user-interface-tooltiptext::after {
        content: "";
        position: absolute;
        top: 100%;
        left: 50%;
        margin-left: -5px;
        border-width: 5px;
        border-style: solid;
        border-color: #5c5fb8 transparent transparent transparent;
      }
      ._user-interface-button {
        padding: 10px;
        cursor: pointer;
      }
      ._user-interface-button, ._user-interface-p, ._user-interface-span, ._user-interface-textarea, ._user-interface-input {
        color: #F4F4F4; 
        background:transparent;
      }
      ._user-interface-button, ._user-interface-textarea, ._user-interface-input {
        border: 1px solid #546a90;
      }
      ._user-interface-tooltip:hover ._user-interface-tooltiptext {
        visibility: visible;
        opacity: 1;
      }`;
      canvasContainer.appendChild(styles);
      canvasContainer.appendChild(div);
      div.style = 'max-height: 250px; height: 250px; overflow:"scroll';
      events.userInterface = div;
    }
  },
  makeInput: (width = '100px', height = '100px', settings) => {
    const element = document.createElement('input');
    element.classList.add('_user-interface-input');
    element.width = width;
    element.height = height;
    for (const setting in settings) {
      element.setAttribute(setting, settings[setting]);
    }
    return element;
  },
  makeStyleTag: (...classes) => {
    const styles = document.createElement('style');
    styles.textContent = classes.join('\n');
    return styles;
  },
  setAttributes: (entity, props) => {
    for (const prop in props) {
      entity.setAttribute(prop, props[prop]);
    }
    return entity;
  },
  makeClass: (name, attr) => {
    let out = '';
    for (const a in attr) {
      out += `${a}: ${attr[a]};`;
    }
    return `._user-interface-${name} {\n${out}\n}`;
  },
  makeTextArea: settings => {
    const element = document.createElement('textarea');
    element.classList.add('_user-interface-textarea');
    for (const setting in settings) {
      element.setAttribute(setting, settings[setting]);
    }
    return element;
  },
  makeSlider: settings => {
    const element = document.createElement('input');
    element.type = 'range';
    element.classList.add('_user-interface-slider');

    for (const setting in settings) {
      element.setAttribute(setting, settings[setting]);
    }
    return element;
  },
  copyFromElement: copyElement => {
    copyElement.select();
    copyElement.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(copyElement.value);
  },
  copyFromText: val => {
    console.log(val);
    navigator.clipboard.writeText(val);
  },
  makeTooltip: defaultLabel => {
    const tooltip = document.createElement('span');
    tooltip.classList.add('_user-interface-tooltiptext');
    tooltip.textContent = defaultLabel;
    return tooltip;
  },
  makeButton: () => {
    const element = document.createElement('button');
    element.classList.add('_user-interface-button');
    return element;
  },
  makeLabel: (element, label) => {
    element.textContent = label;
    return element;
  },
  onChange: (element, callback) => {
    element.addEventListener('change', callback);
    return element;
  },
  onClick: (element, callback) => {
    element.addEventListener('click', callback);
    return element;
  },
  makeParagraph: content => {
    const element = document.createElement('p');
    element.textContent = content;
    return element;
  },
  makeSpan: content => {
    const element = document.createElement('span');
    element.textContent = content;
    element.classList.add('_user-interface-span');
    return element;
  },
  makeStyle: (element, style) => {
    element.style = style;
    return element;
  },
  makeContainer: (...elements) => {
    const div = document.createElement('div');
    elements.forEach(element => div.appendChild(element));
    events.userInterface.appendChild(div);
    return div;
  },
  addClass: (element, ...classlist) => {
    classlist.forEach(cls => element.classList.add('_user-interface-' + cls));
    return element;
  },
  insertIntoContainer: (container, ...elements) => {
    elements.forEach(element => container.appendChild(element));
    return container;
  },
  removeSelfFromContainer: (...elements) =>
    elements.forEach(element => element.parentNode.removeChild(element))
};

const style = {
  makeStyle: (entity, props) => {
    for (const prop in props) {
      entity.style[prop] = props[prop];
    }
    return entity;
  }
};
const iterators = {
  generator: function* (entity = [], index = 0) {
    while (true) {
      yield entity[index++];
    }
  },
  counter: function* (index = 0) {
    while (true) {
      yield index++;
    }
  },
  next: entity => entity.next().value,
  iterate: (iterable, callback) => {
    for (const i in iterable) {
      callback(i, iterable);
    }
    return iterable;
  },
  inside: (iterable, callback) => {
    for (const i in iterable) {
      callback(i);
    }
    return iterable;
  },
  forOfEvery: (iterable, callback) => {
    for (const x of iterable) {
      callback(x);
    }
    return iterable;
  },
  routine: (entity, times, callback) => {
    let out = VOID;
    for (let i = 0; i < times; i++) out = callback(entity, i);
    return out;
  },
  loop: (start, end, callback) => {
    for (let i = start; i < end; i++) callback(i);
  },
  whileTrue: (condition, callback) => {
    let out = VOID;
    while (condition()) out = callback();
    return out;
  },
  repeat: (times, callback) => {
    let out = VOID;
    for (let i = 0; i < times; i++) out = callback(i);
    return out;
  }
};

const SetCollection = {
  from: arr => new Set(arr),
  makeSet: (...args) => new Set(args),
  has: (entity, item) => +entity.has(item),
  add: (entity, ...values) => {
    values.forEach(x => entity.add(x));
    return entity;
  },
  remove: (entity, ...values) => {
    values.forEach(x => entity.delete(x));
  },
  in: (entity, callback) => entity.forEach((x, i, a) => callback(x)),
  union: (a, b) => {
    const out = new Set();
    a.forEach(item => out.add(item));
    b.forEach(item => out.add(item));
    return out;
  },
  intersection: (a, b) => {
    const out = new Set();
    b.forEach(item => {
      if (a.has(item)) out.add(item);
    });
    return out;
  },
  difference: (a, b) => {
    const out = new Set();
    a.forEach(item => {
      if (!b.has(item)) out.add(item);
    });
    return out;
  },
  symetricDifference: (a, b) => {
    const out = new Set();
    b.forEach(item => {
      if (!a.has(item)) out.add(item);
    });
    a.forEach(item => {
      if (!b.has(item)) out.add(item);
    });
    return out;
  },
  clear: entity => entity.clear(),
  fromArray: (...array) => new Set(...array),
  toArray: entity => [...entity],
  size: entity => entity.size
};
const time = {
  makeDate: date => new Date(date),
  currentTime: () => new Date().getTime(),
  currentDate: () => new Date(),
  getHour: date => date.getHours(),
  getMinute: date => date.getMinutes(),
  getSecond: date => date.getSeconds(),
  setInterval: (fn, ms) => setInterval(() => fn(), ms),
  clearInterval: id => clearInterval(id),
  setTimeout: (fn, ms) => setTimeout(() => fn(), ms),
  clearTimeout: id => clearTimeout(id)
};
export const STD = {
  void: VOID,
  VOID,
  tco:
    func =>
    (...args) => {
      let result = func(...args);
      while (typeof result === 'function') {
        result = result();
      }
      return result;
    },
  '#': args => void print(args) ?? args,
  ...bitwise,
  ...operations
};
const events = {
  events: {},
  makeEvent: (entity, type, callback) => {
    entity.renderer.elem.addEventListener(type, callback);
  },
  click: (entity, callback) => {
    entity.renderer.elem.addEventListener('click', callback);
  },
  keyDown: callback =>
    void (events.events['keydown'] = e => callback(e)) ??
    window.addEventListener('keydown', events.events['keydown']),
  keyUp: callback =>
    void (events.events['keyup'] = e => callback(e)) ??
    window.addEventListener('keyup', events.events['keyup'])
};
const math = {
  mod: (left, right) => ((left % right) + right) % right,
  clamp: (num, min, max) => Math.min(Math.max(num, min), max),
  sqrt: num => Math.sqrt(num),
  add: (a, b) => a + b,
  sub: (a, b) => a - b,
  mult: (a, b) => a * b,
  pow: (a, b) => a ** b,
  divide: (a, b) => a / b,
  sign: n => Math.sign(n),
  trunc: n => Math.trunc(n),
  exp: n => Math.exp(n),
  floor: n => Math.floor(n),
  round: n => Math.round(n),
  random: () => Math.random(),
  dice: (min, max) => Math.floor(Math.random() * (max - min + 1) + min),
  max: (...args) => Math.max(...args),
  min: (...args) => Math.min(...args),
  sin: n => Math.sin(n),
  cos: n => Math.cos(n),
  tan: n => Math.tan(n),
  atan: n => Math.atan(n),
  atan2: (y, x) => Math.atan2(y, x),
  log10: x => Math.log10(x),
  log2: x => Math.log2(x),
  log: x => Math.log(x),
  sum: arr => arr.reduce((acc, item) => (acc += item), 0),
  minInt: Number.MIN_SAFE_INTEGER,
  maxInt: Number.MAX_SAFE_INTEGER,
  infinity: Number.POSITIVE_INFINITY,
  PI: Math.PI,
  parseInt: (number, base) => parseInt(number.toString(), base),
  toNumber: string => Number(string)
};
const request = {
  maybeJson: (url, callback) =>
    fetch(url)
      .then(res => res.json())
      .then(res => callback(res, VOID))
      .catch(err => callback(VOID, err)),
  maybeText: (url, callback) =>
    fetch(url)
      .then(res => res.json())
      .then(res => callback(res, VOID))
      .catch(err => callback(VOID, err))
};
const HL = {
  makeHyperList: (...items) => new HyperList(items),
  mutex: (entity, fn) => entity.mapMut(fn),
  toArray: entity => entity.toArray(),
  map: (entity, fn) => entity.map(fn),
  filter: (entity, fn) => entity.filter(fn),
  every: (entity, fn) => +entity.every(fn),
  some: (entity, fn) => +entity.some(fn),
  find: (entity, fn) => entity.find(fn) ?? VOID,
  findIndex: (entity, fn) => entity.findIndex(fn),
  at: (entity, index) => entity.at(index) ?? VOID,
  join: (entity, separator) => entity.join(separator),
  union: (a, b) => {
    const out = new HyperList();
    const A = new Set(a.toArray());
    const B = new Set(b.toArray());
    A.forEach(item => out.push(item));
    B.forEach(item => out.push(item));
    out.balance();
    return out;
  },
  symetricDifference: (a, b) => {
    const out = new HyperList();
    const A = new Set(a.toArray());
    const B = new Set(b.toArray());
    B.forEach(item => {
      if (!A.has(item)) out.push(item);
    });
    A.forEach(item => {
      if (!B.has(item)) out.push(item);
    });
    out.balance();
    return out;
  },
  intersection: (a, b) => {
    const out = new HyperList();
    const A = new Set(a.toArray());
    const B = new Set(b.toArray());
    B.forEach(item => {
      if (A.has(item)) out.push(item);
    });
    out.balance();
    return out;
  },
  difference: (a, b) => {
    const out = new HyperList();
    const A = new Set(a.toArray());
    const B = new Set(b.toArray());
    A.forEach(item => {
      if (!B.has(item)) out.push(item);
    });
    out.balance();
    return out;
  },
  partition: (entity, groups = 1) => {
    const res = entity.reduce((acc, _, index, arr) => {
      if (index % groups === 0) {
        const part = new HyperList();
        for (let i = 0; i < groups; i++) {
          part.push(arr.get(index + i));
        }
        part.balance();
        acc.push(part);
      }
      return acc;
    }, new HyperList());
    res.balance();
    return res;
  },
  flat: (entity, level) => entity.flat(level),
  unique: entity => {
    const set = new Set();
    return HyperList.from(
      entity.reduce((acc, item) => {
        if (!set.has(item)) {
          set.add(item);
          acc.push(item);
        }
        return acc;
      }, [])
    );
  },
  tail: entity => {
    entity.shift();
    return entity;
  },
  head: entity => {
    entity.pop();
    return entity;
  },
  rotate: (entity, n, direction) => {
    entity.rotate(n, direction);
    return entity;
  },
  balance: entity => {
    entity.balance();
    return entity;
  },
  append: (entity, item) => {
    entity._addToRight(item);
    return entity;
  },

  prepend: (entity, item) => {
    entity._addToLeft(item);
    return entity;
  },
  empty: entity => {
    entity.clear();
    return entity;
  },
  isEmpty: entity => +!entity.size,
  reverse: entity => entity.reverse(),
  reduce: (entity, fn, initial) => entity.reduce(fn, initial),
  from: data => HyperList.from(data),
  sort: (entity, fn) => entity.sort(fn),
  last: entity => entity.get(entity.size - 1),
  first: entity => entity.get(0),
  pivot: entity => entity.pivot(),

  isHyperList: entity => +entity.isHyperList(),
  includes: (entity, arg) => +entity.includes(arg),
  splice: (entity, ...args) => entity.splice(...args),
  sum: entity => entity.reduce((acc, x) => (acc += x), 0),
  for: (entity, fn) => {
    entity.forEach((x, i) => fn(x, i));
    return entity;
  },
  each: (entity, fn) => {
    entity.forEach(fn);
    return entity;
  },
  range: (start, end, step = 1) => {
    const arr = new HyperList();
    if (start > end) {
      for (let i = start; i >= end; i -= 1) {
        arr.push(i * step);
      }
    } else {
      for (let i = start; i <= end; i += 1) {
        arr.push(i * step);
      }
    }
    arr.balance();
    return arr;
  },
  slice: (entity, ...args) => entity.slice(...args)
};
export const store = {};
export const deps = {
  ...prefixDep(style, 'STYLE'),
  ...prefixDep(DOM, 'DOM'),
  ...prefixDep({ io: key => store[key] }, 'IO'),
  ...prefixDep(HL, 'HYPERLIST'),
  ...prefixDep(time, 'TIME'),
  ...prefixDep(list, 'LIST'),
  ...prefixDep(array, 'ARRAY'),
  ...prefixDep(SetCollection, 'SET'),
  ...prefixDep(math, 'MATH'),
  ...prefixDep(
    {
      print,
      printLog: thing => console.log(...print(thing)),
      consoleLog: thing => console.log(thing)
    },
    'CONSOLE'
  ),
  ...prefixDep(
    {
      interpolate: (...args) =>
        args.reduce((acc, item) => (acc += item.toString()), ''),
      includes: (string, target) => string.includes(target),
      toString: thing => thing.toString(),
      toUpperCase: string => string.toUpperCase(),
      toLowerCase: string => string.toLowerCase(),
      trim: string => string.trim(),
      trimStart: string => string.trimStart(),
      trimEnd: string => string.trimEnd(),
      replace: (string, match, replace) => string.replace(match, replace),
      sp: ' '
    },
    'STRING'
  ),
  ...prefixDep(object, 'OBJECT'),
  ...prefixDep(
    {
      isTrue: bol => +(!!bol === true),
      isFalse: bol => +(!!bol === false),
      isEqual: isEqual,
      isSimilar: isSimilar,
      isDefined: item => (item === VOID ? 0 : 1),
      isUndefined: item => (item === VOID ? 1 : 0),
      makeBoolean: item => Boolean(item),
      isEmpty: item => (Object.keys(item).length === 0 ? 1 : 0),
      true: 1,
      false: 0,
      invert: val => +!val,
      isHaving: (obj, ...props) => +props.every(x => x in obj),
      areEqual: (item, ...args) =>
        +args.every(current => isEqual(item, current))
    },
    'LOGIC'
  ),
  ...prefixDep(iterators, 'LOOP'),
  ...prefixDep(colors, 'COLOR'),
  ...prefixDep(request, 'REQUEST')
};
