// a function that check if python is installed
import { exec } from 'child_process';

const checkPaythonIsInstalled = async () => {
  return new Promise((resolve, reject) => {
    exec('python3', (err) => {
      if (err) {
        reject(err);
      }
      resolve(true);
    });
  });
};

const installSemgrep = async () => {
  const isSemgrepInstalled = await checkSemgrep();
  if (!isSemgrepInstalled) {
    return new Promise((resolve, reject) => {
      exec('python3 -m pip install semgrep', (err) => {
        if (err) {
          reject(err);
        }
        resolve(true);
      });
    });
  }
  return true;
};
const checkSemgrep = async () => {
  return new Promise((resolve) => {
    exec('semgrep --help', (err) => {
      if (err) {
        resolve(false);
      }
      resolve(true);
    });
  });
};

export default {
  checkPaythonIsInstalled,
  installSemgrep,
};
