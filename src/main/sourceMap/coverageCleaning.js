const { parentPort, workerData } = require('worker_threads');

const getFileContent = (coverages, files) => {
  const filesContent = [];
  coverages.forEach((coverage) => {
    if (coverage.type === 'codeCoverage') {
      const filePath = coverage.file;
      if (filePath.includes('node_modules') || filePath.includes('webpack'))
        return;
      if (filesContent.findIndex((f) => f.file === filePath) === -1) {
        const file = files.find((f) => f.scriptId === coverage.scriptId);
        const orginalFileIndex = file.map.sources.indexOf(filePath);
        const originalFile = file.map.sourcesContent[orginalFileIndex];
        filesContent.push({
          file: filePath,
          content: originalFile,
        });
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
    file: func.start.source,
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
