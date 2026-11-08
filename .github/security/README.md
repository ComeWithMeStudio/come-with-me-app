# Security observation — stage 1

This directory configures observation only. It does not deploy, change branch
protection, publish media, or contact Supabase/Cloudflare. Application files are
not changed. Do not make these checks required until findings and scanner
availability have been reviewed.

`security-observe.yml` runs on PRs targeting `main`, pushes to `main`, and manual
dispatch. It is independent of all existing workflows. Jobs use
`continue-on-error: true`; scanner wrappers also distinguish findings,
incomplete scans, unavailable tools and clean scans without failing deployment.

## Tools, cost and applicability

| Tool | Configuration | Cost/account |
|---|---|---|
| Gitleaks CLI 8.30.1 | Git history (`--all`) and current files; built-in rules; full redaction | OSS CLI; no organization Action license, cloud account or key |
| Semgrep CE 1.184.0 | Checked-in rules; JS/TS, HTML, Python and workflow patterns; inline HTML scripts explicitly extracted to private temporary JS files | No Semgrep account, paid engine, remote rule registry, metrics or source upload |
| CodeQL Action v4 | JS/TS; Python in the app repository only; `security-extended`; `build-mode: none` | Public GitHub repositories are eligible without Code Security purchase; normal Actions quotas/limits still apply |
| npm audit | Only tracked package manifests declaring dependencies; existing npm locks; no install or scripts | No npm project dependencies currently declared, so not applicable |

Both repositories showed a **Public** GitHub badge on 2026-11-09. The API is
blocked in the current development environment, so organization billing,
CodeQL default setup, required checks and hosted-run results were not read.
The CodeQL job checks the default-setup API at runtime: if it is already
configured, this workflow does not duplicate it. Unknown/forbidden responses
produce an unavailable status, never a clean result. Private repositories are
skipped unless an owner verifies Code Security entitlement and sets repository
variable `CWM_PRIVATE_CODEQL_ENABLED=true`; setting a variable does not grant a
license. If CodeQL is unavailable, keep Gitleaks and Semgrep CE running and
review their results; do not present them as a completed CodeQL scan.

GitHub's availability contract:
https://docs.github.com/en/code-security/code-scanning/introduction-to-code-scanning/about-code-scanning
and the checked official source:
https://github.com/github/docs/blob/main/data/reusables/gated-features/code-scanning.md

The app's existing game-health workflow installs Playwright transiently. There
is no tracked npm manifest/lock for that tooling; it is not a reproducible npm
audit target. This change does not add a production npm project or modify that
workflow. Future manifests without npm locks are reported as incomplete, not
silently installed or declared safe. Non-npm lock formats require their own
manager audit in a later task.

## Permissions and untrusted changes

- Ordinary scanners have only `contents: read`. Checkout credentials are not
  persisted. No Supabase, R2 or organization secrets are passed to scanners.
- CodeQL alone gets `contents: read`, `actions: read` (needed for private run
  metadata), and `security-events: read` for availability checks. There are no write permissions.
- There is no `pull_request_target`, application build, cloud write, or change
  to deployment dependencies. No PR or main run uploads Code scanning alerts in stage 1.
- Third-party Actions are pinned to full commit SHAs. The Gitleaks release
  archive has a pinned SHA-256 checked before execution. Semgrep is installed
  into a runner-local virtual environment, not application dependencies.

## Report privacy

Raw scanner output lives only in mode-0700 temporary directories and is deleted
after extraction of rule identifiers, relative paths and line numbers. Console
output contains status and counts only. Bounded GitHub summaries contain HTML-
escaped location metadata, not source lines or credential matches. No raw
scanner report/log is uploaded as an artifact.

CodeQL analysis uses `upload: never`, `upload-database: false`,
`add-snippets: false`, no TRAP/dependency cache and no Python dependency setup.
An allowlisted SARIF representation supplies summary metadata only: rule IDs,
generic messages and file/line locations. Neither raw nor sanitized SARIF or
databases are uploaded to Code scanning in stage 1: organization rulesets could
enforce new alerts despite continue-on-error. Artifact contents, source snippets,
flows, fixes and original messages are removed; temporary directories are cleaned
even on failure. Enabling Security-tab upload/enforcement is a separate reviewed
change after checking organization rulesets. Test fixtures verify redaction with synthetic values, not real keys.

If a real key is found, keep its value out of PRs/issues/logs. Record only its
location; have the owner revoke/rotate it, inspect access logs, and review
history cleanup separately. Deleting a string or passing a scanner does not
revoke a key.

## Local verification

Install scanners outside the checkout. With their binaries on `PATH`, run from
the repository root:

```sh
python3 .github/security/observe.py gitleaks
python3 .github/security/observe.py semgrep
python3 .github/security/observe.py npm
python3 -m unittest discover -s .github/security -p 'test_*.py'
```

Set `SECURITY_RESULT_DIR` to a directory outside the checkout to retain sanitized
JSON. Without installed binaries the two scanner integration tests explicitly
skip and scans report unavailable; that is not full validation. Inspect all
statuses and the test counts. Actionlint can validate the workflow separately.

Semgrep CE rules are a focused baseline, not every commercial rule or
cross-file analysis. Findings about browser storage or preview switches require
triage; language preferences and consent storage alone are not vulnerabilities.
Gitleaks retains its default file/binary exclusions; neither tool audits media
content, cloud policies, live credentials or production headers. CodeQL execution
still needs validation in GitHub Actions after the branch is reviewed and a PR
is opened. No existing source vulnerability was fixed in this setup stage.
