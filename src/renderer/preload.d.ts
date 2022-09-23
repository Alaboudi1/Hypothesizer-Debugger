import { Channels } from 'main/preload';

type Message = {
  command: string;
  payload: unknown;
};

declare global {
  interface Window {
    electron: {
      ipcRenderer: {
        sendMessage(
          channel: Channels,
          args: {
            command: string;
            payload?: unknown;
          }
        ): void;
        on(
          channel: string,
          func: (args: Message) => void
        ): (() => void) | undefined;
        once(channel: string, func: (args: Message) => void): void;
      };
    };
  }
}

export {};
