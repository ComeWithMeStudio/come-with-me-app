#!/usr/bin/env python3
"""Observation-only scans. Never print scanner logs, source lines or secret values."""
import argparse
import html
from html.parser import HTMLParser
import json
import os
from pathlib import Path, PurePosixPath
import re
import shutil
import subprocess
import tempfile
import urllib.error
import urllib.request


def safe_path(value):
    value = str(value).replace('\\', '/')
    if value.startswith(str(Path.cwd()) + '/'):
        value = value[len(str(Path.cwd())) + 1:]
    p = PurePosixPath(value)
    return str(p) if not p.is_absolute() and '..' not in p.parts else '[outside-checkout]'


def rule_id(value):
    return re.sub(r'[^A-Za-z0-9_./:-]', '_', str(value))[:180]


def location(rule, path, line):
    return {'rule': rule_id(rule), 'path': safe_path(path), 'line': max(1, int(line or 1))}


def publish(tool, state, entries=(), detail=''):
    result = {'tool': tool, 'state': state, 'findings': len(entries), 'locations': list(entries)}
    lines = [f'### {tool}: {state}', '', f'Findings: {len(entries)}. {detail}', '']
    for entry in list(entries)[:100]:
        # Encode metadata as HTML text so PR-controlled paths cannot inject Markdown/commands.
        text = f"{entry['rule']} — {entry['path']}:{entry['line']}"
        lines.append('<code>' + html.escape(text) + '</code><br>')
    if len(entries) > 100:
        lines.append('Additional locations omitted from this bounded summary.')
    text = '\n'.join(lines) + '\n'
    summary = os.getenv('GITHUB_STEP_SUMMARY')
    if summary:
        with open(summary, 'a', encoding='utf-8') as stream:
            stream.write(text)
    # Standard output deliberately contains counts/status only, never location text or raw output.
    print(f'{tool}: {state}; findings={len(entries)}')
    destination = os.getenv('SECURITY_RESULT_DIR')
    if destination:
        target = Path(destination)
        target.mkdir(parents=True, exist_ok=True)
        (target / (tool.lower() + '.json')).write_text(json.dumps(result, indent=2), encoding='utf-8')


def execute(command, directory, report):
    try:
        with (directory / 'private.log').open('ab') as log:
            process = subprocess.run(command, stdout=log, stderr=subprocess.STDOUT, timeout=600)
        data = json.loads(report.read_text()) if report.exists() else None
        return process.returncode, data
    except (OSError, ValueError, subprocess.TimeoutExpired):
        return None, None


def manifests():
    names = subprocess.check_output(['git', 'ls-files', '-z'], text=True).split('\0')
    found = []
    for name in names:
        if PurePosixPath(name).name != 'package.json':
            continue
        data = json.loads(Path(name).read_text())
        if any(data.get(key) for key in ('dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies')):
            found.append(Path(name).parent)
    return found


def inline_scripts(files, directory):
    """Give CE real JS inputs for inline HTML; preserve original source line numbers."""
    mapping = {}

    class Scripts(HTMLParser):
        def __init__(self, source):
            super().__init__(convert_charrefs=False)
            self.source, self.parts, self.capture = source, [], False

        def handle_starttag(self, tag, attrs):
            if tag == 'script':
                attrs = dict(attrs)
                self.capture = not attrs.get('src') and attrs.get('type', '').lower() in (
                    '', 'module', 'text/javascript', 'application/javascript')
                self.parts = []

        def handle_data(self, data):
            if self.capture:
                self.parts.append((self.getpos(), data))

        def handle_endtag(self, tag):
            if tag == 'script' and self.capture:
                if self.parts and any(data.strip() for _, data in self.parts):
                    (line, column), first = self.parts[0]
                    code = '\n' * (line - 1) + ' ' * column + first + ''.join(data for _, data in self.parts[1:])
                    target = directory / f'inline-{len(mapping)}.js'
                    target.write_text(code, encoding='utf-8')
                    mapping[str(target.resolve())] = str(self.source)
                self.capture = False

    for source in files:
        parser = Scripts(source)
        parser.feed(Path(source).read_text(encoding='utf-8'))
        parser.close()
    return mapping


