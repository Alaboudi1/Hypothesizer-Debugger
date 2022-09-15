import subprocess
import glob
from concurrent.futures import ThreadPoolExecutor


def run_semgrep(rules, target, output_filename):
    process = subprocess.Popen(
        f'semgrep --config={rules} {target}', shell=True, stdout=subprocess.PIPE)
    output = process.stdout.read().strip()
    output = output.decode('UTF-8')
    with open(output_filename, 'a') as f:
        print(f'Semgrep Report for {target}\n', file=f)
        print(output, file=f)
        print(f'\n\n', file=f)


def analyze():
    files = glob.glob('semgrep_rules/*.yml')
    with ThreadPoolExecutor(max_workers=len(files)) as executor:
        futures = [executor.submit(run_semgrep, ruleFile, "inputs/", f'outputs/runner_output_{i}.txt')
                   for i, ruleFile in enumerate(files)]


analyze()
