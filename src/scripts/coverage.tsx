import {
  TraceMap,
  originalPositionFor,
  generatedPositionFor,
  OriginalMapping,
  SourceMapInput,
  InvalidOriginalMapping,
} from '@jridgewell/trace-mapping';
import {
  Position,
  Profile,
  TraceElement,
  TraceWithMapping,
  Event,
  Location,
} from '../types/finalTypes';
import { ProfilerOutput, TemporaryEventType } from '../types/RawCoverageTypes';

const convertPath = (windowsPath: string) =>
  windowsPath
    .replace(/^\\\\\?\\/, '')
    .replace(/\\/g, '/')
    .replace(/\/\/+/g, '/');

const extractCoverageFromBundle = (
  rangeStart: number,
  rangeEnd: number,
  file: string
) => {
  const lineBundleStart = file.substring(0, rangeStart).split(/\n/).length;
  const lineBundleEnd = file.substring(0, rangeEnd).split(/\n/).length;

  return {
    lineBundleStart,
    lineBundleEnd,
  };
};

const extractCodeCoverageFromJSX = (startLineNumber: number, file: string) => {
  let rangeEnd = startLineNumber - 1;
  const coverage = [];
  while (rangeEnd <= file.length) {
    coverage.push(file[rangeEnd]);
    const code = coverage.join('\n');
    if (code.search('/>') > 0 || code.search('</') > 0) break;
    rangeEnd++;
  }
  return coverage;
};

const CodeCoverageMetaData = (
  coverageBundleLocation: {
    //Params
    lineBundleStart: number;
    lineBundleEnd: number;
  },
  bundleMap: SourceMapInput,
  offSet: number
): {
  // Return Type
  startPosition: OriginalMapping;
  endPosition: OriginalMapping;
  lineBundleStart: number;
  lineBundleEnd: number;
} | null => {
  const tracer = new TraceMap(bundleMap as SourceMapInput);
  const startPosition: InvalidOriginalMapping | OriginalMapping =
    originalPositionFor(tracer, {
      line: coverageBundleLocation.lineBundleStart + offSet,
      column: 0,
    });
  const endPosition: InvalidOriginalMapping | OriginalMapping =
    originalPositionFor(tracer, {
      line: coverageBundleLocation.lineBundleEnd + offSet,
      column: 0,
    });
  if (startPosition.line === null || endPosition.line === null) {
    return null;
  }
  let accurateLine = endPosition.line;
  for (let i = 0; i < 20; i++) {
    const generated = generatedPositionFor(tracer, {
      source: endPosition.source == null ? '' : endPosition.source,
      line: accurateLine + 1,
      column: endPosition.column == null ? 0 : endPosition.column,
    });
    if (generated.line != null) break;
    accurateLine++;
  }

  endPosition.line = accurateLine;
  return {
    ...coverageBundleLocation,
    startPosition,
    endPosition,
  };
};

const extractCodeCoverage = (
  rangeStart: number,
  range: number,
  files: any[],
  fileName: string
) => {
  const file = files.find(
    (e: any) => new URL(e.url).pathname.search(fileName) > -1
  );
  return file?.content.split(/\n/).splice(rangeStart - 1, range + 1);
};

const groupByToMap = <T, Q>(
  array: T[],
  predicate: (value: T, index: number, array: T[]) => Q,
  map: Map<Q, T[]>
) =>
  array.reduce((map, value, index, array) => {
    const key = predicate(value, index, array);
    map.get(key)?.push(value) ?? map.set(key, [value]);
    return map;
  }, map);

