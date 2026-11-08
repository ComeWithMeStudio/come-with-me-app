"""Regression checks for report privacy and scanner applicability; no real keys."""
import contextlib
import hashlib
import importlib.util
import io
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('observe', Path(__file__).with_name('observe.py'))
observe = importlib.util.module_from_spec(spec)
spec.loader.exec_module(observe)


class PrivacyTests(unittest.TestCase):
    def test_sarif_discards_all_source_and_messages(self):
        canary = 'synthetic-' + 'sensitive-value'
        with tempfile.TemporaryDirectory() as tmp:
            raw, safe = Path(tmp) / 'raw.json', Path(tmp) / 'safe.json'
            raw.write_text(json.dumps({'runs': [{'tool': {'driver': {'name': canary}},
                'artifacts': [{'contents': {'text': canary}}], 'results': [{
                    'ruleId': 'js/example', 'message': {'text': canary},
                    'codeFlows': [{'value': canary}], 'fixes': [{'description': canary}],
                    'locations': [{'physicalLocation': {'artifactLocation': {'uri': 'index.html'},
                        'region': {'startLine': 7, 'snippet': {'text': canary}}}}]}]}]}))
            observe.sanitize_sarif(raw, safe)
            self.assertNotIn(canary, safe.read_text())
            self.assertIn('index.html', safe.read_text())
            self.assertEqual(json.loads(safe.read_text())['runs'][0]['results'][0]['locations'][0]['physicalLocation']['region'], {'startLine': 7})

    def test_summary_encodes_untrusted_paths_and_stdout_is_counts_only(self):
        with tempfile.TemporaryDirectory() as tmp:
            summary = Path(tmp) / 'summary.md'
            out = io.StringIO()
            with patch.dict(os.environ, {'GITHUB_STEP_SUMMARY': str(summary), 'SECURITY_RESULT_DIR': tmp}), contextlib.redirect_stdout(out):
                observe.publish('test', 'findings', [observe.location('test', '<script>bad</script>.js', 2)])
            self.assertNotIn('<script>', summary.read_text())
            self.assertNotIn('bad', out.getvalue())
            self.assertIn('findings=1', out.getvalue())

    def test_npm_not_applicable_without_dependencies(self):
        with patch.object(observe, 'manifests', return_value=[]), patch.object(observe, 'publish') as publish:
            observe.scan('npm')
            self.assertEqual(publish.call_args.args[:2], ('npm', 'not-applicable'))

    def test_missing_scanner_is_not_clean(self):
        with patch.object(observe.shutil, 'which', return_value=None), patch.object(observe, 'publish') as publish:
            observe.scan('gitleaks')
            self.assertEqual(publish.call_args.args[:2], ('gitleaks', 'unavailable'))

    def test_paths_cannot_escape_repository(self):
        self.assertEqual(observe.safe_path('../secret'), '[outside-checkout]')
        self.assertEqual(observe.safe_path('/other/secret'), '[outside-checkout]')

    def test_inline_js_preserves_lines_and_skips_data_scripts(self):
        with tempfile.TemporaryDirectory() as tmp:
            source = Path(tmp) / 'page.html'
            source.write_text('<html>\n<script>\nconst value = location.hash;\nnode.innerHTML = value;\n</script>'
                              '<script type="application/ld+json">{}</script><script src="local.js"></script>')
            target = Path(tmp) / 'inline'
            target.mkdir()
            mapping = observe.inline_scripts([source], target)
            self.assertEqual(len(mapping), 1)
            script = Path(next(iter(mapping))).read_text().splitlines()
            self.assertEqual(script[2], 'const value = location.hash;')
            self.assertEqual(script[3], 'node.innerHTML = value;')

    def test_codeql_default_setup_is_not_duplicated(self):
        with patch.dict(os.environ, {'GITHUB_REPOSITORY': 'example/project'}), \
             patch.object(observe.urllib.request, 'urlopen', return_value=io.BytesIO(b'{"state":"configured"}')), \
             patch.object(observe, 'output') as output, patch.object(observe, 'publish') as publish:
            observe.codeql_preflight()
            output.assert_called_once_with('run', 'false')
            self.assertEqual(publish.call_args.args[:2], ('CodeQL', 'already-enabled'))

    @unittest.skipUnless(shutil.which('semgrep'), 'Semgrep is not installed')
    def test_rules_detect_dom_taint_inside_html(self):
        with tempfile.TemporaryDirectory() as tmp:
            source = Path(tmp) / 'unsafe.html'
            source.write_text('<script>\nconst input = location.hash;\ndocument.body.innerHTML = input;\n</script>')
            directory = Path(tmp) / 'js'
            directory.mkdir()
            observe.inline_scripts([source], directory)
            report = Path(tmp) / 'private.json'
            env = dict(os.environ, SEMGREP_SETTINGS_FILE=str(Path(tmp) / 'settings.yml'),
                       SEMGREP_LOG_FILE=str(Path(tmp) / 'private.log'))
            process = subprocess.run(['semgrep', 'scan', '--config', str(Path(__file__).with_name('semgrep.yml').resolve()),
                '--metrics', 'off', '--disable-version-check', '--json', '--output', str(report), str(directory)],
                env=env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=90)
            self.assertEqual(process.returncode, 0)
            data = json.loads(report.read_text())
            self.assertFalse(data.get('errors'))
            self.assertTrue(any(r['check_id'].endswith('browser-input-to-executable-or-html-sink') for r in data['results']))

    @unittest.skipUnless(shutil.which('gitleaks'), 'Gitleaks is not installed')
    def test_gitleaks_redacts_synthetic_credential(self):
        with tempfile.TemporaryDirectory() as tmp:
            canary = hashlib.sha256(b'local-only synthetic credential fixture').hexdigest()
            Path(tmp, 'fixture.txt').write_text('api_key = "' + canary + '"')
            report = Path(tmp) / 'private.json'
            process = subprocess.run(['gitleaks', 'dir', '--redact=100', '--no-banner', '--report-format', 'json',
                '--report-path', str(report), tmp], capture_output=True, text=True, timeout=30)
            self.assertEqual(process.returncode, 1)
            self.assertNotIn(canary, process.stdout + process.stderr + report.read_text())
            self.assertGreater(len(json.loads(report.read_text())), 0)


if __name__ == '__main__':
    unittest.main()
