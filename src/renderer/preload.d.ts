import { Channels } from 'main/preload';

declare global {
  interface Window {
    electron: {
      ipcRenderer: {
        sendMessage(
          channel: Channels,
          args: {
            command: string;
            payload?: unknown[];
          }
        ): void;
        on(
          channel: string,
          func: (...args: unknown[]) => void
        ): (() => void) | undefined;
        once(channel: string, func: (...args: unknown[]) => void): void;
      };
    };
  }
}

export {};
