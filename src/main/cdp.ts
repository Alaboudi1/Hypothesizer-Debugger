// import * as puppeteer from 'puppeteer';
import * as puppeteer from 'puppeteer-core';

import axios from 'axios';
import { injectedCode } from './injectedScript';
// node http client

type coverage = {
  result: puppeteer.Protocol.Profiler.TakePreciseCoverageResponse;
  timeStamp: number;
  type: 'codeCoverage';
};

type networkEvents = {
  type: 'responseReceived' | 'requestWillBeSent';
  requestId: string;
  timeStamp: number;
  url: string;
  status?: number;
  mimeType?: string;
  data?: string;
  stack?: any[];
  method?: string;
};

let browser: puppeteer.Browser;
let page: puppeteer.Page;
let client: puppeteer.CDPSession;
const executablePathForMacOS =
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const executablePathForWindows =
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe';
const executablePathForLinux = '/usr/bin/google-chrome';

let setIntervalCallback: string | number | NodeJS.Timer | undefined;
const coverage: coverage[] = [];
const networkEventsCoverage: networkEvents[] = [];

const getFiles = async (coverages: any[]) =>
  Promise.all(
    coverages
      .flatMap(({ coverage }) =>
        coverage.map((file: { scriptId: any; url: any }) => ({
          scriptId: file.scriptId,
          url: file.url,
          content: null,
          map: null,
        }))
      )
      .reduce(
        (files: [], file) =>
          files.find((f) => f.scriptId === file.scriptId) === undefined
            ? files.concat(file)
            : files,
        []
      )
      .map(async (file: { url: string; scriptId: any }) => {
        const [content, map] = await Promise.all([
          axios.get(file.url).then((res) => res.data),
          axios.get(`${file.url}.map`).then((res) => res.data),
        ]);
        return {
          scriptId: file.scriptId,
          url: file.url,
          content,
          map,
        };
      })
  );

const getOS = () => {
  const os = process.platform;
  if (os === 'darwin') {
    return executablePathForMacOS;
  }
  if (os === 'win32') {
    return executablePathForWindows;
  }
  if (os === 'linux') {
    return executablePathForLinux;
  }
  throw new Error(`Unsupported OS: ${os}`);
};

const cleanUpCoverage = (
  coverageInstance: puppeteer.Protocol.Profiler.TakePreciseCoverageResponse
) => {
  const cleanedCoverage = coverageInstance.result
    .map((entry) => {
      const { url, scriptId, functions } = entry;
      const cleanedFunctions = functions.map(({ functionName, ranges }) => {
        return {
          functionName,
          ranges: ranges[0],
        };
      });
      return {
        url,
        scriptId,
        functions: cleanedFunctions,
      };
    })
    .filter((entry) => {
      return entry.url.includes('localhost');
    });

  return cleanedCoverage;
};

const DomEvents = async () => {
  await page.evaluate(injectedCode);
  await client.send('DOM.enable');
  await client.on('DOM.documentUpdated', async () => {
    await page.evaluate(injectedCode);
  });
};
const networkEvents = async () => {
  await client.send('Network.enable');

  client.on('Network.requestWillBeSent', async (params) => {
    const timeStamp = Date.now();
    if (params.type === 'XHR')
      networkEventsCoverage.push({
        type: 'requestWillBeSent',
        stack: params.initiator.stack,
        requestId: params.requestId,
        timeStamp,
        url: params.request.url,
        method: params.request.method,
      });
  });
  client.on('Network.responseReceived', async (params) => {
    const timeStamp = Date.now();

    if (params.type === 'XHR') {
      const data = await client.send('Network.getResponseBody', {
        requestId: params.requestId,
      });

      networkEventsCoverage.push({
        type: 'responseReceived',
        requestId: params.requestId,
        timeStamp,
        url: params.response.url,
        status: params.response.status,
        mimeType: params.response.mimeType,
        data: data.body,
      });
    }
  });
};
const record = async () => {
  browser = await puppeteer.launch({
    headless: false,
    executablePath: getOS(),
    // make the page take the entire screen
    args: ['--window-size=1920,1080'],
    // make the viewport the same size as the screen
    defaultViewport: null,
  });
  page = await browser.newPage();
  await page.goto('http://localhost:3000/');
  client = await page.target().createCDPSession();
  await DomEvents();
  await networkEvents();
  await client.send('Profiler.enable');
  await client.send('Profiler.startPreciseCoverage', {
    callCount: true,
    detailed: true,
  });
  setIntervalCallback = setInterval(async () => {
    const timeStamp = Date.now();
    const result = await client.send('Profiler.takePreciseCoverage');
    await client.send('Profiler.setSamplingInterval', {
      interval: 0,
    });
    coverage.push({ result, timeStamp, type: 'codeCoverage' });
  }, 0);
};

const stopRecording = async () => {
  const timeStamp = Date.now();
  const result = await client.send('Profiler.takePreciseCoverage');
  coverage.push({ result, timeStamp, type: 'codeCoverage' });
  clearInterval(setIntervalCallback);

  await client.send('Profiler.stopPreciseCoverage');
  const events = await page.evaluate(() => {
    return JSON.parse(localStorage.getItem('events') || '[]');
  });
  await browser.close();

  const finalCoverage = coverage
    .map((coverageInstance) => {
      return {
        coverage: cleanUpCoverage(coverageInstance.result),
        timeStamp: coverageInstance.timeStamp,
        type: coverageInstance.type,
      };
    })
    .filter((coverageInstance) => {
      return coverageInstance.coverage.length > 0;
    });

  return {
    coverage: [...finalCoverage, ...events, ...networkEventsCoverage].sort(
      (a, b) => a.timeStamp - b.timeStamp
    ),
    files: await getFiles(finalCoverage),
  };
};

export { record, stopRecording };
