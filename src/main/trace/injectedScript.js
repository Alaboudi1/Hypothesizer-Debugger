/* eslint-disable no-underscore-dangle */
/* eslint-disable no-restricted-syntax */
const init = () => {
  document.body.focus();
  const saveEvents = (events) => {
    const previousEvents = JSON.parse(localStorage.getItem('events')) || [];
    localStorage.setItem('events', JSON.stringify([...previousEvents, events]));
  };
  const getReactFiber = (event) => {
    let reactFiber = { _debugSource: undefined };
    if (event.target === undefined) return reactFiber;

    for (const [key, value] of Object.entries(event.target)) {
      if (key.startsWith('__reactFiber$')) {
        reactFiber = value;
        break;
      }
    }
    return reactFiber;
  };
  const getDataForClick = (event, type, timeStamp) => {
    // search for reactFiber
    const reactFiber = getReactFiber(event);

    const data = {
      jsx: {
        fileName: reactFiber._debugSource?.fileName
          .split('src')[1]
          .replace(/[\/\\]/g, '='),
        lineNumber: reactFiber._debugSource?.lineNumber,
      },
      target: event.target.tagName,
      InputType: event.target.type,
      type,
      srcElement: {
        value: event.target.value,
        tagName: event.target.tagName,
      },
      keyPressed: event.key,
      HTML: event.srcElement.outerHTML,
      timeStamp,
    };

    saveEvents(data);
  };

  // attach click event to all input elements
  document.querySelectorAll('input').forEach((input) => {
    input.addEventListener('click', (e, timeStamp = Date.now()) =>
      getDataForClick(e, 'click', timeStamp)
    );
  });
  // attach click event to all button elements
  document.querySelectorAll('button').forEach((button) => {
    button.addEventListener('click', (e, timeStamp = Date.now()) =>
      getDataForClick(e, 'click', timeStamp)
    );
  });

  // attach keyup event to keypress input elements
  document.querySelectorAll('input[type="text"]').forEach((input) => {
    input.addEventListener('keydown', (e, timeStamp = Date.now()) =>
      getDataForClick(e, 'keydown', timeStamp)
    );
  });

  const callback = (mutationsList) => {
    const timeStamp = Date.now() + 3;
    mutationsList.forEach((mutation) => {
      if (
        !['BODY', 'SCRIPT', 'STYLE', 'HEAD'].includes(mutation.target.tagName)
      ) {
        const data = {
          type: 'mutation',
          addNode: [...mutation.addedNodes].map((node) => {
            const reactFiber = getReactFiber(node);

            return {
              HTML: node.innerHTML ?? node.textContent,
              tagName: node.tagName ?? node.nodeName,
              jsx: {
                fileName: reactFiber._debugSource?.fileName
                  .split('src')[1]
                  .replace(/[\/\\]/g, '='),
                lineNumber: reactFiber._debugSource?.lineNumber,
              },
            };
          }),
          removeNode: [...mutation.removedNodes].map((node) => {
            return {
              HTML: node.innerHTML ?? node.textContent,
              tagName: node.tagName ?? node.nodeName,
            };
          }),
          attributeName: mutation.attributeName,
          value: mutation.target.value,
          tagName: mutation.target.tagName,
          timeStamp,
        };
        saveEvents(data);
      }
    });
  };

  new MutationObserver(callback).observe(document, {
    attributes: false,
    childList: true,
    subtree: true,
  });
};
const injectedCode = `(${init})();`;
export { injectedCode };
