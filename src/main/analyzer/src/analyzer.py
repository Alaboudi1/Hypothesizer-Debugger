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
    # get the file name without the extension
    targets = [f.split('/')[-1].split('.')[0] for f in files]
    with ThreadPoolExecutor(max_workers=4) as executor:
        futures = [executor.submit(run_semgrep, ruleFile, f'inputs/{targets[i]}/', f'outputs/{targets[i]}.txt')
                   for i, ruleFile in enumerate(files)]


analyze()