def scan(tool):
    os.umask(0o077)
    if tool == 'npm' and not manifests():
        publish('npm', 'not-applicable', detail='No tracked npm dependency manifests; no dependencies installed.')
        return
    executable = shutil.which(tool)
    if not executable:
        publish(tool, 'unavailable', detail='Scanner executable is not installed; this is not a clean result.')
        return
    with tempfile.TemporaryDirectory(prefix='cwm-security-') as temp:
        directory = Path(temp)
        report = directory / 'private.json'
        if tool == 'gitleaks':
            entries, valid = [], True
            for mode in ('git', 'dir'):
                report.unlink(missing_ok=True)
                command = [executable, mode, '--redact=100', '--no-banner', '--no-color', '--log-level', 'error',
                           '--ignore-gitleaks-allow', '--report-format', 'json', '--report-path', str(report)]
                if mode == 'git':
                    command.append('--log-opts=--all')
                code, data = execute(command + ['.'], directory, report)
                valid = valid and code in (0, 1) and isinstance(data, list)
                for item in data if isinstance(data, list) else []:
                    entries.append(location(item['RuleID'], item['File'], item['StartLine']))
            publish(tool, 'findings' if valid and entries else 'clean' if valid else 'incomplete', entries,
                    'History and current files scanned; raw results/logs are deleted, not uploaded.')
        elif tool == 'semgrep':
            os.environ.setdefault('SEMGREP_SETTINGS_FILE', str(directory / 'settings.yml'))
            os.environ.setdefault('SEMGREP_LOG_FILE', str(directory / 'semgrep.log'))
            command = [executable, 'scan', '--config', '.github/security/semgrep.yml', '--metrics', 'off',
                       '--disable-version-check', '--error', '--json', '--output', str(report),
                       '--exclude', '.github/security', '--exclude', 'docs/security',
                       '--max-target-bytes', '2000000', '.']
            sources = subprocess.check_output(['git', 'ls-files', '-z'], text=True).split('\0')
            inline = directory / 'inline'
            inline.mkdir()
            mapping = inline_scripts([name for name in sources if name.endswith('.html')], inline)
            entries, valid = [], True
            for target in ['.'] + ([str(inline)] if mapping else []):
                report.unlink(missing_ok=True)
                code, data = execute(command[:-1] + [target], directory, report)
                valid = valid and code in (0, 1) and isinstance(data, dict) and not data.get('errors') and bool(data.get('paths', {}).get('scanned'))
                for item in (data or {}).get('results', []):
                    path = mapping.get(str(Path(item['path']).resolve()), item['path'])
                    entries.append(location(item['check_id'], path, item['start']['line']))
            entries = list({(e['rule'], e['path'], e['line']): e for e in entries}.values())
            publish(tool, 'findings' if valid and entries else 'clean' if valid else 'incomplete', entries,
                    'Local rules and explicit inline-HTML JS extraction; metrics/version checks disabled; no cloud upload.')
        elif tool == 'npm':
            entries, valid = [], True
            for folder in manifests():
                if not any((folder / lock).is_file() for lock in ('package-lock.json', 'npm-shrinkwrap.json')):
                    valid = False
                    continue
                report.unlink(missing_ok=True)
                # Audit existing locks only: never npm install, lifecycle scripts or lockfile rewrites.
                command = [executable, '--prefix', str(folder), 'audit', '--ignore-scripts', '--json']
                try:
                    with report.open('w') as output, (directory / 'private.log').open('ab') as log:
                        process = subprocess.run(command, stdout=output, stderr=log, timeout=180)
                    data = json.loads(report.read_text())
                    counts = data.get('metadata', {}).get('vulnerabilities')
                    valid = valid and process.returncode in (0, 1) and bool(counts) and not data.get('error')
                    for severity in ('critical', 'high', 'moderate', 'low', 'info'):
                        for _ in range(min(int((counts or {}).get(severity, 0)), 10000)):
                            entries.append(location('dependency-' + severity, str(folder / 'package.json'), 1))
                except (OSError, ValueError, subprocess.TimeoutExpired):
                    valid = False
            publish(tool, 'findings' if valid and entries else 'clean' if valid else 'incomplete', entries,
                    'Missing locks or registry errors are incomplete, not a passing audit; no raw package data uploaded.')


