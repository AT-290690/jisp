import {
  canvasContainer,
  compositionContainer,
  consoleElement,
  editorContainer,
  mainContainer,
  fullRunButton,
  // exitFullButton,
  protolessModule,
  STD,
  editorResizerElement,
  consoleResizerElement,
  store
} from '../extentions/extentions.js';
import { editor } from '../main.js';
import { compileToJavaScript } from '../core/compiler.js';
import { cell } from '../core/parser.js';
import {
  run,
  State,
  newComp,
  depResolution,
  printErrors,
  wrapInBody,
  removeNoCode
} from './utils.js';
const ba = `class HyperList {
  end = 0;
  begin = 0;
  left = [];
  right = [];
  size = 0;

  constructor(initial = []) {
    this.init(initial);
  }

  static isHyperList(entity) {
    return entity instanceof HyperList;
  }

  static from(iterable) {
    if (iterable.length !== undefined) {
      const initial =
        iterable[0] !== undefined ? iterable : Array.from(iterable);
      return new HyperList([...initial]);
    }
  }

  static of(...items) {
    return new HyperList(items);
  }

  get first() {
    return this.get(0);
  }

  get last() {
    return this.get(this.size - 1);
  }

  get pivot() {
    return this.right[0];
  }

  _access(key) {
    const index = this.abs(key);
    return key >= 0 ? this.right[index] : this.left[index];
  }

  _add(key, value) {
    const index = this.abs(key);
    if (key >= 0) this.right[index] = value;
    else this.left[index] = value;
    this.size++;
  }

  _delete(key) {
    if (this.size === 1) {
      this.left = [];
      this.right = [];
      this.size = 0;
      this.begin = 0;
      this.end = 0;
      return;
    }
    if (key < 0 && this.left.lenght > 0) this.left.length--;
    if (key >= 0 && this.right.lenght > 0) this.right.length--;
    this.size--;
  }

  abs(key) {
    return key < 0 ? key * -1 : key;
  }

  init(initial) {
    if (
      initial &&
      !Array.isArray(initial) &&
      typeof initial[Symbol.iterator] === 'function'
    ) {
      initial = [...initial];
    }
    if (this.size) this.clear();
    const half = Math.floor(initial.length / 2);
    for (let i = half - 1; i >= 0; i--) this._addToLeft(initial[i]);
    for (let i = half; i < initial.length; i++) this._addToRight(initial[i]);
  }

  get(index) {
    return this._access(index + this.begin);
  }

  clear() {
    this.right = [];
    this.left = [];
    this.size = 0;
    this.begin = 0;
    this.end = 0;
  }

  _addToLeft(item) {
    this._add(--this.begin, item);
  }

  _addToRight(item) {
    this._add(this.end++, item);
  }

  _removeFromLeft() {
    this.size && this._delete(this.begin++);
  }

  _removeFromRight() {
    this.size && this._delete(--this.end);
  }

  vectorIndexOf(index) {
    const key = index + this.begin;
    return key < 0 ? [key * -1, -1] : [key, 1];
  }

  set(key, value) {
    const [index, direction] = this.vectorIndexOf(key);
    return direction >= 0
      ? (this.right[index] = value)
      : (this.left[index] = value);
  }

  [Symbol.iterator] = function* () {
    for (let i = 0; i < this.size; i++) yield this.get(i);
  };

  toArray() {
    return [...this];
  }

  at(index) {
    if (index < 0) {
      return this.get(this.size + index);
    } else {
      return this.get(index);
    }
  }

  push(...items) {
    for (let i = 0; i < items.length; i++) this._addToRight(items[i]);
    return this.size;
  }

  unshift(...items) {
    for (let i = items.length - 1; i >= 0; i--) this._addToLeft(items[i]);
    return this.size;
  }

  pop() {
    if (this.end === 0) {
      this.balance();
    }
    const last = this.last;
    this._removeFromRight();
    return last;
  }
  shift() {
    if (this.begin === 0) {
      this.balance();
    }
    const first = this.first;
    this._removeFromLeft();
    return first;
  }

  slice(start, end = this.size) {
    const collection = [];
    for (let i = start; i < end; i++) collection.push(this.get(i));
    return new HyperList(collection);
  }

  splice(start, deleteCount = 0, ...items) {
    const deleted = [];
    if (this.begin + start > 0) {
      const len = this.size - start - deleteCount;
      this.rotateRight(len);
      if (deleteCount > 0) {
        for (let i = 0; i < deleteCount; i++) {
          deleted.push(this.pop());
        }
      }
      this.push(...items);
      for (let i = 0; i < len; i++) {
        this.push(this.shift());
      }
    } else {
      this.rotateLeft(start);
      if (deleteCount > 0) {
        for (let i = 0; i < deleteCount; i++) {
          deleted.push(this.shift());
        }
      }
      this.unshift(...items);
      for (let i = 0; i < start; i++) {
        this.unshift(this.pop());
      }
    }
    return deleted;
  }

  indexOf(item) {
    for (let i = 0; i < this.size; i++) {
      if (this.get(i) === item) return i;
    }
    return -1;
  }

  lastIndexOf(item) {
    for (let i = this.size - 1; i >= 0; i--) {
      if (this.get(i) === item) return i;
    }
    return -1;
  }

  includes(val) {
    for (let i = 0; i < this.size; i++) {
      if (this.get(i) === val) return true;
    }
    return false;
  }

  find(callback) {
    for (let i = 0; i < this.size; i++) {
      const current = this.get(i);
      if (callback(current, i, this)) return current;
    }
  }

  some(callback) {
    for (let i = 0; i < this.size; i++) {
      if (callback(this.get(i), i, this)) return true;
    }
    return false;
  }

  every(callback) {
    for (let i = 0; i < this.size; i++) {
      if (!callback(this.get(i), i, this)) return false;
    }
    return true;
  }

  findIndex(callback) {
    for (let i = 0; i < this.size; i++) {
      const current = this.get(i);
      if (callback(current, i, this)) return i;
    }
    return -1;
  }

  map(callback) {
    const result = new HyperList();
    const half = Math.floor(this.size / 2);
    for (let i = half - 1; i >= 0; i--)
      result._addToLeft(callback(this.get(i), i, this));
    for (let i = half; i < this.size; i++)
      result._addToRight(callback(this.get(i), i, this));
    return result;
  }

  mapMut(callback) {
    for (let i = 0; i < this.size; i++)
      this.set(i, callback(this.get(i), i, this));
    return this;
  }

  forEach(callback) {
    for (let i = 0; i < this.size; i++) callback(this.get(i), i, this);
  }

  reduce(callback, initial) {
    for (let i = 0; i < this.size; i++) {
      initial = callback(initial, this.get(i), i, this);
    }
    return initial;
  }

  reduceRight(callback, initial) {
    for (let i = this.size - 1; i >= 0; i--) {
      initial = callback(initial, this.get(i), i, this);
    }
    return initial;
  }

  filter(callback) {
    const out = [];
    for (let i = 0; i < this.size; i++) {
      const current = this.get(i);
      const predicat = callback(current, i, this);
      if (predicat) out.push(current);
    }
    return new HyperList(out);
  }

  reverse() {
    if (this.size <= 2) {
      if (this.size === 1) {
        return this;
      }
      const temp = this.get(0);
      this.set(0, this.get(1));
      this.set(1, temp);
      return this;
    }

    const temp = this.end * -1;
    this.end = this.begin * -1;
    this.begin = temp;
    const left = this.left;
    const right = this.right;
    right.unshift(left.shift());
    this.left = right;
    this.right = left;
    return this;
  }

  sort(callback) {
    return new HyperList(this.toArray().sort(callback));
  }

  join(separator = ',') {
    let output = '';
    for (let i = 0; i < this.size; i++) output += this.get(i) + separator;
    return output;
  }

  concat(second) {
    return new HyperList([...this, ...second]);
  }

  flat(levels = 1) {
    const flatten = collection =>
      collection.reduce((acc, current) => {
        if (HyperList.isHyperList(current)) {
          acc.push(...flat(current, levels));
        } else {
          acc.push(current);
        }
        return acc;
      }, []);
    const flat =
      levels === Infinity
        ? collection => {
            return flatten(collection);
          }
        : (collection, levels) => {
            levels--;
            return levels === -1 ? collection : flatten(collection);
          };
    return new HyperList(flat(this, levels));
  }

  flatMap(callback) {
    return new HyperList(
      this.reduce((acc, current, index, self) => {
        if (HyperList.isHyperList(current)) {
          current.forEach(item => {
            acc.push(callback(item));
          });
        } else {
          acc.push(callback(current, index, self));
        }
        return acc;
      }, [])
    );
  }

  addTo(key, value) {
    if (key >= this.size) {
      for (let i = this.size; i <= key; i++) {
        this._addToRight(undefined);
      }
    }
    const [index, direction] = this.vectorIndexOf(key);
    direction >= 0 ? (this.right[index] = value) : (this.left[index] = value);
    return this.size;
  }

  addAt(key, ...value) {
    if (this.begin + key > 0) {
      const len = this.size - key;
      this.rotateRight(len);
      this.push(...value);
      for (let i = 0; i < len; i++) {
        this.push(this.shift());
      }
    } else {
      this.rotateLeft(key);
      this.unshift(...value);
      for (let i = 0; i < key; i++) {
        this.unshift(this.pop());
      }
    }
  }

  removeFrom(key, amount) {
    if (this.begin + key > 0) {
      const len = this.size - key;
      this.rotateRight(len);
      for (let i = 0; i < amount; i++) {
        this.pop();
      }
      for (let i = 0; i < len; i++) {
        this.push(this.shift());
      }
    } else {
      this.rotateLeft(key);
      for (let i = 0; i < amount; i++) {
        this.shift();
      }
      for (let i = 0; i < key; i++) {
        this.unshift(this.pop());
      }
    }
  }

  rotateLeft(n = 1) {
    for (let i = 0; i < n; i++) {
      this._addToRight(this.first);
      this._removeFromLeft();
    }
  }

  rotateRight(n = 1) {
    for (let i = 0; i < n; i++) {
      this._addToLeft(this.last);
      this._removeFromRight();
    }
  }

  rotate(n = 1, direction = 1) {
    direction === 1 ? this.rotateRight(n) : this.rotateLeft(n);
  }

  balance() {
    if (this.end + this.begin === 0) return;
    const array = this.toArray();
    this.clear();
    return this.init(array);
  }
}
`;
const pipe = `var _pipe = (...fns) => x => fns.reduce((v, f) => f(v), x);`;
const curry = `var _curry = (fn, ...args) => (arg) => fn(arg, ...args);`;
const tco = `var _tco = func => (...args) => { let result = func(...args); while (typeof result === 'function') { result = result(); }; return result };`;
const spread = `var _spread = (items) => Array.isArray(items[0]) ? items.reduce((acc, item) => [...acc, ...item], []) : items.reduce((acc, item) => ({ ...acc, ...item }), {});`;
const is_equal = `var _isEqual = (a, b) => {const typeA = typeof a, typeB = typeof b; if (typeA !== typeB) return 0; if (typeA === 'number' || typeA === 'string' || typeA === 'boolean') { return +(a === b); } if (typeA === 'object') { const isArrayA = Array.isArray(a), isArrayB = Array.isArray(b); if (isArrayA !== isArrayB) return 0; if (isArrayA && isArrayB) { if (a.length !== b.length) return 0; return +a.every((item, index) => _isEqual(item, b[index])); } else { if (a === undefined || a === null || b === undefined || b === null) return +(a === b); if (Object.keys(a).length !== Object.keys(b).length) return 0; for (const key in a) { if (!_isEqual(a[key], b[key])) { return 0; }} return 1; }}}`;

