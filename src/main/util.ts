/* eslint import/prefer-default-export: off */
import { URL } from 'url';
import path from 'path';
import { execSync } from 'child_process';

export function resolveHtmlPath(htmlFileName: string) {
  if (process.env.NODE_ENV === 'development') {
    const port = process.env.PORT || 1212;
    const url = new URL(`http://localhost:${port}`);
    url.pathname = htmlFileName;
    return url.href;
  }
  return `file://${path.resolve(__dirname, '../renderer/', htmlFileName)}`;
}

export function isDockerRunning() {
  try {
    execSync('docker ps');
    return true;
  } catch (e) {
    return false;
  }
}

export function openFile(url: string) {
  try {
    execSync(`code -g ${url}`);
  } catch (e) {
    throw new Error('Could not open file');
  }
}
