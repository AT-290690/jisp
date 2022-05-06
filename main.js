import { CodeMirror } from './libs/editor/cell.editor.bundle.js';
import {
  consoleElement,
  editorContainer,
  logoButton,
  mainContainer,
  helpButton,
  fullRunButton
} from './extentions/composition.js';
import { execute } from './commands/exec.js';
import { newComp, run, State } from './commands/utils.js';

helpButton.addEventListener('click', () => {
  if (State.isHelpOpen) {
    execute({ value: 'S' });
    consoleElement.value = '';
    State.isHelpOpen = false;
  } else {
    execute({ value: 'HELP' });
  }
});
logoButton.addEventListener('click', run);
fullRunButton.addEventListener('click', run);

export const editor = CodeMirror(editorContainer, {});
editor.changeFontSize('10px');
editor.setSize(
  mainContainer.getBoundingClientRect().width,
  mainContainer.getBoundingClientRect().height - 80
);
editorContainer.addEventListener(
  'click',
  () => (State.activeWindow = editorContainer)
);

const resize = e => {
  if (State.isFullScreen) {
    editor.setSize(
      mainContainer.getBoundingClientRect().width,
      State.canvasHeight
        ? e.target.innerHeight -
            State.canvasHeight / 2 -
            (State.canvasHeight - 59)
        : e.target.innerHeight - 62
    );
  } else {
    execute({ value: '!LIVE' });
    editor.setSize(
      mainContainer.getBoundingClientRect().width,
      mainContainer.getBoundingClientRect().height - 80
    );
  }
};
window.addEventListener('resize', resize);

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
newComp().click();
execute({ value: 'focus' });
editor.setValue(``);
setTimeout(async () => {
  document.body.removeChild(document.getElementById('splash-screen'));
  State.activeWindow = editorContainer;
  editor.focus();
}, 1000);
