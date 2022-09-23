import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

export type Channels = 'CDP';
export type Args = { command: string; payload?: unknown };

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    sendMessage(channel: Channels, args: Args) {
      ipcRenderer.send(channel, args);
    },
    on(channel: Channels, func: (args: Args) => void) {
      const subscription = (_event: IpcRendererEvent, args: Args) => func(args);
      ipcRenderer.on(channel, subscription);

      return () => ipcRenderer.removeListener(channel, subscription);
    },
    once(channel: Channels, func: (args: Args) => void) {
      ipcRenderer.once(channel, (_event, args) => func(args));
    },
  },
});
