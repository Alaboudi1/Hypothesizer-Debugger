const subscribers = new Map<string, ((callbacks: unknown) => void)[]>();

const initConnector = () => {
  window.electron.ipcRenderer.on('CDP', (message) => {
    // if (message.command === 'finalCoverage') {
    //   const localHypothesesLink =
    //     message.payload.filesContent[0].file
    //       .split('node_modules')
    //       .reverse()[1] || message.payload.filesContent[0].file.split('src')[0];
    //   hypothesesLinks.current.push(`${localHypothesesLink}hypotheses.json`);
    //   setTrace(message.payload);
    //   console.log(message.payload);
    // } else if (message.command === 'progress') {
    //   setLoadingMessage(message.payload);
    // } else if (message.command === 'hypotheses') {
    //   console.log(message.payload);
    // }

    subscribers.get(message.command)?.forEach((callback) => {
      callback(message.payload);
    });
  });
};

const sendCommand = (command: string, payload?: unknown) => {
  window.electron.ipcRenderer.sendMessage('CDP', { command, payload });
};

const subscribeToCommand = (
  command: string,
  callback: (payload: unknown) => void
) => {
  if (!subscribers.has(command)) {
    subscribers.set(command, [callback]);
  } else {
    subscribers.get(command)?.push(callback);
  }
};

export { initConnector, sendCommand, subscribeToCommand };
