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

const mergeCoverage = (
  coverageMaps: { turn: string; values: any[] }[],
  files: any[]
) => {
  const codeCoverageMerge = (value, codeCoverage) => {
    if (codeCoverage.length === 0) {
      codeCoverage = [value];
    } else {
      let found = false;
      codeCoverage = codeCoverage.map((c) => {
        if (c.file === value.file) {
          found = true;
          return {
            ...c,
            // compine functions with same functionName
            timeStamp: [c.timeStamp, value.timeStamp].flat(),
            functions: c.functions.map((f) => {
              const func = value.functions.find(
                (v) => v.codeCoverage.join() === f.codeCoverage.join()
              );
              if (func) {
                return {
                  ...f,
                  count: f.count + func.count,
                };
              }
              return f;
            }),
          };
        }
        return c;
      });
      if (!found) {
        codeCoverage.push(value);
      }
    }
    return codeCoverage;
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
        // UICoverageMerge(value, UICoverage);
        UICoverage.push(value);
      }
      if (['responseReceived', 'requestWillBeSent'].includes(value.type)) {
        // networkCoverageMerge(value, networkCoverage);
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
  const cleanCodeCoverage: {
    file: string;
    functions: any[];
    timeStamp: number;
    type: string;
    bundleId: string;
  }[] = [];
  functionsCoverage.forEach((value, key) => {
    cleanCodeCoverage.push({
      file: key,
      functions: value,
      timeStamp: coverage.timeStamp,
      type: 'codeCoverage',
      bundleId: coverage.scriptId,
    });
  });
  return cleanCodeCoverage;
};

const constrcutTimeLine = (coverages: any[], files: any) => {
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
  const coverageMaps: any[] = [];
  let index = 0;
  data.forEach((coverage: any, i: number) => {
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

export default constrcutTimeLine;
