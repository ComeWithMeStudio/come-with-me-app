#!/usr/bin/env python3
"""Generate square PWA icons without distorting the existing CWM logo.

Requires: python -m pip install Pillow
Run from the repository root: python scripts/build_pwa_icons.py
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
source = ROOT / "cwm-logo.png"
output = ROOT / "icons"
output.mkdir(exist_ok=True)

with Image.open(source) as original:
    logo = original.convert("RGBA")
    for size in (192, 512):
        canvas = Image.new("RGBA", (size, size), "#f8f2ec")
        max_width, max_height = int(size * 0.88), int(size * 0.76)
        fitted = logo.copy()
        fitted.thumbnail((max_width, max_height), Image.Resampling.LANCZOS)
        x = (size - fitted.width) // 2
        y = (size - fitted.height) // 2
        canvas.alpha_composite(fitted, (x, y))
        canvas.convert("RGB").save(output / f"icon-{size}.png", optimize=True)
        print(f"Generated icons/icon-{size}.png")