export const execute = async CONSOLE => {
  consoleElement.classList.remove('error_line');
  consoleElement.classList.add('info_line');
  const consoleLines = CONSOLE.value.trim().split('\n');
  const selectionWithCursor = consoleLines.find(l => l[0] === '.');
  const selectedConsoleLine = selectionWithCursor
    ? selectionWithCursor.split('. ')[1]
    : consoleLines.pop();
  const [CMD, ...PARAMS] = selectedConsoleLine.split(' ');
  switch (CMD?.trim()?.toUpperCase()) {
    case 'EMPTY':
      State.currentCollection = null;
      State.latestCurrentPage = 0;
      State.isAtTheBottom = false;
      if (State.isFullScreen) {
        await execute({ value: 'EXIT FULLSCREEN' });
      }
      if (State.lastComposition && mainContainer.parentNode) {
        mainContainer.parentNode.replaceChild(
          State.lastComposition,
          mainContainer
        );
        State.lastComposition = null;
      }
      two.destroyComposition();
      compositionContainer.innerHTML = '';
      consoleElement.value = '';
      break;
    case 'CLEAR':
      {
        editor.setValue('');
        consoleElement.value = '';
      }
      break;
    case 'COMPRESS':
      editor.setValue(
        editor
          .getValue()
          .toString()
          .replace(/[ ]+(?=[^"]*(?:"[^"]*"[^"]*)*$)+|\n|\t|;;.+/g, '')
          .trim()
      );
      break;

    case 'RUN':
      run();
      consoleElement.value = '';
      break;
    case 'EXIT_FULLSCREEN':
    case 'EXIT':
      {
        editorContainer.style.display = 'block';
        canvasContainer.style.display = 'block';
        editorResizerElement.style.display = 'block';
        // exitFullButton.style.display = 'none';
        const comps = [...document.getElementsByClassName('composition')];
        comps.forEach(e => {
          e.style.display = 'block';
        });
        // canvasContainer.style.maxHeight = '253px';
        canvasContainer.style.height = '253px';
        // fullRunButton.style.display = 'none';

        mainContainer.classList.remove('large');
        mainContainer.classList.add('small');
        // headerContainer.style.display = 'block';
        editor.setSize(
          mainContainer.getBoundingClientRect().width,
          mainContainer.getBoundingClientRect().height - 40
        );
        consoleElement.value = '';
        consoleElement.style.top = null;
        consoleElement.style.height = '50px';
        consoleResizerElement.style.bottom = '60px';
        State.isFullScreen = false;
      }
      break;

    case 'FULLSCREEN':
    case 'FULL':
      {
        const comps = [...document.getElementsByClassName('composition')];
        comps.forEach(e => {
          e.style.display = 'none';
        });
        State.sceneHeight = 253;
        State.height = window.innerHeight;
        mainContainer.classList.remove('small');
        mainContainer.classList.add('large');
        // headerContainer.style.display = 'absolute';
        // headerContainer.style.top = '92vh';
        // headerContainer.style.background = 'transparent';
        fullRunButton.style.display = 'block';
        // exitFullButton.style.display = 'block';

        // const w = mainContainer.getBoundingClientRect().width;
        // const h = mainContainer.getBoundingClientRect().height / 2;
        // editor.setSize(w, h + 60);
        // canvasContainer.style.maxHeight = 253 + 'px';
        canvasContainer.style.height = 253 + 'px';
        consoleElement.value = '';
        State.isFullScreen = true;
        window.dispatchEvent(new Event('resize'));
      }
      break;
    case 'SIZE':
      // consoleElement.value = '\nSIZE ' + +PARAMS[0];
      if (+PARAMS[0] === 0) {
        canvasContainer.style.display = 'none';
        editorResizerElement.style.display = 'none';
        State.canvasHeight = 0;
        // canvasContainer.style.maxHeight = 253 + 'px';
        // canvasContainer.style.height = 253 + 'px';
        window.dispatchEvent(new Event('resize'));
      } else {
        canvasContainer.style.display = 'block';
        State.canvasHeight = 253;
        // exitFullButton.style.display = 'block';
        editorResizerElement.style.display = 'block';
      }
      // else {
      //   canvasContainer.style.display = 'block';
      //   canvasContainer.style.minHeight = +PARAMS[0] + 'px';
      //   editor.setSize(
      //     mainContainer.getBoundingClientRect().width,
      //     mainContainer.getBoundingClientRect().height - PARAMS[0] - 80
      //   );
      // }
      break;
    case 'BLANK':
    case 'NEW':
      execute({ value: 'EMPTY' });
      newComp().click();

      break;
    case 'FOCUS':
      // execute({ value: 'EMPTY' });
      // newComp();
      execute({ value: 'FULL' });
      execute({ value: 'SIZE 0' });
      // exitFullButton.style.display = 'none';
      break;
    case 'SHOW':
      // execute({ value: 'EMPTY' });
      // newComp();
      execute({ value: 'FULL' });
      execute({ value: 'SIZE 1' });
      window.dispatchEvent(new Event('resize'));

      break;

    case 'IMPORT':
      {
        const lib = PARAMS[0].toUpperCase();
        const pack = PARAMS[1]?.toUpperCase();
        let match = true;
        switch (lib) {
          case 'MATH':
            if (pack === 'ALL') {
              editor.setValue(
                '<- [add; sub; mult; pow; mod; divide; sign; trunc; exp; floor; round; random; dice; max; min; sin;  cos;  tan; atan; atan2; log10; log2; log; sum;  minInt; maxInt; infinity; PI; parseInt] ["MATH"];\n' +
                  editor.getValue()
              );
            } else if (pack === 'TRIG') {
              editor.setValue(
                '<- [sin;  cos;  tan; atan; atan2] ["MATH"];\n' +
                  editor.getValue()
              );
            } else {
              editor.setValue(
                '<- [PI; max; min; floor; round; dice; random; infinity; sin; cos; mod] ["MATH"];\n' +
                  editor.getValue()
              );
            }
            break;
          case 'DOM':
            editor.setValue(
              `<- [makeUserInterface; makeInput; makeStyleTag; makeClass; makeTextArea; makeSlider; copyFromElement; copyFromText; makeTooltip; makeButton; makeLabel; onChange; onClick; makeParagraph; makeSpan; makeStyle; makeContainer; addClass; insertIntoContainer; removeSelfFromContainer] ["DOM"];\n` +
                editor.getValue()
            );
            break;
          case 'ARRAY':
            if (pack === 'ALL') {
              editor.setValue(
                '<- [map; filter; reduce; range; reverse; push; pop; shift; unshift; flat; flatMap; find; findIndex; includes; every; some; isArray; from] ["ARRAY"];\n' +
                  editor.getValue()
              );
            } else {
              editor.setValue(
                '<- [map; filter; reduce; range; reverse; push; pop; shift; unshift; flat; flatMap; find; findIndex; includes; every; some; isArray; from] ["ARRAY"];\n' +
                  editor.getValue()
              );
            }
            break;
          default:
            printErrors('Package ' + lib + ' does not exist!');
            match = false;
            break;
        }
        if (match) consoleElement.value = '';
      }
      break;
    case '+':
      newComp();
      consoleElement.value = '';
      break;

    case 'ABOUT':
      consoleElement.value = `Draw and animate SVG with the use of a specialised programming language!
Upload your creations and share them with everyone!`;

      break;
    case 'FETCH':
      const url = PARAMS[0];
      const key = PARAMS[1] ?? 'io';
      const type = PARAMS[2] ?? 'json';
      if (url)
        fetch(url)
          .then(raw => raw[{ json: 'json', text: 'text' }[type] ?? 'json']())
          .then(result => (store[key] = result));
      break;
    case 'EXAMPLES':
      break;
    case 'DOWNLOAD':
    case 'DL':
      {
        const a = document.createElement('a');
        // const W = PARAMS[0];
        // const H = PARAMS[1] || W;
        // const v = PARAMS[2]
        const temp = canvasContainer.firstChild.style.border;
        canvasContainer.firstChild.style.border = 'none';
        a.href = window.URL.createObjectURL(
          new Blob(
            [
              canvasContainer.innerHTML.replace(
                '<svg',
                '<svg xmlns="http://www.w3.org/2000/svg"'
              )
            ],
            {
              type: 'text/svg'
            }
          )
        );
        a.setAttribute('download', 'gerbit.svg');
        a.click();
        window.URL.revokeObjectURL(a.href);
        canvasContainer.firstChild.style.border = temp;
      }
      break;

    case 'MORE':
      execute({ value: `STACK ${State.currentCollection}` });
      break;
    case 'SNAPSHOT':
      {
        const color = PARAMS[0] ?? '#000000';
        window
          .open()
          .document.write(
            `<head><title>Hyper Light SVG</title><style> body { background: ${color} }</style><head><body>${canvasContainer.innerHTML}</body>`
          );
      }
      break;
    case 'TAB':
      {
        const color = PARAMS[0] ?? '#000000';
        window
          .open()
          .document.write(
            `<head><title>Hyper Light SVG</title><style> body { background: ${color} }</style><head><body>${canvasContainer.innerHTML}</body>`
          );
      }
      break;
    case 'C':
    case 'COMPILE':
      State.stashedValue = editor.getValue();
      editor.setValue(await execute({ value: '_COMPILE' }));
      break;
    case 'JS':
      {
        const source = removeNoCode(editor.getValue());
        const List = depResolution(source);
        const { AST, env } = cell(
          protolessModule({ ...STD, ...List }),
          false
        )(wrapInBody(source));
        const ignore = [
          ...['#', 'tco', 'void', 'VOID'],
          ...['!', '^', '>>>', '>>', '<<', '~', '|', '&'],
          ...['+', '-', '*', '/', '==', '!=', '>', '<', '>=', '<=', '%', '**']
        ];
        const deps = env;
        ignore.forEach(op => {
          delete deps[op];
        });

        const { program, vars } = compileToJavaScript(AST);
        const tops = vars.length ? `var ${vars.join(',')};\n` : '';
        const script = `${tops}${program}`;
        editor.setValue(script);
      }
      consoleElement.value = '';
      break;
    case '_COMPILE':
      {
        const source = removeNoCode(State.stashedValue);
        const List = depResolution(source);
        const { AST, env } = cell(
          protolessModule({ ...STD, ...List }),
          false
        )(wrapInBody(source));
        const ignore = [
          ...['#', 'tco', 'void', 'VOID'],
          ...['!', '^', '>>>', '>>', '<<', '~', '|', '&'],
          ...['+', '-', '*', '/', '==', '!=', '>', '<', '>=', '<=', '%', '**']
        ];
        const deps = env;
        ignore.forEach(op => {
          delete deps[op];
        });
        let standartLibrary = '{';
        for (const f in deps) {
          standartLibrary += `"${f}":{`;
          for (const c in deps[f]) {
            standartLibrary += `"${c}":`;
            if (typeof deps[f][c] === 'function') {
              standartLibrary += deps[f][c].toString().replace('VOID', 'null');
            } else {
              standartLibrary += JSON.stringify(deps[f][c]);
            }
            standartLibrary += ',';
          }
          standartLibrary += '},';
        }
        standartLibrary += '}';

        //  window
        //   .open()
        //   .document.write(
        //     `<head><title>Hyper Light SVG</title><style> body { background: ${color} }</style><head><body>${canvasContainer.innerHTML}</body>`
        //   );

        // const loop = `var _while = (a, b) => { while (!!a()) {  b(); } return null }`;
        const color = PARAMS[0] ?? '#000000';
        const { program, vars } = compileToJavaScript(AST);
        const tops = vars.length ? `var ${vars.join(',')};\n` : '';
        const script = `
${'HYPERLIST' in deps ? ba : ''};
var events = {};
var store = ${JSON.stringify(window.store)};
var mainContainer = document.getElementById("main-container");
var canvasContainer = document.getElementById("canvas-container");
${tco}\n${pipe}\n${curry}\n${spread}\n${is_equal}\n
((STD)=>{${tops}${program}})(${standartLibrary})`;
        return `<head><title>Hyper Light SVG</title><style> body { background: ${color} }</style><head><body>  
        <div id="canvas-container"></div>
        <div id="main-container">
        </div>
        <script>${script}</script></body>`;
      }
      break;
    case 'BUILD':
      if (!PARAMS.length) State.stashedValue = localStorage.getItem('stash');
      PARAMS.forEach(file => {
        let current = localStorage.getItem(file)?.trim();
        if (current) {
          if (current[current.length - 1] === ';') {
            current = current.substring(0, current.length - 1);
          }
          State.stashedValue =
            localStorage.getItem(file) + ';' + State.stashedValue;
        }
      });
      const a = document.createElement('a');

      a.href = window.URL.createObjectURL(
        new Blob([await execute({ value: '_COMPILE' })], {
          type: 'text/html'
        })
      );
      //.replace(/\n[ ]*/g, ';')
      a.setAttribute('download', 'gearbit.html');
      a.click();
      window.URL.revokeObjectURL(a.href);
      break;
    case 'LIST':
      editor.setValue(Object.keys(window.localStorage).join('\n'));
      consoleElement.value = '';
      break;
    case 'DELETE':
      if (PARAMS[0]) window.localStorage.removeItem(PARAMS[0]);
      consoleElement.value = '';
      break;
    case 'SAVE':
      if (PARAMS[0]) window.localStorage.setItem(PARAMS[0], editor.getValue());
      consoleElement.value = '';
      break;
    case 'LOAD':
      {
        if (PARAMS[0]) {
          const file = window.localStorage.getItem(PARAMS[0]);
          if (file) {
            editor.setValue(file);
            consoleElement.value = '';
          } else printErrors(PARAMS[0] + ' file does not exist!');
        }
      }
      break;
    // case 'APP':
    //   window.open().document.write(await execute({ value: '_COMPILE' }));
    //break;
    case 'HELP':
      consoleElement.value = ` HELP: list these commands
 FULL: fullscreen
 EXIT: exit fullscreen
 CLEAR: clears the editor
 EMPTY: removes all comps
 COMPRESS: turn code to one line
 RUN: runs the current composition
 BUILD: compile to html and download the file
 DOWNLOAD: download svg
 ABOUT: about this site
 LEARN: learn how to use the site
 EXAMPLES: check out examples
`;

      break;
    default:
      if (CMD.trim()) printErrors(CMD + ' does not exist!');
      else consoleElement.value = '';
      break;
  }
};
