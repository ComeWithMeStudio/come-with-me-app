#!/usr/bin/env python3
"""Render approved CWM logo placement into 192px and 512px PWA icons.

Preserves the original cwm-logo.png artwork without redrawing.
Requires Pillow: python -m pip install Pillow
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "icons"
OUT.mkdir(exist_ok=True)

with Image.open(ROOT / "cwm-logo.png") as source:
    logo = source.convert("RGBA")
    # Matches the optically centered, user-approved 512x512 SVG preview:
    # x=-44, y=41, width=512, height=342.
    for size in (192, 512):
        scale = size / 512
        width, height = round(512 * scale), round(342 * scale)
        x, y = round(-44 * scale), round(41 * scale)
        fitted = logo.resize((width, height), Image.Resampling.LANCZOS)
        canvas = Image.new("RGBA", (size, size), "#f8f2ec")
        canvas.alpha_composite(fitted, (x, y))
        destination = OUT / f"icon-{size}.png"
        canvas.convert("RGB").save(destination, format="PNG", optimize=True)
        print(f"Created {destination.relative_to(ROOT)}")
