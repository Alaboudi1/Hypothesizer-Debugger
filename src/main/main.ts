/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import { app, BrowserWindow, shell, globalShortcut } from 'electron';
import { resolveHtmlPath, isDockerRunning } from './util';
import initConnector from './backendConnector';

let mainWindow: BrowserWindow | null = null;

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const focusOnMainWindow = (flag: boolean) => {
  if (mainWindow) {
    mainWindow.setAlwaysOnTop(flag);
  }
};
const setupDevtools = () => {
  if (mainWindow?.webContents.isDevToolsOpened()) {
    mainWindow?.webContents.closeDevTools();
  } else {
    mainWindow?.webContents.openDevTools();
  }
};

const searchInPage = (searchTerm: string) => {
  mainWindow?.webContents.findInPage(searchTerm);
};
const getMainWindowPositions = () => {
  const { width, height } =
    require('electron').screen.getPrimaryDisplay().workAreaSize;
  return { width, height };
};

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
};

const createWindow = async () => {
  await installExtensions();

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  // get the display size
  const { width, height } = getMainWindowPositions();

  // enable search
  mainWindow = new BrowserWindow({
    show: false,
    width: width / 2,
    height,
    x: width / 2,
    y: 0,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      sandbox: false,
      nodeIntegration: true,
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
    acceptFirstMouse: true,
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => {
      if (mainWindow === null) {
        createWindow();
      }
    });
  })
  .then(() => {
    initConnector(
      setupDevtools,
      getMainWindowPositions,
      isDockerRunning,
      searchInPage,
      focusOnMainWindow
    );
  })
  .catch(console.log);
