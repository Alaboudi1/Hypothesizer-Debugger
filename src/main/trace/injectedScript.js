/* eslint-disable no-underscore-dangle */
/* eslint-disable no-restricted-syntax */
const init = () => {
  document.body.focus();
  const saveEvents = (events) => {
    const previousEvents = JSON.parse(localStorage.getItem('events')) || [];
    localStorage.setItem('events', JSON.stringify([...previousEvents, events]));
  };

  const getDataForClick = (event, type, timeStamp = Date.now()) => {
    // search for reactFiber
    let reactFiber = { _debugSource: undefined };

    for (const [key, value] of Object.entries(event.target)) {
      if (key.startsWith('__reactFiber$')) {
        reactFiber = value;
        break;
      }
    }

    const data = {
      jsx: reactFiber._debugSource,
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
    input.addEventListener('click', (e) => getDataForClick(e, 'click'));
  });
  // attach click event to all button elements
  document.querySelectorAll('button').forEach((button) => {
    button.addEventListener('click', (e) => getDataForClick(e, 'click'));
  });

  // attach keyup event to keypress input elements
  document.querySelectorAll('input[type="text"]').forEach((input) => {
    input.addEventListener('keydown', (e) => getDataForClick(e, 'keydown'));
  });

  const callback = (mutationsList) => {
    const timeStamp = Date.now();
    mutationsList.forEach((mutation) => {
      if (
        !['BODY', 'SCRIPT', 'STYLE', 'HEAD'].includes(mutation.target.tagName)
      ) {
        const data = {
          type: 'mutation',
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
