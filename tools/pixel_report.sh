#!/usr/bin/env bash
# Pixel quality journal: capture per-scenario duration and touch diagnostics.
set -uo pipefail
test_file="${2:-unknown}"
label="${test_file##*/}"
started=$SECONDS
log_file="$(mktemp)"
"$@" 2>&1 | tee "$log_file"
result=${PIPESTATUS[0]}
elapsed=$((SECONDS-started))
warnings=$(grep -c 'PIXEL_TOUCH_WARNING:' "$log_file" || true)
summary=${GITHUB_STEP_SUMMARY:-}
if [[ -n "$summary" ]]; then
  if [[ ! -f /tmp/pixel-summary-header ]]; then
    printf '%s\n' '## 🤖 Журнал Пікселя' '' '| Тест | Час | Результат | Повтори дотиків |' '|---|---:|---|---:|' >> "$summary"
    touch /tmp/pixel-summary-header
  fi
  if [[ "$result" -eq 0 ]]; then status="✅ Успішно"; else status="❌ Помилка"; fi
  printf '| `%s` | %d с | %s | %s |\n' "$label" "$elapsed" "$status" "$warnings" >> "$summary"
  if [[ "$warnings" -gt 0 ]]; then
    printf '\n<details><summary>Місця для ручної перевірки: %s</summary>\n\n```text\n' "$label" >> "$summary"
    grep 'PIXEL_TOUCH_WARNING:' "$log_file" >> "$summary" || true
    printf '```\n</details>\n' >> "$summary"
  fi
fi
echo "PIXEL_REPORT: scenario=$label seconds=$elapsed status=$result touch_retries=$warnings"
rm -f "$log_file"
exit "$result"
