const { parentPort, workerData } = require('worker_threads');

const getFileContent = (coverages, files) => {
  const filesContent = [];
  coverages.forEach((coverage) => {
    coverage.values.codeCoverage.forEach((codeC) => {
      if (filesContent.findIndex((f) => f.file === codeC.file) === -1) {
        const file = files.find((f) => f.scriptId === codeC.bundleId);
        const orginalFileIndex = file.map.sources.indexOf(codeC.file);
        const originalFile = file.map.sourcesContent[orginalFileIndex];
        filesContent.push({
          file: codeC.file,
          content: originalFile,
        });
      }
    });
  });
  return filesContent;
};

const mergeCoverage = (coverageMaps, files) => {
  const codeCoverageMerge = (value, codeCoverage) => {
    let mergedCoverage;
    if (codeCoverage.length === 0) {
      mergedCoverage = [value];
    } else {
      let found = false;
      mergedCoverage = codeCoverage.map((c) => {
        if (c.file === value.file) {
          found = true;
          return {
            ...c,
            timeStamp: [c.timeStamp, value.timeStamp].flat(),
            functions: [...value.functions, ...c.functions].reduce(
              (acc, cur) => {
                const index = acc.findIndex(
                  (a) => a.codeCoverage.join('') === cur.codeCoverage.join('')
                );
                if (index === -1) {
                  acc.push(cur);
                } else {
                  acc[index].count += cur.count;
                }

                return acc;
              },
              []
            ),
          };
        }
        return c;
      });
      if (!found) {
        mergedCoverage.push(value);
      }
    }
    return mergedCoverage;
  };

  return coverageMaps.map((coverageMap) => {
    let codeCoverage = [];
    let UICoverage = [];
    let networkCoverage = [];
    const values = coverageMap.values.map((value) => {
      if (value.type === 'codeCoverage') {
        codeCoverage = codeCoverageMerge(value, codeCoverage);
      }
      if (['mutation', 'click', 'keydown'].includes(value.type)) {
        UICoverage.push(value);
      }
      if (['responseReceived', 'requestWillBeSent'].includes(value.type)) {
        networkCoverage.push(value);
      }
      return value;
    });
    return {
      ...coverageMap,
      values: {
        codeCoverage,
        UICoverage,
        networkCoverage,
      },
    };
  });
};

const cleanCodeCoverage = (coverage, files) => {
  const functionsCoverage = new Map();
  const getCoverage = (func) => ({
    functionName: func.functionName,
    count: func.count,
    codeCoverage: func.codeCoverage,
  });
  coverage.functions.forEach((func) => {
    if (functionsCoverage.has(func.start.source)) {
      functionsCoverage.get(func.start.source).push(getCoverage(func));
    } else {
      functionsCoverage.set(func.start.source, [getCoverage(func)]);
    }
  });
  const cleanCodeCoverages = [];
  functionsCoverage.forEach((value, key) => {
    cleanCodeCoverages.push({
      file: key,
      functions: value,
      timeStamp: coverage.timeStamp,
      type: 'codeCoverage',
      bundleId: coverage.scriptId,
    });
  });
  return cleanCodeCoverages;
};

const constrcutTimeLine = (coverages, files) => {
  const data = coverages
    .map((coverage) => {
      if (coverage.type === 'codeCoverage') {
        return cleanCodeCoverage(coverage, files);
      }
      return coverage;
    })
    .flat();
  const output = [
    'output',
    'mutation',
    'responseReceived',
    'requestWillBeSent',
  ];
  const input = ['input', 'click', 'keydown'];
  const turns = [input, output];
  let item = data.find((c) => c.type !== 'codeCoverage');
  let pointer = input.includes(item?.type) ? 0 : 1;
  const coverageMaps = [];
  let index = 0;
  data.forEach((coverage, i) => {
    let map = coverageMaps[index];
    if (map === undefined) {
      map = {
        turn: turns[pointer][0],
        values: [],
      };
    }
    map.values.push(coverage);
    coverageMaps[index] = map;
    const nextItem = data[i + 1];
    if (nextItem) {
      const nextPointer = input.includes(nextItem.type)
        ? 0
        : output.includes(nextItem.type)
        ? 1
        : pointer;

      if (pointer !== nextPointer) {
        pointer = nextPointer;
        index += 1;
      }
    }
  });
  const mergedCoverageMaps = mergeCoverage(coverageMaps, files);
  const filesContent = getFileContent(mergedCoverageMaps, files);
  return {
    mergedCoverageMaps,
    filesContent,
  };
};

let { coverages, files } = workerData;
coverages = coverages.flat().sort((a, b) => {
  return a.index - b.index || a.timeStamp - b.timeStamp;
});
const result = constrcutTimeLine(coverages, files);
parentPort.postMessage({
  result,
  command: 'finalCoverage',
});
