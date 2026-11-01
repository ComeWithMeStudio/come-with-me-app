#!/usr/bin/env python3
"""Check local assets referenced by HTML pages; never collect visitor data."""
import os
import sys
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote

ROOT = Path(__file__).resolve().parents[1]
issues = []
checked = 0
pages = 0

def verify(page, value, label):
    global checked
    value = (value or "").strip()
    if not value or value.startswith(("#", "//", "data:", "blob:", "mailto:", "javascript:")):
        return
    if any(x in value for x in ("{", "}", "<%", ">", "*")):
        return
    parsed = urlsplit(value)
    if parsed.scheme or parsed.netloc or not parsed.path:
        return
    path = unquote(parsed.path)
    target = (ROOT / path.lstrip("/")) if path.startswith("/") else (page.parent / path)
    try:
        target = target.resolve()
        target.relative_to(ROOT.resolve())
    except ValueError:
        issues.append(f"Outside repository: {page.relative_to(ROOT)} -> {value}")
        return
    checked += 1
    if not target.exists():
        issues.append(f"Missing {label}: {page.relative_to(ROOT)} -> {value}")

class Inspector(HTMLParser):
    def __init__(self, page):
        super().__init__()
        self.page = page
    def handle_starttag(self, tag, attributes):
        a = dict(attributes)
        if tag in ("img", "audio", "video", "source", "script", "iframe", "track"):
            for key in ("src", "poster", "data-src"):
                if a.get(key):
                    verify(self.page, a[key], tag + "." + key)
        if tag == "link" and a.get("href") and set(a.get("rel", "").split()) & {"stylesheet", "icon", "preload", "modulepreload", "manifest"}:
            verify(self.page, a["href"], "link.href")

for page in ROOT.rglob("*.html"):
    if any(part in (".git", "node_modules", "dist", "build", ".venv") for part in page.relative_to(ROOT).parts):
        continue
    pages += 1
    try:
        Inspector(page).feed(page.read_text(encoding="utf-8"))
    except (OSError, UnicodeError, ValueError) as exc:
        issues.append(f"Cannot read {page.relative_to(ROOT)}: {exc}")

if not pages:
    issues.append("No HTML pages found")
lines = ["# Come With Me Studio — asset check", "",
         f"HTML pages: **{pages}**",
         f"Local asset references checked: **{checked}**",
         f"Problems: **{len(issues)}**", ""]
if issues:
    lines += ["## Missing or invalid references"] + ["- " + item for item in issues[:150]]
    if len(issues) > 150:
        lines.append(f"- ...and {len(issues)-150} more")
else:
    lines.append("No missing static references found.")
lines += ["", "This is a repository file check, not a gameplay test. No user or child data is collected."]
report = "\n".join(lines) + "\n"
print(report)
if os.environ.get("GITHUB_STEP_SUMMARY"):
    with open(os.environ["GITHUB_STEP_SUMMARY"], "a", encoding="utf-8") as f:
        f.write(report)
sys.exit(1 if issues else 0)
