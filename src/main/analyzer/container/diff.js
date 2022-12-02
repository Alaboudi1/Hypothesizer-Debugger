// read two json file and return the diff

const fs = require('fs');
const path = require('path');

const readJson = (file) => {
  const json = fs.readFileSync(path.resolve(__dirname, 'diff', file), 'utf8');
  return JSON.parse(json);
};

const diff = (file1, file2) => {
  const json1 = readJson(file1);
  const json2 = readJson(file2);

  const diffs = json1.filter((item) => {
    return !json2.find((item2) => {
      if (item2.functionName !== undefined && item.functionName !== undefined) {
        return item2.functionName === item.functionName;
      }
      if (item2.jsx !== undefined && item.jsx !== undefined) {
        return (
          item2.jsx.fileName === item.jsx.fileName &&
          item2.jsx.lineNumber === item.jsx.lineNumber
        );
      }
    });
  });
  return diffs;
};

// write the diff to a file
const writeDiff = (diff, file) => {
  fs.writeFileSync(path.resolve(__dirname, 'diff', file), JSON.stringify(diff));
};

writeDiff(diff('correct.json', 'incorrect.json'), 'correctUnique.json');

writeDiff(diff('incorrect.json', 'correct.json'), 'incorrectUnique.json');
