/* eslint-disable no-restricted-syntax */
const { parentPort, workerData } = require('worker_threads');
const { SourceMapConsumer } = require('source-map');

const extractCoverageFromBundle = (file, rangeStart, rangeEnd) => {
  const lineBundleStart = file.substring(0, rangeStart).split(/\n/).length;
  const lineBundleEnd = file.substring(0, rangeEnd).split(/\n/).length;

  return {
    lineBundleStart,
    lineBundleEnd,
  };
};

const initMapConsumer = async (sourceMap) => {
  const consumer = await new SourceMapConsumer(sourceMap);
  return consumer;
};
const destroyMapConsumer = (consumer) => {
  consumer.destroy();
};

const getTraceMap = (consumer, lineStart, lineEnd) => {
  const start = consumer.originalPositionFor({ line: lineStart, column: 0 });
  const end = consumer.originalPositionFor({ line: lineEnd, column: 0 });
  return {
    start,
    end,
  };
};

const getCoverages = (record, files, index) => {
  const coverage = record.map(async (item, i) => {
    if (item.type !== 'codeCoverage') {
      return {
        ...item,
        index,
        ID: `${index}-${Math.random()}`,
      };
    }

    const parsedCodeCoverage = item.coverage.map(async (bundle) => {
      const { functions } = bundle;
      const { content, map } = files.find(
        (file) => file.scriptId === bundle.scriptId
      );
      const consumer = await initMapConsumer(map);

      const functionCoverage = functions.map((functionItem) => {
        const { lineBundleStart, lineBundleEnd } = extractCoverageFromBundle(
          content,
          functionItem.ranges.startOffset,
          functionItem.ranges.endOffset
        );
        const { start, end } = getTraceMap(
          consumer,
          lineBundleStart,
          lineBundleEnd
        );
        if (start.line === null && end.line === null) return null;

        const orginalFileIndex = map.sources.indexOf(start.source);
        const originalFile = map.sourcesContent[orginalFileIndex];
        const originalFileLines = originalFile.split(/\n/);

        let codeCoverage = null;
        codeCoverage = originalFileLines.slice(start.line - 1, end.line);

        return {
          start,
          end,
          functionName: functionItem.functionName,
          codeCoverage,
          count: functionItem.ranges.count,
        };
      });
      destroyMapConsumer(consumer);
      return {
        scriptId: bundle.scriptId,
        url: bundle.url,
        functions: functionCoverage.filter((func) => func !== null),
        timeStamp: item.timeStamp,
        type: 'codeCoverage',
        index,
        ID: `${index}-${Math.random()}`,
      };
    });
    const coverages = await Promise.all(parsedCodeCoverage);
    return coverages;
  });

  return Promise.all(coverage);
};

const getNetworkCallStack = async (payload, files) => {
  const result = payload.map(async (item) => {
    if (item.type === 'requestWillBeSent' && item.stack !== undefined) {
      return {
        ...item,
        stack: await Promise.all(
          item.stack.callFrames.map(async (frame) => {
            const { functionName, scriptId, url, lineNumber } = frame;
            const { content, map } = files.find(
              (file) => file.scriptId === scriptId
            );
            const consumer = await initMapConsumer(map);
            const { start } = getTraceMap(consumer, lineNumber, lineNumber);
            destroyMapConsumer(consumer);
            return {
              functionName,
              lineNumber: start.line,
              file: start.source,
            };
          })
        ),
      };
    }
    return item;
  });
  const finalPayload = await Promise.all(result);
  return finalPayload;
};

getCoverages(workerData.record, workerData.files, workerData.index)
  .then((result) => getNetworkCallStack(result.flat(), workerData.files))
  .then((payload) =>
    parentPort.postMessage({
      command: 'finalCoverage',
      payload,
    })
  )
  .catch((err) => {
    throw err;
  });
