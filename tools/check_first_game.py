#!/usr/bin/env python3
"""Pixel's first-game structural regression test. Does not bypass game access."""
from pathlib import Path
import re
import sys

root = Path(__file__).resolve().parents[1]
game = root / "media/pograymo/figury/ihry/geometry-games.html"
catalog = root / "media/pograymo/figury/ihry/geometry-games-catalog.html"
errors = []
if not game.is_file():
    errors.append("First game file is missing")
else:
    content = game.read_text(encoding="utf-8")
    required = {
        "game title": "<title>Майстерня фігур",
        "level definitions": "const levels=[",
        "piece selection": "function choose(piece)",
        "placement validation": "function placeSelected(slot)",
        "level completion": "function complete()",
        "next-level button": 'id="next"',
        "next-level handler": "next.onclick=",
        "reset handler": "getElementById('reset').onclick=",
        "first level": "name:'Возик'",
        "final level": "name:'Вітрячок'",
    }
    for label, fragment in required.items():
        if fragment not in content:
            errors.append("Missing " + label)
    levels = re.findall(r"\{name:'[^']+',className:", content)
    if len(levels) < 9:
        errors.append("Expected at least 9 level definitions, found " + str(len(levels)))
if not catalog.is_file() or 'data-target="geometry-games.html"' not in catalog.read_text(encoding="utf-8"):
    errors.append("First game is not linked from the games catalog")
print("Pixel — Майстерня фігур")
print("Structural checks:", "FAILED" if errors else "PASSED")
for error in errors:
    print("ERROR:", error)
print("This is a structural check; it does not claim to play through the game.")
sys.exit(bool(errors))
