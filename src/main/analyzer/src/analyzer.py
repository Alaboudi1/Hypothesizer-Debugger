import glob
from concurrent.futures import ThreadPoolExecutor
import os


def run_semgrep(rules, target, output_filename):
    print(output_filename)
    os.system(
        f'semgrep --config={rules} {target} --max-chars-per-line 100000 --max-lines-per-finding 0 --json --output {output_filename} --timeout 120')


def get_targets(path, type):
    # get the file name without the extension
    outputFolder = path.split('/')[1].split('.')[0]
    # get the first part of the file name before the underscore
    inputFolder = outputFolder.split('_')[0]
    # remove duplicates
    if type == 'input':
        return inputFolder
    else:
        return outputFolder


def analyze():
    files = glob.glob('semgrep_rules/*.yml')
    with ThreadPoolExecutor(max_workers=4) as executor:
        futures = [executor.submit(run_semgrep, ruleFile, f'inputs/{get_targets(ruleFile,"input")}/', f'outputs/{get_targets(ruleFile,"output")}.json')
                   for i, ruleFile in enumerate(files)]


analyze()
