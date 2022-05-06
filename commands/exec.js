import {
  consoleElement,
  editorContainer,
  headerContainer,
  mainContainer,
  fullRunButton,
  protolessModule,
  STD
} from '../extentions/composition.js';
import { editor } from '../main.js';
import { compileToJavaScript } from '../core/compiler.js';
import { cell } from '../core/parser.js';
import { run, State, newComp, depResolution, printErrors } from './utils.js';
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
      run();
      consoleElement.value = '';
      break;
    case 'EXIT_FULLSCREEN':
    case 'EXIT':
      editorContainer.style.display = 'block';
      fullRunButton.style.display = 'none';
      mainContainer.classList.remove('large');
      mainContainer.classList.add('small');
      headerContainer.style.display = 'block';
      editor.setSize(
        mainContainer.getBoundingClientRect().width,
        mainContainer.getBoundingClientRect().height - 40
      );
      consoleElement.value = '';
      State.isFullScreen = false;
      break;

    case 'FULLSCREEN':
    case 'FULL':
      {
        mainContainer.classList.remove('small');
        mainContainer.classList.add('large');
        headerContainer.style.display = 'none';
        fullRunButton.style.display = 'block';
        // const w = mainContainer.getBoundingClientRect().width;
        // const h = mainContainer.getBoundingClientRect().height / 2;
        // editor.setSize(w, h + 60);
        consoleElement.value = '';
        State.isFullScreen = true;
        window.dispatchEvent(new Event('resize'));
      }
      break;
    case 'SIZE':
      // consoleElement.value = '\nSIZE ' + +PARAMS[0];
      if (+PARAMS[0] === 0) {
        State.canvasHeight = 0;
        window.dispatchEvent(new Event('resize'));
      } else {
        State.canvasHeight = 250;
      }

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
      break;
    case 'SHOW':
      // execute({ value: 'EMPTY' });
      // newComp();
      execute({ value: 'FULL' });
      execute({ value: 'SIZE 1' });
      window.dispatchEvent(new Event('resize'));

      break;
    case 'B':
    case 'BIG':
      consoleElement.style.height = window.innerHeight - 40 + 'px';
      consoleElement.value = '';
      break;
    case 'M':
    case 'MID':
      consoleElement.style.height = window.innerHeight / 2 - 40 + 'px';
      consoleElement.value = '';
      break;
    case 'PRESS':
    case 'S':
    case 'SMALL':
      consoleElement.style.height = '50px';
      consoleElement.value = '';
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
      const source = editor.getValue();
      const List = depResolution(source);
      const { AST, env } = cell(
        protolessModule({ ...STD, ...List }),
        false
      )(`=> (
          ${source}
          )`);
      const ignore = [
        ...['#'],
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
      const { program, vars } = compileToJavaScript(AST);
      const tops = vars.length ? `var ${vars.join(',')};\n` : '';

      const script = `${tco}\n${pipe}\n${curry}\n${spread}\n((STD)=>{${tops}${program}})(${standartLibrary})`;
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
        const color = PARAMS[0] ?? '#161616';
        window.open().document.write(await execute({ value: '_COMPILE' }));
      }
      break;

    default:
      if (CMD.trim()) printErrors(CMD + ' does not exist!');
      else consoleElement.value = '';
      break;
  }
};
