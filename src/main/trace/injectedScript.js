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

    const debugSource =
      reactFiber._debugSource || reactFiber._debugOwner?._debugSource;
    return debugSource;
  };
  const getDataForEvent = (event, type, timeStamp) => {
    // search for reactFiber
    const debugSource = getReactFiber(event);

    const data = {
      jsx: {
        fileName: `src${debugSource?.fileName
          .split('src')[1]
          .replace(/[\/\\]/g, '=')}`,
        lineNumber: debugSource?.lineNumber,
      },
      target: event.target.tagName,
      InputType: event.target.type,
      type,
      srcElement: {
        value: event.target.value,
        tagName: event.target.tagName,
      },
      keyPressed: event.key,
      HTML:
        type === 'mouseover' || type === 'mouseout'
          ? undefined
          : event.srcElement.outerHTML,
      timeStamp,
    };

    saveEvents(data);
  };

  // attach click event to all input elements
  document.querySelectorAll('input').forEach((input) => {
    input.addEventListener('click', (e, timeStamp = Date.now()) =>
      getDataForEvent(e, 'click', timeStamp)
    );
  });
  // attach click event to all button elements
  document.querySelectorAll('button').forEach((button) => {
    button.addEventListener('click', (e, timeStamp = Date.now()) =>
      getDataForEvent(e, 'click', timeStamp)
    );
  });

  // attach keydown event
  document.addEventListener('keydown', (e, timeStamp = Date.now()) =>
    getDataForEvent(e, 'keydown', timeStamp)
  );

  // attach mouseover event
  document.addEventListener('mouseover', (e, timeStamp = Date.now()) =>
    getDataForEvent(e, 'mouseover', timeStamp)
  );
  document.addEventListener('mouseout', (e, timeStamp = Date.now()) =>
    getDataForEvent(e, 'mouseout', timeStamp)
  );
  const callback = (mutationsList) => {
    const timeStamp = Date.now() + 3;
    mutationsList.forEach((mutation) => {
      if (
        !['BODY', 'SCRIPT', 'STYLE', 'HEAD'].includes(mutation.target.tagName)
      ) {
        const debugSource = getReactFiber(mutation);
        const fileName = debugSource?.fileName ?? undefined;
        const jsx = {
          fileName: fileName
            ? `src${fileName.split('src')[1].replace(/[\/\\]/g, '=')}`
            : undefined,
          lineNumber: debugSource?.lineNumber,
        };
        const data = {
          type: mutation.type,
          addNode: [...mutation.addedNodes].map((node) => {
            return {
              HTML: node.innerHTML ?? node.textContent,
              tagName: node.tagName ?? node.nodeName,
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
          jsx,
        };
        saveEvents(data);
      }
    });
  };

  new MutationObserver(callback).observe(document, {
    attributes: true,
    childList: true,
    subtree: true,
  });
};
const injectedCode = `(${init})();`;
export { injectedCode };
