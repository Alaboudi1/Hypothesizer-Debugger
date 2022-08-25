import {
  TraceMap,
  originalPositionFor,
  SourceMapInput,
} from '@jridgewell/trace-mapping';

const extractCoverageFromBundle = (
  file: string,
  rangeStart: number,
  rangeEnd: number
) => {
  const lineBundleStart = file.substring(0, rangeStart).split(/\n/).length;
  const lineBundleEnd = file.substring(0, rangeEnd).split(/\n/).length;

  return {
    lineBundleStart,
    lineBundleEnd,
  };
};

const getTraceMap = (
  sourceMap: SourceMapInput,
  lineStart: number,
  lineEnd: number
): any => {
  const traceMap = new TraceMap(sourceMap);
  const start = originalPositionFor(traceMap, { line: lineStart, column: 0 });
  const end = originalPositionFor(traceMap, { line: lineEnd, column: 0 });
  return {
    start,
    end,
  };
};

const getCoverages = (record, files) => {
  const coverage = record.map((item) => {
    if (item.type !== 'codeCoverage') {
      return item;
    }
    const parsedCodeCoverage = item.coverage.map((bundle) => {
      const { functions } = bundle;
      const { content, map } = files.find(
        (file) => file.scriptId === bundle.scriptId
      );

      const functionCoverages = functions
        .map((functionItem) => {
          const { lineBundleStart, lineBundleEnd } = extractCoverageFromBundle(
            content,
            functionItem.ranges.startOffset,
            functionItem.ranges.endOffset
          );
          const { start, end } = getTraceMap(
            map,
            lineBundleStart,
            lineBundleEnd
          );
          let codeCoverage = null;
          if (start.line === null && end.line === null) return null;
          const orginalFileIndex = map.sources.indexOf(start.source);
          const originalFile = map.sourcesContent[orginalFileIndex];
          const originalFileLines = originalFile.split(/\n/);

          codeCoverage = originalFileLines.slice(start.line - 1, end.line);
          return {
            start,
            end,
            functionName: functionItem.functionName,
            codeCoverage,
            count: functionItem.ranges.count,
          };
        })
        .filter((item) => item !== null);
      return {
        scriptId: bundle.scriptId,
        url: bundle.url,
        functions: functionCoverages,
      };
    });
    return {
      type: 'codeCoverage',
      coverage: parsedCodeCoverage,
    };
  });

  return coverage;
};

export default getCoverages;
