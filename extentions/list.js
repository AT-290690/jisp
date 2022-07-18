export class HyperList {
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
