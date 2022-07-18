import { CodeMirror } from './libs/editor/cell.editor.bundle.js';
import {
  canvasContainer,
  consoleElement,
  editorContainer,
  appButton,
  focusButton,
  mainContainer,
  // helpButton,
  // keyButton,
  // featuredButton,
  fullRunButton,
  nextButton,
  // exitFullButton,
  editorResizerElement,
  consoleResizerElement,
  dowloadButton
} from './extentions/extentions.js';
import { execute } from './commands/exec.js';
import { resizer, newComp, run, State } from './commands/utils.js';
dowloadButton.addEventListener('click', () => execute({ value: 'BUILD' }));
// helpButton.addEventListener('click', () => {
//   execute({ value: 'HELP' });
// });
appButton.addEventListener('click', () => {
  if (State.lastComposition) {
    execute({ value: 'SHOW' });
  }
});
focusButton.addEventListener('click', () => {
  if (State.lastComposition) {
    execute({ value: 'FOCUS' });
  }
});

fullRunButton.addEventListener('click', run);
// exitFullButton.addEventListener('click', async () => {
//   await execute({ value: 'EXIT' });
//   window.dispatchEvent(new Event('resize'));
//   editorContainer.scrollIntoView({
//     block: 'end',
//     inline: 'nearest'
//   });
// });

// featuredButton.addEventListener('click', () => {
//   State.latestCurrentPage = 0;
//   execute({ value: 'EMPTY' }).then(() => execute({ value: 'FEATURED ' }));
// });
nextButton.addEventListener('click', () => {
  if (State.currentCollection) {
    execute({ value: `STACK ${State.currentCollection}` }).then(() =>
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: 'smooth'
      })
    );
  }
  nextButton.style.height = 0;
});
export const editor = CodeMirror(editorContainer, {});
editor.changeFontSize('12pt');
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
    // editor.setSize(
    //   mainContainer.getBoundingClientRect().width,
    //   State.canvasHeight
    //     ? e.target.innerHeight -
    //         State.canvasHeight / 2 -
    //         (State.canvasHeight - 59)
    //     : e.target.innerHeight - 62
    // );

    editor.setSize(
      mainContainer.getBoundingClientRect().width,
      State.height - State.canvasHeight - 50
    );
    // consoleElement.style.top = State.canvasHeight - 10 + 'px';
    // consoleElement.style.height =
    //   mainContainer.getBoundingClientRect().height - State.canvasHeight + 'px';
  } else {
    execute({ value: '!LIVE' });
    editor.setSize(
      mainContainer.getBoundingClientRect().width,
      mainContainer.getBoundingClientRect().height - 80
    );
  }
  canvasContainer.innerHTML = `<img src="./assets/images/404.svg" height="250" width="100%" />`;
};
window.addEventListener('resize', resize);
if (!/Mobi|Android/i.test(navigator.userAgent)) {
  resizer(
    consoleResizerElement,
    e => {
      if (State.isFullScreen && e.pageY > 5) {
        const height = mainContainer.getBoundingClientRect().height;
        // State.height = e.pageY;
        consoleResizerElement.style.bottom = height - e.pageY + 10 + 'px';
        consoleElement.style.top = e.pageY - 10 + 'px';
        consoleElement.style.height = height - e.pageY + 'px';

        // editor.setSize(
        //   mainContainer.getBoundingClientRect().width,
        //   State.height - State.canvasHeight - 10
        // );
      }
    },
    'row-resize'
  );

  resizer(
    editorResizerElement,
    e => {
      if (
        State.isFullScreen &&
        e.pageY > 5 &&
        e.pageY < mainContainer.getBoundingClientRect().height
      ) {
        State.canvasHeight = e.pageY;
        canvasContainer.style.height = e.pageY + 'px';
        editor.setSize(
          mainContainer.getBoundingClientRect().width,
          mainContainer.getBoundingClientRect().height - State.canvasHeight - 50
        );
      }
    },
    'row-resize'
  );
}

document.addEventListener('keydown', e => {
  const activeElement = document.activeElement;
  if (e.key && e.key.toLowerCase() === 's' && (e.ctrlKey || e.metaKey)) {
    e = e || window.event;
    e.preventDefault();
    e.stopPropagation();
    run();
    localStorage.setItem('stash', editor.getValue());
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
newComp('Unknown user').click();
editor.setValue(localStorage.getItem('stash') ?? '');

execute({ value: 'FOCUS' });
execute({ value: 'FONT ' + +localStorage.getItem('font') });
State.activeWindow = editorContainer;
editor.focus();
// execute({ value: 'FULLSCREEN' });
setTimeout(async () => {
  document.body.removeChild(document.getElementById('splash-screen'));
}, 1000);

window.addEventListener('scroll', e => {
  if (State.currentCollection === null) return;
  const offset = window.pageYOffset + window.innerHeight;
  if (offset > document.documentElement.scrollHeight - 1) {
    nextButton.style.height = '30px';
    // State.currentScrollTimeouts.forEach(
    //   t => clearTimeout(t) ?? State.currentScrollTimeouts.delete(t)
    // );
    // State.currentScrollTimeouts.add(
    //   setTimeout(() => {
    //     execute({ value: `STACK ${State.currentCollection}` });
    //   }, 250)
    // );
  } else if (
    offset <= document.documentElement.scrollHeight - 1 &&
    offset >= document.documentElement.scrollHeight - 50
  ) {
    nextButton.style.height = 0;
  }
});
