import { cell } from '../core/parser.js';
import { editor } from '../main.js';
import {
  STD,
  deps,
  consoleElement,
  print,
  compositionContainer,
  mainContainer,
  protolessModule
} from '../extentions/composition.js';
import { tokens } from '../core/tokens.js';

export const getUserId = () => State.userId ?? localStorage.getItem('userId');

export const State = {
  list: {},
  env: null,
  components: {},
  lastSelection: '',
  AST: {},
  activeWindow: null,
  comments: null,
  isFullScreen: false,
  isErrored: true,
  height: window.innerHeight - 62,
  stash: { liveSession: '' }
};
const dfs = ast => {
  let out = { fn: null, res: null };
  for (const prop in ast) {
    if (Array.isArray(ast[prop])) {
      for (const arg of ast[prop]) {
        if (arg.type === 'apply') {
          out.fn = arg.operator.name;
        }
        const temp = dfs(arg);
        if (temp.res !== undefined) {
          out.res = temp.res;
        }
      }
    } else if (ast[prop] !== undefined) {
      out.res = ast[prop];
    }
  }
  return out;
};
export const onError = err => err;
export const printErrors = (errors, args) => {
  if (!State.isErrored) {
    consoleElement.classList.remove('info_line');
    consoleElement.classList.add('error_line');
    State.isErrored = true;
    if (
      errors?.message &&
      (errors.message.includes('Maximum call stack size exceeded') ||
        errors.message.includes('too much recursion'))
    )
      return (consoleElement.value =
        'RangeError: Maximum call stack size exceeded');
    const temp = dfs(args);
    if (temp.fn || temp.res) {
      consoleElement.value =
        errors + ' (near "' + temp.res + '" in function "' + temp.fn + '") ';
    } else {
      consoleElement.value = errors;
    }
  }
};
// ${
//   params
//     ? params
//         .map(([key, val]) => ':=($' + key + ';' + val + ')')
//         .join(';') + ';'
//     : ''
// }
//cell({ ...std })(`=>()`);
export const removeNoCode = source =>
  source.replace(/[ ]+(?=[^"]*(?:"[^"]*"[^"]*)*$)+|\n|\t|;;.+/g, '');
export const wrapInBody = source => `=>(${source})`;

export const exe = source => {
  State.list = { ...STD, ...State.list };
  const ENV = protolessModule(State.list);
  ENV.tokens = protolessModule(tokens);
  try {
    const { result, AST, env } = cell(ENV)(`=>(${source})`);
    State.AST = AST;
    State.env = env;
    return result;
  } catch (err) {
    consoleElement.classList.remove('info_line');
    consoleElement.classList.add('error_line');
    consoleElement.value = consoleElement.value.trim() || err + ' ';
  }
};

export const addSpace = str => str + '\n';

export const printSelection = (selection, source) => {
  const updatedSelection =
    selection[selection.length - 1] === ';'
      ? `#(${selection});`
      : `#(${selection})`;
  // if (cursor + updatedSelection.length < size) {
  editor.replaceSelection(updatedSelection);
  exe(source);
  // const head = cursor;
  // const tail = cursor + updatedSelection.length;
  // editor.setSelection(head, tail);
  // editor.replaceSelection(selection);
  // }
};
// export const stashComments = str => {
//   State.comments = str.match(/;;.+/g);
//   return str.replace(/;;.+/g, '##');
// };
export const revertComments = str => {
  if (State.comments) {
    const lines = str.split('\n');
    const stack = State.comments;
    return lines
      .map(line => (line[0] + line[1] === '##' ? stack.shift() : line))
      .join('\n');
  } else {
    return str;
  }
};
export const isBalancedParenthesis = sourceCode => {
  let count = 0;
  const stack = [];
  const str = sourceCode.replace(/"(.*?)"/g, '');
  const pairs = { ')': '(' };
  for (let i = 0; i < str.length; i++) {
    if (str[i] === '(') {
      stack.push(str[i]);
    } else if (str[i] in pairs) {
      if (stack.pop() !== pairs[str[i]]) {
        count++;
        //if (str[str.length - 1] === ')') {

        //str = str.substr(str, str.length - 1);
        //} else if (str[str.length - 1] === ';' && str[str.length - 2] === ')') {
        // str = str.substr(str, str.length - 2);
        //}
      }
    }
  }

  // if (stack.length) {
  //   for (let i = 0; i < stack.length; i++) {
  //     str += ')';
  //   }
  // }
  return { str, diff: count - stack.length };
};
export const prettier = str => addSpace(str);
// .replace(/[ ]+(?=[^"]*(?:"[^"]*"[^"]*)*$)+/g, ' ')
// .split(';')
// .join('; ')
// .split('(')
// .join(' (');

export const depResolution = source => {
  const List = {};
  source.match(/<-(.*)\((.[A-Z"]+)\);/g)?.forEach(methods => {
    const list = methods
      .split(');')
      .filter(x => x[0] === '<' && x[1] === '-' && x[2] === '(')
      .join(');')
      .replace(/\)|\(|<-+/g, ';')
      .split(';')
      .filter(Boolean)
      .reduce(
        (acc, item) => {
          if (item[0] !== '"') {
            acc._temp.push(item);
          } else {
            acc[item.substring(1, item.length - 1)] = [...acc._temp];
            acc._temp = [];
          }
          return acc;
        },
        { _temp: [] }
      );
    delete list._temp;
    for (const dep in list) {
      list[dep].forEach(m => {
        if (!List[dep]) List[dep] = {};
        if (!deps[dep]) {
          printErrors(`Module ${dep} does not exist`);
          throw new SyntaxError(`Module ${dep} does not exist`);
        } else if (deps[dep][m] === undefined) {
          printErrors(
            `Reference error Module ${dep} does not provide an export named ${m}`
          );
          throw new SyntaxError(
            `Module ${dep} does not provide an export named ${m}`
          );
        } else {
          List[dep][m] = deps[dep][m];
        }
      });
    }
  });
  return List;
};

export const run = () => {
  State.isErrored = false;
  consoleElement.classList.add('info_line');
  consoleElement.classList.remove('error_line');
  consoleElement.value = '';
  // const cursor = editor.getCursor();
  const source = editor.getValue().trim();
  const sourceCode = removeNoCode(source);
  State.list = depResolution(sourceCode);
  const parenMatcher = isBalancedParenthesis(sourceCode);
  if (parenMatcher.diff === 0) {
    // const formatted = prettier(source); //revertComment(pr...)
    const selection = editor.getSelection();
    if (selection) {
      // printSelection(selection, cursor, source.length, sourceCode);
      printSelection(selection, sourceCode);
      // editor.setValue(formatted);
    } else {
      print(exe(sourceCode));
      // if (formatted !== source) {
      //   editor.setValue(formatted);
      // }
    }
    // if (cursor < formatted.length) editor.setCursor(cursor);
  } else {
    printErrors(
      `Parenthesis are unbalanced by ${parenMatcher.diff > 0 ? '+' : ''}${
        parenMatcher.diff
      } ")"`
    );
  }
};

export const mediumPassRegex = new RegExp(
  '((?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])(?=.{6,}))|((?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9])(?=.{8,}))'
);

export const newComp = () => {
  const comp = document.createElement('div');
  comp.classList.add('composition');
  mainContainer.style.display = 'block';
  editor.setSize(
    mainContainer.getBoundingClientRect().width,
    mainContainer.getBoundingClientRect().height - 40
  );
  consoleElement.style.height = '50px';
  mainContainer.style.marginBottom =
    mainContainer.getBoundingClientRect().height + 'px';
  compositionContainer.appendChild(comp);
  editor.setValue('');
  return comp;
};

export const resizer = (resizer, mousemove, cursor) => {
  resizer.style.cursor = cursor;
  resizer.mousemove = mousemove;

  resizer.onmousedown = function (e) {
    document.documentElement.addEventListener(
      'mousemove',
      resizer.doDrag,
      false
    );
    document.documentElement.addEventListener(
      'mouseup',
      resizer.stopDrag,
      false
    );
  };

  resizer.doDrag = e => {
    if (e.which != 1) {
      resizer.stopDrag(e);
      return;
    }
    resizer.mousemove(e);
  };

  resizer.stopDrag = e => {
    document.documentElement.removeEventListener(
      'mousemove',
      resizer.doDrag,
      false
    );
    document.documentElement.removeEventListener(
      'mouseup',
      resizer.stopDrag,
      false
    );
  };
};
