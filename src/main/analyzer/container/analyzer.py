import glob
from concurrent.futures import ThreadPoolExecutor
import os


def run_semgrep(rules, target, output_filename):
    print(output_filename)
    os.system(
        f'semgrep --config={rules} {target} --max-chars-per-line 100000 --max-lines-per-finding 0 --json --output {output_filename} --timeout 120')


def get_targets(path, type):
    target = path.split('/')[-1].split('_')[0]
    rule = path.split('/')[-1].split('.')[0]
    # get the file name without the extension
    outputFolder = path.split('semgrep_rules')[0] + 'outputs/' + rule
    # get the first part of the file name before the underscore
    inputFolder = path.split('semgrep_rules')[0] + 'inputs/'+target+'/'
    # remove duplicates
    if type == 'input':
        return inputFolder
    else:
        return outputFolder


def analyze():
    # get the director path
    path = os.path.dirname(os.path.realpath(__file__)) + '/'
    print(path)

    # get the list of all the files in the directory
    ruleFiles = glob.glob(
        path + 'semgrep_rules/*')

    with ThreadPoolExecutor(max_workers=4) as executor:
        [executor.submit(run_semgrep, ruleFile, f'{get_targets(ruleFile,"input")}', f'{get_targets(ruleFile,"output")}.json')
         for i, ruleFile in enumerate(ruleFiles)]


analyze()
