#!/usr/bin/env bash
set -euo pipefail
# OSS CLI: no Gitleaks Action organization license or account is required.
version=8.30.1
expected=551f6fc83ea457d62a0d98237cbad105af8d557003051f41f3e7ca7b3f2470eb
destination="${RUNNER_TEMP:?}/cwm-gitleaks"
mkdir -p "$destination"
archive="$destination/gitleaks.tar.gz"
curl --fail --silent --show-error --location --retry 2 \
  "https://github.com/gitleaks/gitleaks/releases/download/v${version}/gitleaks_${version}_linux_x64.tar.gz" \
  --output "$archive"
printf '%s  %s\n' "$expected" "$archive" | sha256sum --check --status
tar -xzf "$archive" -C "$destination" gitleaks
chmod 755 "$destination/gitleaks"
printf '%s\n' "$destination" >> "${GITHUB_PATH:?}"