export const getCoverage = (
  codeCoverage: ProfilerOutput,
  DomEventCoverage: TemporaryEventType[]
): TraceWithMapping => {
  // const profile: Profile[] = codeCoverage.profile.map((e): Profile => {
  //   const fileURL = new URL(e.callFrame.url).pathname.substring(1)
  //   const files = codeCoverage.bundleAndMap.find(([, bundleMap]) => bundleMap.file === fileURL)
  //   if (files === undefined) {
  //     throw new Error('SourceMap does not exist, Coverage not found')
  //   }
  //   const [, bundleMap]: [string, SourceMapInput] = files
  //   const lineBundleStart = e.callFrame.lineNumber
  //   const lineBundleEnd = e.callFrame.lineNumber
  //   const codeCoverageMetaData = CodeCoverageMetaData({ lineBundleStart, lineBundleEnd }, bundleMap, 1)
  //   if (codeCoverageMetaData == null || codeCoverageMetaData.startPosition.source == null) throw new Error('Coverage not found')
  //   return {
  //     startPosition: codeCoverageMetaData.startPosition as Position,
  //     endPosition: codeCoverageMetaData.endPosition as Position,
  //     lineBundleStart: codeCoverageMetaData.lineBundleStart,
  //     lineBundleEnd: codeCoverageMetaData.lineBundleEnd,
  //     callFrame: e.callFrame,
  //     children: e.children,
  //     hitCount: e.hitCount,
  //     id: e.id,
  //     functionName: e.functionName,
  //     positionTicks: e.positionTicks,
  //     coverage: extractCodeCoverage(
  //       codeCoverageMetaData.startPosition.line,
  //       codeCoverageMetaData.endPosition.line - codeCoverageMetaData.startPosition.line,
  //       codeCoverage.allFiles,
  //       codeCoverageMetaData.startPosition.source,
  //     ),
  //   }
  // })

  const trace: TraceElement[] = codeCoverage.trace
    .map((e): TraceElement | null => {
      const fileURL = new URL(e.url).pathname.substring(1);
      const files = codeCoverage.bundleAndMap.find(
        ([, sourceMap]) => sourceMap.file === fileURL
      );

      if (files === undefined) {
        throw new Error(
          'Event does not contain Mapping. common files found is undefined'
        );
      }
      const [bundle, bundleMap] = files;
      const { startOffset, endOffset } = e.ranges[0];
      const coverage = extractCoverageFromBundle(
        startOffset,
        endOffset,
        bundle
      );
      const codeCoverageMetaData = CodeCoverageMetaData(coverage, bundleMap, 0);
      if (
        codeCoverageMetaData == null ||
        codeCoverageMetaData.startPosition.source == null
      )
        return null;

      return {
        coverage: extractCodeCoverage(
          codeCoverageMetaData.startPosition.line,
          codeCoverageMetaData.endPosition.line -
            codeCoverageMetaData.startPosition.line,
          codeCoverage.allFiles,
          codeCoverageMetaData.startPosition.source
        ),
        startPosition: codeCoverageMetaData.startPosition as Position,
        endPosition: codeCoverageMetaData.endPosition as Position,
        lineBundleStart: codeCoverageMetaData.lineBundleStart,
        lineBundleEnd: codeCoverageMetaData.lineBundleEnd,
        functionName: e.functionName,
        isBlockCoverage: e.isBlockCoverage,
        ranges: e.ranges,
        url: e.url,
        timestamp: e.timestamp,
      };
    })
    .filter<TraceElement>(
      (e: TraceElement | null): e is TraceElement => e != null
    )
    .sort((a: TraceElement, b: TraceElement) => a.timestamp - b.timestamp);

  const events: Event[] = DomEventCoverage.map(
    (e: TemporaryEventType): Event => {
      if (e.location === null) {
        throw new Error('Coverage not found for event' + e.type);
      }
      e.location.fileName = convertPath(e.location.fileName);
      const fileContent = extractCodeCoverage(
        -Infinity,
        Infinity,
        codeCoverage.allFiles,
        e.location.fileName
      );
      const coverage = extractCodeCoverageFromJSX(
        e.location.lineNumber,
        fileContent
      );

      return {
        type: e.type, //"attributes" | "childList" | "click" | "keydown";
        coverage:
          e.type === 'mutation'
            ? e.addNode?.length > 0
              ? { mutation: e.addNode, type: 'added' }
              : { mutation: e.removeNode, type: 'removed' }
            : coverage,
        startPosition: {
          line: e.location.lineNumber,
          source: e.location.fileName,
        } as Position,
        endPosition: {
          line: e.location.lineNumber + coverage.length - 1,
          source: e.location.fileName,
        } as Position,
        location: { ...e.location } as Location,
        state: { ...e.state },
        timestamp: e.timestamp,
        value: e.srcElement?.value, // srcElement : {value: "", tagName: ""} unpacked
        tagName: e.srcElement?.tagName,
        target: e.target,
      };
    }
  ).sort((a: Event, b: Event) => a.timestamp - b.timestamp);
  const groupedTraceByTimestamp = groupByToMap(
    trace,
    (t) => t.timestamp,
    new Map()
  );
  const groupedEventsByTimestamp = groupByToMap(
    events,
    (e) => e.timestamp,
    groupedTraceByTimestamp as any
  );
  const groupedNetworkEventsByTimestamp = groupByToMap(
    codeCoverage.newtworkCoverage,
    (e) => e.timestamp,
    groupedEventsByTimestamp as any
  );
  const sortedTraceBykey = Array.from(
    groupedNetworkEventsByTimestamp.entries()
  ).sort((a, b) => a[0] - b[0]);
  console.log(events, trace, sortedTraceBykey);
  return {
    trace: trace,
    profile: [],
    events: events,
  };
};
