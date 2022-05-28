import { CodeMirror } from './libs/editor/cell.editor.bundle.js';
import {
  consoleElement,
  editorContainer,
  mainContainer,
  fullRunButton
} from './extentions/extentions.js';
import { execute } from './commands/exec.js';
import { newComp, resizer, run, State } from './commands/utils.js';

fullRunButton.addEventListener('click', run);

export const editor = CodeMirror(editorContainer, {});
editor.changeFontSize('20px');
editor.setSize(
  mainContainer.getBoundingClientRect().width,
  mainContainer.getBoundingClientRect().height - 80
);
editorContainer.addEventListener(
  'click',
  () => (State.activeWindow = editorContainer)
);

const resize = () => {
  if (State.isFullScreen) {
    editor.setSize(mainContainer.getBoundingClientRect().width, State.height);
    consoleElement.style.top = State.height - 10 + 'px';
    consoleElement.style.height =
      mainContainer.getBoundingClientRect().height - State.height + 'px';
  }
};
window.addEventListener('resize', resize);
if (!/Mobi|Android/i.test(navigator.userAgent)) {
  resizer(
    consoleElement,
    e => {
      editor.setSize(mainContainer.getBoundingClientRect().width, e.pageY);
      State.height = e.pageY;
      consoleElement.style.top = e.pageY - 10 + 'px';
      consoleElement.style.height =
        mainContainer.getBoundingClientRect().height - e.pageY + 'px';
    },
    'row-resize'
  );
  document.addEventListener('keydown', e => {
    const activeElement = document.activeElement;
    if (e.key.toLowerCase() === 's' && (e.ctrlKey || e.metaKey)) {
      e = e || window.event;
      e.preventDefault();
      e.stopPropagation();
      run();
    } else if (e.key === 'Enter') {
      if (activeElement === consoleElement) {
        execute(consoleElement);
      }
    } else if (e.key === 'Escape' && (e.ctrlKey || e.metaKey)) {
      if (activeElement === consoleElement) {
        editor.focus();
        State.activeWindow = editorContainer;
      } else if (State.activeWindow === editorContainer) {
        consoleElement.value = '';
        consoleElement.focus();
      }
    }
  });
}
newComp();
execute({ value: 'focus' });
editor.setValue('');
// execute({ value: 'RUN' });

setTimeout(() => {
  document.body.removeChild(document.getElementById('splash-screen'));
}, 1000);
State.activeWindow = editorContainer;
editor.focus();
