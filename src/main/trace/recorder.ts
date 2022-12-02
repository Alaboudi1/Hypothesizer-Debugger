import * as puppeteer from 'puppeteer-core';
import axios from 'axios';
import { injectedCode } from './injectedScript';

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

let browser: puppeteer.Browser | null = null;
let page: puppeteer.Page | null = null;
let client: puppeteer.CDPSession | null = null;
const executablePathForMacOS =
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const executablePathForWindows =
  // use edge
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const executablePathForLinux = '/usr/bin/google-chrome';

let setIntervalCallback: string | number | NodeJS.Timer | undefined;
let coverage: coverage[] = [];
let networkEventsCoverage: networkEvents[] = [];

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
  ).catch((error) => {
    debugger;
    console.log(error);
  });

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
      const cleanedFunctions = functions
        .map(({ functionName, ranges }) => {
          return {
            functionName,
            ranges: ranges[0],
          };
        })
        .filter((f) => f.ranges.count > 0);
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
  // FIX Error: Execution context was destroyed, most likely because of a navigation.
  await page?.waitForSelector('body');
  await page.evaluate(injectedCode);
  await client.send('DOM.enable');
  await client.on('DOM.documentUpdated', async () => {
    await page.evaluate(injectedCode);
  });
};
const networkEvents = async () => {
  await client.send('Network.enable');

  client.on('Network.requestWillBeSent', (params) => {
    const timeStamp = Date.now();
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
    if (params.response.mimeType === 'application/json') {
      setTimeout(async () => {
        client
          ?.send('Network.getResponseBody', {
            requestId: params.requestId,
          })
          .then((res) => {
            return networkEventsCoverage.push({
              type: 'responseReceived',
              requestId: params.requestId,
              timeStamp,
              url: params.response.url,
              status: params.response.status,
              mimeType: params.response.mimeType,
              data: res.body,
            });
          })
          .catch((error) => {
            networkEventsCoverage.push({
              type: 'responseReceived',
              requestId: params.requestId,
              timeStamp,
              url: params.response.url,
              status: params.response.status,
              mimeType: params.response.mimeType,
              data: '{}',
            });
          });
      }, 100);
    } else {
      networkEventsCoverage.push({
        type: 'responseReceived',
        requestId: params.requestId,
        timeStamp,
        url: params.response.url,
        status: params.response.status,
        mimeType: params.response.mimeType,
      });
    }
  });
};
const launchBrowser = async (url: string, width: number, height: number) => {
  try {
    if (browser === null) {
      browser = await puppeteer.launch({
        headless: false,
        executablePath: getOS(),
        args: [
          `--window-size=${(width - 50) / 2},${height}`,
          '--disable-web-security',
          '--disable-features=IsolateOrigins,site-per-process',
          '--disable-site-isolation-trials',
          '--no-sandbox',
          '--disable-setuid-sandbox',
        ],
        defaultViewport: null,
      });
    }
    if (page === null) {
      page = await browser.newPage();
      await page.goto(url);
    } else {
      await page.goto(url);
      await page.evaluate(() => {
        localStorage.clear();
      });
    }
  } catch (error) {
    throw new Error(error);
  }
};

const record = async () => {
  client = await page?.target().createCDPSession();
  if (client === null) {
    throw new Error('client is null');
  }
  await DomEvents();
  await networkEvents();
  await client?.send('Profiler.enable');
  await client?.send('Profiler.startPreciseCoverage', {
    callCount: true,
    detailed: true,
  });
  setIntervalCallback = setInterval(async () => {
    const timeStamp = Date.now() + 3;
    const result = await client.send('Profiler.takePreciseCoverage');
    await client.send('Profiler.setSamplingInterval', {
      interval: 0,
    });
    coverage.push({ result, timeStamp, type: 'codeCoverage' });
  }, 0);
  return Promise.resolve();
};

const stopRecording = async () => {
  const timeStamp = Date.now();
  try {
    const result = await client.send('Profiler.takePreciseCoverage');
    coverage.push({ result, timeStamp, type: 'codeCoverage' });
    clearInterval(setIntervalCallback);
  } catch (error) {
    throw new Error(error);
  }

  await client.send('Profiler.stopPreciseCoverage');
  const events = await page.evaluate(() => {
    return JSON.parse(localStorage.getItem('events') || '[]');
  });
  await client.send('Profiler.disable');
  await client.send('Network.disable');
  await client.send('DOM.disable');

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

  const payload = [...finalCoverage, ...events, ...networkEventsCoverage].sort(
    (a, b) => a.timeStamp - b.timeStamp
  );

  coverage = [];

  networkEventsCoverage = [];

  return {
    coverage: payload,
    files: await getFiles(finalCoverage),
  };
};

export { record, stopRecording, launchBrowser };
