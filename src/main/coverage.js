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
      parentPort.postMessage({
        command: 'progress',
      });
      return {
        ...item,
        index,
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
        parentPort.postMessage({
          command: 'progress',
        });
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
      };
    });
    const coverages = await Promise.all(parsedCodeCoverage);

    return coverages;
  });

  return Promise.all(coverage);
};

const payload = getCoverages(
  workerData.record,
  workerData.files,
  workerData.index
)
  .then((payload) =>
    parentPort.postMessage({
      command: 'finalCoverage',
      payload: payload.flat(),
    })
  )
  .catch((err) => {
    console.log(err);
  });
