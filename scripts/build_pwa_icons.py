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
    # Preserve original artwork aspect ratio (1756x1034), no horizontal squeeze.
    # Keep the approved horizontal position and vertical optical center.
    for size in (192, 512):
        scale = size / 512
        width = round(512 * scale)
        height = round(width * logo.height / logo.width)
        x = round(-44 * scale)
        y = round((512 - height / scale) / 2 * scale)
        fitted = logo.resize((width, height), Image.Resampling.LANCZOS)
        canvas = Image.new("RGBA", (size, size), "#f8f2ec")
        canvas.alpha_composite(fitted, (x, y))
        destination = OUT / f"icon-{size}.png"
        canvas.convert("RGB").save(destination, format="PNG", optimize=True)
        print(f"Created {destination.relative_to(ROOT)}")
