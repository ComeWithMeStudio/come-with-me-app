#!/usr/bin/env python3
"""Static PWA preflight: run from any directory, no third-party dependencies."""
import json
import re
import struct
from pathlib import Path

root = Path(__file__).resolve().parents[1]
manifest = json.loads((root / "manifest.webmanifest").read_text(encoding="utf-8"))
html = (root / "index.html").read_text(encoding="utf-8")
worker = (root / "service-worker.js").read_text(encoding="utf-8")

assert manifest["display"] == "standalone", "PWA must use standalone display"
assert manifest["start_url"] == "/", "Unexpected start URL"
assert manifest["scope"] == "/", "Unexpected scope"
assert re.search(r'<link[^>]+rel=["\']manifest["\'][^>]+href=["\']/manifest.webmanifest["\']', html), "Manifest link missing"
assert 'navigator.serviceWorker.register("/service-worker.js")' in html, "Service worker registration missing"
assert "caches.open" not in worker and "cache.addAll" not in worker, "Unexpected offline caching"

for icon in manifest["icons"]:
    path = root / icon["src"].lstrip("/")
    assert path.is_file(), f"Icon missing: {path}"
    with path.open("rb") as f:
        header = f.read(24)
    assert header[:8] == b"\x89PNG\r\n\x1a\n", f"Not a PNG: {path}"
    width, height = struct.unpack(">II", header[16:24])
    declared = icon["sizes"]
    assert declared == f"{width}x{height}", f"Dimension mismatch for {path}"
    assert width == height, f"Icon not square: {path}"
    print(f"OK: {path.name} ({width}x{height})")

print("PASS: manifest, homepage, icons and network-only worker")
