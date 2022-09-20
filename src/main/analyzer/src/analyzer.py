import subprocess
import glob
from concurrent.futures import ThreadPoolExecutor


def run_semgrep(rules, target, output_filename):
    process = subprocess.Popen(
        f'semgrep --config={rules} {target}', shell=True, stdout=subprocess.PIPE)
    output = process.stdout.read().strip()
    output = output.decode('UTF-8')
    # write to a json file
    with open(output_filename, 'w') as f:
        f.write(output)


def analyze():
    files = glob.glob('semgrep_rules/*.yml')
    with ThreadPoolExecutor(max_workers=len(files)) as executor:
        futures = [executor.submit(run_semgrep, ruleFile, "inputs/", f'outputs/runner_output_{i}.txt')
                   for i, ruleFile in enumerate(files)]


analyze()
