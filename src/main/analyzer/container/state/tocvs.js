const fs = require('fs');
const path = require('path');
// Load the JSON file
fs.readFile('state2.json', (err, data) => {
  if (err) throw err;

  // Parse the JSON data
  let jsonData = JSON.parse(data);

  // read the prject and calculate the number of files, line of code inside the src folder

  jsonData = jsonData.map((item) => {
    let projectLineNumbers = 0;
    let projectNumberOfFiles = 0;

    // Define the directory to read
    const directoryPath = `${item.projecturl}/src`;

    // Recursive function to read files in the directory
    const readDirectory = (dirPath) => {
      const files = fs.readdirSync(dirPath);

      files.forEach((file) => {
        // Construct the full path to the file
        const filePath = path.join(dirPath, file);
        console.log(file);
        const stats = fs.statSync(filePath);

        if (stats.isFile()) {
          projectNumberOfFiles++;
          const data = fs.readFileSync(filePath);

          projectLineNumbers += data.toString().split('\n').length;
        } else if (stats.isDirectory()) {
          // Call the function recursively if it's a directory
          readDirectory(filePath);
        }
      });
    };

    // Call the function to start reading files
    readDirectory(directoryPath);

    // Call the function to start reading files

    // Log the total line numbers and number of files after all files have been processed

    return {
      ProjectName: item.projecturl.split('caseStudyHypothesizer')[1],

      NumberOfFilesAnalyized: item.filesNumber,
      LineOfCodeAnalyized: item.lineOfCode,
      Events: item.eventsNumber,
      Trace: item.coveragesNumber,
      TotalLineOfCode: projectLineNumbers,
      TotalNumberOfFiles: projectNumberOfFiles,
      PrecentageOfLinesAnalyized: `${Math.round(
        (item.lineOfCode / projectLineNumbers) * 100
      )}%`,
      PrecentageOfFilesAnalyized: `${Math.round(
        (item.filesNumber / projectNumberOfFiles) * 100
      )}%`,
      MostLikelyHypothesis: item.hypothesesScore.filter(
        (hypothesis) => hypothesis.score === 1
      ).length,
      LessLikelyHypothesis: item.hypothesesScore.filter(
        (hypothesis) => hypothesis.score > 0.5 && hypothesis.score < 1
      ).length,
      totalAnalysisTime: `${item.totalAnalysisTime} s`,
      recordingTime: `${item.recordingTime} s`,
    };
  });

  // Write the CSV file
  let csv =
    'ProjectName,NumberOfFilesAnalyized,LineOfCodeAnalyized,Events,Trace,TotalLineOfCode,TotalNumberOfFiles,PrecentageOfLinesAnalyized,PrecentageOfFilesAnalyized,MostLikelyHypothesis,LessLikelyHypothesis,totalAnalysisTime,recordingTime\n';
  jsonData.forEach((row) => {
    csv += `${Object.values(row).join(',')}\n`;
  });
  fs.writeFile('data2.csv', csv, (err) => {
    if (err) throw err;
    console.log('Data written to CSV file');
  });
});
