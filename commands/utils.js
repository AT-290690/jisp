import { cell } from '../core/parser.js';
import { editor } from '../main.js';
import {
  STD,
  deps,
  consoleElement,
  print,
  compositionContainer,
  mainContainer,
  canvasContainer,
  protolessModule,
  alertIcon,
  errorIcon
} from '../extentions/extentions.js';
import { tokens } from '../core/tokens.js';
import { execute } from './exec.js';

export const State = {
  list: {},
  env: null,
  components: {},
  lastSelection: '',
  AST: {},
  activeWindow: null,
  comments: null,
  lastComposition: null,
  isLogged: false,
  isFullScreen: false,
  canvasHeight: 253,
  isErrored: true,
  isAtTheBottom: true,
  latestCurrentPage: 0,
  currentCollection: null,
  sceneHeight: 250,
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
export const onError = err => {
  droneIntel(errorIcon);
};
export const printErrors = (errors, args) => {
  if (!State.isErrored) {
    consoleElement.classList.remove('info_line');
    consoleElement.classList.add('error_line');
    State.isErrored = true;
    onError();
    canvasContainer.innerHTML = `<img src="./assets/images/404.svg" height="250" width="100%" />`;

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
        errors + ' [near "' + temp.res + '" in function "' + temp.fn + '"] ';
    } else {
      consoleElement.value = errors;
    }
  }
};
export const removeNoCode = source =>
  source.replace(/[ ]+(?=[^"]*(?:"[^"]*"[^"]*)*$)+|\n|\t|;;.+/g, '');
export const wrapInBody = source => `=>[${source}]`;

// ${
//   params
//     ? params
//         .map(([key, val]) => ':=($' + key + ';' + val + ')')
//         .join(';') + ';'
//     : ''
// }
//cell({ ...std })(`=>()`);
export const exe = source => {
  State.list = { ...STD, ...State.list };
  const ENV = protolessModule(State.list);
  ENV[';;tokens'] = protolessModule(tokens);
  try {
    const { result, AST, env } = cell(ENV)(wrapInBody(source));
    State.AST = AST;
    State.env = env;
    return result;
  } catch (err) {
    canvasContainer.style.background = 'var(--background-primary)';
    consoleElement.classList.remove('info_line');
    consoleElement.classList.add('error_line');
    consoleElement.value = consoleElement.value.trim() || err + ' ';
  }
};

export const addSpace = str => str + '\n';

export const printSelection = (selection, source) => {
  const updatedSelection =
    selection[selection.length - 1] === ';'
      ? `#[${selection}];`
      : `#[${selection}]`;
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
  const pairs = { ']': '[' };
  for (let i = 0; i < str.length; i++) {
    if (str[i] === '[') {
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
  source.match(/<-(.*)\[(.[A-Z"]+)\];/g)?.forEach(methods => {
    const list = methods
      .split('];')
      .filter(x => x[0] === '<' && x[1] === '-' && x[2] === '[')
      .join('];')
      .replace(/\]|\[|<-+/g, ';')
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

export const droneIntel = icon => {
  icon.style.visibility = 'visible';
  setTimeout(() => {
    icon.style.visibility = 'hidden';
  }, 500);
};
export const run = (source = editor.getValue()) => {
  State.isErrored = false;
  consoleElement.classList.add('info_line');
  consoleElement.classList.remove('error_line');

  consoleElement.value = '';
  // const cursor = editor.getCursor();
  source = source.trim();
  const sourceCode = removeNoCode(source);
  State.list = depResolution(sourceCode);
  const parenMatcher = isBalancedParenthesis(sourceCode);
  if (parenMatcher.diff === 0) {
    // const formatted = prettier(source); //revertComment(pr...)
    // const selection = editor.getSelection();
    // if (selection) {
    //   printSelection(selection, sourceCode);
    //   // editor.setValue(formatted);
    // } else {
    print(exe(sourceCode));
    if (!State.isErrored) droneIntel(alertIcon);

    // if (formatted !== source) {
    //   editor.setValue(formatted);
    // }
    // }
    // if (cursor < formatted.length) editor.setCursor(cursor);
  } else {
    printErrors(
      `Parenthesis are unbalanced by ${parenMatcher.diff > 0 ? '+' : ''}${
        parenMatcher.diff
      } "]"`
    );
  }
};

// export const fromBase64 = (str, params) => {
//   decode(
//     LZUTF8.decompress(str, {
//       inputEncoding: 'Base64',
//       outputEncoding: 'String'
//     }).trim(),
//     source => {
//       exe(source, params);
//     }
//   );
// };
// export const fromCompressed = (str, params) => {
//   decode(str, source => {
//     exe(source, params);
//   });
// };
// export const fromCode = (str, params) => {
//   decode(str, source => {
//     exe(source, params);
//   });
// };

const editCompositionEvent = (element, data) => {
  if (State.lastComposition) {
    mainContainer.parentNode.replaceChild(State.lastComposition, mainContainer);
  }
  if (data) {
    const decoded = LZUTF8.decompress(data, {
      inputEncoding: 'Base64',
      outputEncoding: 'String'
    });
    editor.setValue(decoded);
  }
  State.lastComposition = element;
  element.parentNode.replaceChild(mainContainer, element);
  mainContainer.style.display = 'block';
  editor.setSize(
    mainContainer.getBoundingClientRect().width,
    mainContainer.getBoundingClientRect().height - 40
  );
  mainContainer.style.marginBottom =
    mainContainer.getBoundingClientRect().height + 'px';
};

export const mediumPassRegex = new RegExp(
  '((?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])(?=.{6,}))|((?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9])(?=.{8,}))'
);
export const generateRandomColorHex = () => {
  return (
    '00000' + Math.floor(Math.random() * Math.pow(16, 6)).toString(16)
  ).slice(-6);
};
export const createComposition = userId => {
  if (userId) {
    const comp = document.createElement('div');
    comp.classList.add('composition');
    comp.setAttribute('userId', userId);

    const editComp = async e => {
      const name = comp.getAttribute('name');
      canvasContainer.innerHTML = `<img src="./assets/images/404.svg" height="250" width="100%" />`;
      canvasContainer.style.background = 'var(--background-primary)';

      // editor.setValue('');
      canvasContainer.innerHTML = `<img  src="./assets/images/404.svg" height="250" width="100%" />`;
      editCompositionEvent(comp);
      // consoleElement.style.height = '50px';
    };
    // const full = document.createElement('button');
    // full.classList.add('header-button');
    // full.classList.add('full-screen-button');
    // full.addEventListener('click', async () => {
    //   await editComp();
    //   await execute({ value: 'FULLSCREEN' });
    //   window.dispatchEvent(new Event('resize'));
    //   execute({ value: 'RUN' });
    // });
    // compositionContainer.appendChild(full);
    // full.innerHTML = '`<img src="./assets/images/full-screen.svg"  />';
    comp.addEventListener('click', editComp);
    compositionContainer.appendChild(comp);
    return comp;
  }
};
export const loadCompositions = () => execute({ value: 'FIND .' });

export const newComp = (userId = 'Unknown user') => {
  const comp = createComposition(userId);
  window.scrollTo({
    top: document.body.scrollHeight,
    behavior: 'smooth'
  });
  if (State.lastComposition) {
    mainContainer.parentNode.replaceChild(State.lastComposition, mainContainer);
    State.lastComposition = null;
  }
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

// const canvasContainer = document.getElementById('avatar-container');
