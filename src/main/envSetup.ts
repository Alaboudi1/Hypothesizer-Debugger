// a function that check if python is installed
import { execSync } from 'child_process';

const checkPaythonIsInstalled = () => {
  try {
    execSync('python3 -V');
    return true;
  } catch (error) {
    return false;
  }
};

const checkSemgrep = () => {
  try {
    execSync('semgrep --help');
    return true;
  } catch (error) {
    return false;
  }
};

const installSemgrep = () => {
  const isSemgrepInstalled = checkSemgrep();
  if (!isSemgrepInstalled) {
    execSync('python3 -m pip install semgrep');
  }
};

export default {
  checkPaythonIsInstalled,
  installSemgrep,
};