def output(name, value):
    target = os.getenv('GITHUB_OUTPUT')
    if target:
        with open(target, 'a', encoding='utf-8') as stream:
            stream.write(f'{name}={value}\n')


def codeql_preflight():
    output('run', 'false')
    repository = os.environ['GITHUB_REPOSITORY']
    if not re.fullmatch(r'[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+', repository):
        raise ValueError('Invalid repository identifier')
    token = os.getenv('GH_TOKEN', '')
    url = f'https://api.github.com/repos/{repository}/code-scanning/default-setup'
    request = urllib.request.Request(url, headers={'Authorization': 'Bearer ' + token,
                                                  'Accept': 'application/vnd.github+json',
                                                  'X-GitHub-Api-Version': '2022-11-28'})
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            state = json.load(response).get('state')
        if state == 'configured':
            publish('CodeQL', 'already-enabled', detail='GitHub default setup exists; do not run duplicate advanced analysis.')
            return
        if state != 'not-configured':
            publish('CodeQL', 'unavailable', detail='Unknown default-setup state; check repository settings.')
            return
    except urllib.error.HTTPError as error:
        if error.code != 404:
            publish('CodeQL', 'unavailable', detail=f'Availability check HTTP {error.code}; check Code scanning settings and token permissions.')
            return
    except (OSError, ValueError):
        publish('CodeQL', 'unavailable', detail='Availability check failed; no scan was claimed.')
        return
    output('run', 'true')


def sanitize_sarif(source, destination):
    """Allowlist metadata; discard messages, snippets, flows, fixes and artifact contents."""
    if Path(source).is_dir():
        reports = list(Path(source).glob('*.sarif'))
        if not reports:
            raise ValueError('No CodeQL SARIF results were produced')
        for report in reports:
            sanitize_sarif(report, Path(destination) / report.name)
        return
    data = json.loads(Path(source).read_text())
    runs = []
    for run in data.get('runs', []):
        results = []
        ids = set()
        for result in run.get('results', []):
            identifier = rule_id(result.get('ruleId', 'security-review'))
            ids.add(identifier)
            locations = []
            for loc in result.get('locations', []):
                physical = loc.get('physicalLocation', {})
                path = safe_path(physical.get('artifactLocation', {}).get('uri', 'unknown'))
                line = max(1, int(physical.get('region', {}).get('startLine', 1)))
                locations.append({'physicalLocation': {'artifactLocation': {'uri': path}, 'region': {'startLine': line}}})
            results.append({'ruleId': identifier, 'level': result.get('level') if result.get('level') in ('error', 'warning', 'note') else 'warning',
                            'message': {'text': 'Security finding; review the referenced repository location.'}, 'locations': locations})
        runs.append({'tool': {'driver': {'name': 'CodeQL', 'rules': [{'id': identifier} for identifier in sorted(ids)]}}, 'results': results})
    Path(destination).parent.mkdir(parents=True, exist_ok=True)
    Path(destination).write_text(json.dumps({'version': '2.1.0', '$schema': 'https://json.schemastore.org/sarif-2.1.0.json', 'runs': runs}))


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('command', choices=['gitleaks', 'semgrep', 'npm', 'inventory', 'codeql-preflight', 'sanitize-sarif'])
    parser.add_argument('paths', nargs='*')
    args = parser.parse_args()
    if args.command == 'inventory':
        output('npm', str(bool(manifests())).lower())
    elif args.command == 'codeql-preflight':
        codeql_preflight()
    elif args.command == 'sanitize-sarif':
        sanitize_sarif(*args.paths)
        destination = Path(args.paths[1])
        reports = destination.glob('*.sarif') if destination.is_dir() else [destination]
        entries = []
        for report in reports:
            for run in json.loads(report.read_text()).get('runs', []):
                for result in run.get('results', []):
                    for loc in result.get('locations', []):
                        physical = loc['physicalLocation']
                        entries.append(location(result['ruleId'], physical['artifactLocation']['uri'], physical['region']['startLine']))
        publish('CodeQL', 'findings' if entries else 'clean', entries, 'Only sanitized location metadata is retained.')
    else:
        scan(args.command)
