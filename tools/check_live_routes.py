#!/usr/bin/env python3
"""Public endpoint smoke checks; no tracking, cookies, or user data."""
import os
import sys
from html.parser import HTMLParser
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin, urlsplit
from urllib.request import Request, urlopen

BASE = "https://app.comewithme.studio/"
MAX_LINKS = 80
failures = []
tested = []
class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []
    def handle_starttag(self, tag, attrs):
        if tag == "a":
            href = dict(attrs).get("href", "")
            if href and not href.startswith(("#", "mailto:", "javascript:")):
                url = urljoin(BASE, href)
                if urlsplit(url).netloc == urlsplit(BASE).netloc and url not in self.links:
                    self.links.append(url)

def get(url, read_body=False):
    request = Request(url, headers={"User-Agent": "CWM-Game-HealthCheck/1.0", "Cache-Control": "no-cache"})
    try:
        with urlopen(request, timeout=20) as response:
            status = response.status
            content = response.read(2_000_000) if read_body else b""
            tested.append((url, status))
            if status >= 400:
                failures.append(f"HTTP {status}: {url}")
            return content
    except (HTTPError, URLError, TimeoutError, OSError) as exc:
        failures.append(f"Unavailable: {url} ({exc})")
        return b""

html = get(BASE, True)
if html:
    parser = Links()
    parser.feed(html.decode("utf-8", errors="replace"))
    for url in parser.links[:MAX_LINKS]:
        get(url)
lines = ["# Live application smoke test", "",
         f"- Site: {BASE}",
         f"- Public pages checked: **{len(tested)}**",
         f"- Failures: **{len(failures)}**", ""]
if failures:
    lines += ["## Unavailable pages"] + ["- " + x for x in failures]
else:
    lines += ["All checked public pages responded successfully."]
lines += ["", "This checks public HTTP responses only. It does not simulate game completion or collect visitor information."]
report = "\n".join(lines) + "\n"
print(report)
if os.environ.get("GITHUB_STEP_SUMMARY"):
    with open(os.environ["GITHUB_STEP_SUMMARY"], "a", encoding="utf-8") as f:
        f.write(report)
sys.exit(bool(failures))
