const subscribers = new Map<string, ((callbacks: unknown) => void)[]>();

const initConnector = () => {
  window.electron.ipcRenderer.on('CDP', (message) => {
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
const removeAllListeners = () => {
  subscribers.clear();
};

export { initConnector, sendCommand, subscribeToCommand, removeAllListeners };
