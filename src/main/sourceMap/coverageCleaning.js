const { parentPort, workerData } = require('worker_threads');

const getFileContent = (coverages, files) => {
  const filesContent = [];
  coverages.forEach((coverage) => {
    if (coverage.type === 'codeCoverage') {
      const filePath = coverage.file;
      if (
        filePath.includes('src') &&
        !filePath.includes('node_modules') &&
        !filePath.includes('webpack')
      ) {
        if (filesContent.findIndex((f) => f.file === filePath) === -1) {
          const file = files.find((f) => f.scriptId === coverage.scriptId);
          const paths = file.map.sources.map((s) => {
            if (s.includes('src'))
              return `src${s.split('src')[1].replace(/[\/\\]/g, '=')}`;
          });
          const orginalFileIndex = paths.indexOf(filePath);
          const originalFile = file.map.sourcesContent[orginalFileIndex];
          filesContent.push({
            file: filePath,
            content: originalFile,
          });
        }
      }
    }
  });
  return filesContent;
};

const cleanCodeCoverage = (coverage, files) => {
  const getCoverage = (func) => ({
    functionName: func.functionName,
    count: func.count,
    ranges: [func.start.line, func.end.line],
    type: 'codeCoverage',
    file:
      func.start.source.includes('src') &&
      !func.start.source.includes('node_modules')
        ? `src${func.start.source.split('src')[1].replace(/[\/\\]/g, '=')}`
        : func.start.source,
    timeStamp: coverage.timeStamp,
    scriptId: coverage.scriptId,
  });

  return coverage.functions.map((func) => getCoverage(func));
};

const getProjectLink = (files) => {
  const file = files[0];
  return file?.map.sources[0];
};

const cleanCoverage = (coverages, files) => {
  const data = coverages
    .map((coverage) => {
      if (coverage.type === 'codeCoverage') {
        return cleanCodeCoverage(coverage, files);
      }
      return coverage;
    })
    .flat();
  const projectLink = getProjectLink(files);
  const filesContent = getFileContent(data, files);

  return { data, projectLink, filesContent };
};

const { coverages, files } = workerData;

const result = cleanCoverage(coverages, files);
parentPort.postMessage({
  result,
  command: 'finalCoverage',
});
