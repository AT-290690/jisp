import { VOID } from '../core/tokens.js';
export const consoleElement = document.getElementById('console');
export const editorContainer = document.getElementById('editor-container');
export const mainContainer = document.getElementById('main-container');
export const logoButton = document.getElementById('run');
export const helpButton = document.getElementById('help');
export const headerContainer = document.getElementById('header');
export const fullRunButton = document.getElementById('full-run');

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
    x => (consoleElement.value += `( ${JSON.stringify(x) ?? null} )`)
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
  makeArray: (...args) => args,

  matrix: (...dimensions) => {
    if (dimensions.length > 0) {
      const dim = dimensions[0];
      const rest = dimensions.slice(1);
      const arr = [];
      for (let i = 0; i < dim; i++) arr[i] = array.matrix(...rest);
      return arr;
    } else {
      return VOID;
    }
  },
  lambda: callback => x => callback(x),
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
  ['%']: (left, right) => ((left % right) + right) % right,
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
  toArray: entity => [...entity],
  fromArray: (...array) => new Set(...array),
  size: entity => entity.size
};
const time = {
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

export const deps = {
  ...prefixDep(time, 'TIME'),
  ...prefixDep(list, 'LIST'),
  ...prefixDep(array, 'ARRAY'),
  ...prefixDep(SetCollection, 'SET'),
  ...prefixDep(
    {
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
      numberToBinary: number => number.toString(2),
      parseInt: (number, base) => parseInt(number.toString(), base),
      toNumber: string => Number(string)
    },
    'MATH'
  ),

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
      sp: ' '
    },
    'STRING'
  ),
  ...prefixDep(object, 'OBJECT'),
  ...prefixDep(
    {
      isEqual,
      isSimilar,
      isDefined: item => (item === VOID ? 0 : 1),
      isUndefined: item => (item === VOID ? 1 : 0),
      boolean: item => Boolean(item),
      areEqual: (item, ...args) =>
        +args.every(current => isEqual(item, current))
    },
    'LOGIC'
  ),
  ...prefixDep(iterators, 'LOOP')
};
