import {
  consoleElement,
  editorContainer,
  headerContainer,
  mainContainer,
  fullRunButton,
  protolessModule,
  STD
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
export const execute = async CONSOLE => {
  consoleElement.classList.remove('error_line');
  consoleElement.classList.add('info_line');

  const [CMD, ...PARAMS] = CONSOLE.value.trim().split('\n').pop().split(' ');
  switch (CMD?.trim()?.toUpperCase()) {
    case 'EMPTY':
      State.currentCollection = null;
      State.latestCurrentPage = 0;
      State.isAtTheBottom = false;
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
    case 'SAVE':
      consoleElement.value = '';
      run();
      break;

    case 'FULLSCREEN':
    case 'FULL':
      {
        mainContainer.classList.remove('small');
        mainContainer.classList.add('large');
        fullRunButton.style.display = 'block';
        // const w = mainContainer.getBoundingClientRect().width;
        // const h = mainContainer.getBoundingClientRect().height / 2;
        // editor.setSize(w, h + 60);
        consoleElement.value = '';
        State.isFullScreen = true;
        window.dispatchEvent(new Event('resize'));
      }
      break;

    case 'BLANK':
    case 'NEW':
      execute({ value: 'EMPTY' });
      newComp();
      break;
    case 'FOCUS':
      // execute({ value: 'EMPTY' });
      // newComp();
      execute({ value: 'FULL' });
      execute({ value: 'SIZE 0' });
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
          case 'TWO':
            if (pack === 'ALL') {
              editor.setValue(
                '<- (makeScene; noFill; makeRectangle; makePolygon; makeCircle; makeGroup; background; width; height; update; noStroke; makeGrid; makeFrame; draw; play) ("TWO");\n' +
                  editor.getValue()
              );
            } else {
              editor.setValue(
                '<- (makeScene; noFill; makeRectangle; makePolygon; makeCircle; makeGroup; background; width; height; update; noStroke; makeGrid; makeFrame; draw; play) ("TWO");\n' +
                  editor.getValue()
              );
            }
            break;
          case 'PATH_COMMANDS':
            editor.setValue(
              '<- (arc; line; move; close; curve) ("COMMANDS");\n' +
                editor.getValue()
            );
            break;
          case 'MATH':
            if (pack === 'ALL') {
              editor.setValue(
                '<- (add; sub; mult; pow;  divide; sign; trunc; exp; floor; round; random; dice; max; min; sin;  cos;  tan; atan; atan2; log10; log2; log; sum;  minInt; maxInt; infinity; PI; parseInt) ("MATH");\n' +
                  editor.getValue()
              );
            } else if (pack === 'TRIG') {
              editor.setValue(
                '<- (sin;  cos;  tan; atan; atan2) ("MATH");\n' +
                  editor.getValue()
              );
            } else {
              editor.setValue(
                '<- (PI; max; min; floor; round; dice; random; infinity; sin; cos) ("MATH");\n' +
                  editor.getValue()
              );
            }
            break;
          case 'ARRAY':
            if (pack === 'ALL') {
              editor.setValue(
                '<- (map; filter; reduce; range; reverse; push; pop; shift; unshift; flat; flatMap; find; findIndex; includes; every; some; isArray; from) ("ARRAY");\n' +
                  editor.getValue()
              );
            } else {
              editor.setValue(
                '<- (map; filter; reduce; range; reverse; push; pop; shift; unshift; flat; flatMap; find; findIndex; includes; every; some; isArray; from) ("ARRAY");\n' +
                  editor.getValue()
              );
            }
            break;
          case 'SETTER':
            if (pack === 'ALL') {
              editor.setValue(
                '<- (setPosition; setRotation; setOpacity; setScale; setFill; setStroke; setLinewidth) ("SETTER");\n' +
                  editor.getValue()
              );
            } else {
              editor.setValue(
                '<- (setPosition; setRotation; setOpacity; setScale; setFill; setStroke; setLinewidth) ("SETTER");\n' +
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

    case 'C':
    case 'COMPILE':
      editor.setValue(await execute({ value: '_COMPILE ' + PARAMS[0] }));
      break;

    case '_COMPILE': {
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
      const pipe = `var _pipe = (...fns) => x => fns.reduce((v, f) => f(v), x);`;
      const curry = `var _curry = (fn, ...args) => (arg) => fn(arg, ...args);`;
      const tco = `var _tco = func => (...args) => { let result = func(...args); while (typeof result === 'function') { result = result(); }; return result };`;
      const spread = `var _spread = (items) => Array.isArray(items[0]) ? items.reduce((acc, item) => [...acc, ...item], []) : items.reduce((acc, item) => ({ ...acc, ...item }), {});`;
      const is_equal = `var _isEqual = (a, b) => {const typeA = typeof a, typeB = typeof b; if (typeA !== typeB) return 0; if (typeA === 'number' || typeA === 'string' || typeA === 'boolean') { return +(a === b); } if (typeA === 'object') { const isArrayA = Array.isArray(a), isArrayB = Array.isArray(b); if (isArrayA !== isArrayB) return 0; if (isArrayA && isArrayB) { if (a.length !== b.length) return 0; return +a.every((item, index) => isEqual(item, b[index])); } else { if (a === undefined || a === null || b === undefined || b === null) return +(a === b); if (Object.keys(a).length !== Object.keys(b).length) return 0; for (const key in a) { if (!isEqual(a[key], b[key])) { return 0; }} return 1; }}}`;
      const { program, vars } = compileToJavaScript(AST);
      const tops = vars.length ? `var ${vars.join(',')};\n` : '';

      const script = js_beautify(
        `\n${tco}\n${pipe}\n${curry}\n${spread}\n${is_equal}\n((STD)=>{${tops}${program}})(${standartLibrary})`,
        {
          indent_size: '2',
          indent_char: ' ',
          max_preserve_newlines: '-1',
          preserve_newlines: false,
          keep_array_indentation: true,
          break_chained_methods: true,
          indent_scripts: 'keep',
          brace_style: 'none,preserve-inline',
          space_before_conditional: true,
          unescape_strings: false,
          jslint_happy: true,
          end_with_newline: false,
          wrap_line_length: Infinity,
          indent_inner_html: false,
          comma_first: false,
          e4x: true,
          indent_empty_lines: false
        }
      );
      if (PARAMS?.[0]?.toUpperCase() === 'JS') return script;
      return `<head><title>Hyper Light Compiled</title><style> body { background: #161616 }</style><head><body>
<script>${script}</script></body>`;
    }
    case 'BUILD':
      const a = document.createElement('a');
      a.href = window.URL.createObjectURL(
        new Blob([await execute({ value: '_COMPILE' })], {
          type: 'text/html'
        })
      );
      //.replace(/\n[ ]*/g, ';')
      a.setAttribute('download', 'artwork.html');
      a.click();
      window.URL.revokeObjectURL(a.href);
      break;
    case 'TAB':
      {
        window.open().document.write(await execute({ value: '_COMPILE' }));
      }
      break;

    default:
      if (CMD.trim()) printErrors(CMD + ' does not exist!');
      else consoleElement.value = '';
      break;
  }
};
