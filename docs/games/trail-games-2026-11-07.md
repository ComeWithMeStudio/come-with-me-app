# Мімі верхи та Собачий аджиліті

Created 2026-11-07 from the shared movement → obstacle → choice → continuation concept in Drive's `CWM_Future_Games_Register_2026-10-26.docx` (1TjXmx2ZQAEx6Cq1n86Ln1WKcOmzRsrZi), with the existing horse game's pacing as reference.

- Мімі верхи: `media/rozkazhy-meni/pryhody-mimi/mimi-verkhy/index.html`, linked from `mimi-adventures.html`. Two six-obstacle routes; Mimi stays mounted, earns one star per obstacle. Jump over logs/streams; go around rocks/trees.
- Собачий аджиліті: `media/pograymo/pryroda/ihry/sobachyi-adzhyliti/index.html`, linked from `nature-games.html`. Two six-obstacle routes covering hurdle, tunnel, slalom, ramp, steps and dog walk. Uses existing golden-white dog asset.
- Shared engine/art: `media/shared/trail-games/`. Paths are relative to support both custom domain and repository-prefix hosting.
- Wrong answers allow retry. No timer pressure or lost progress. Pauses on hidden tab, explicit pause/resume, restart cancels pending actions. Reduced-motion support. Optional synthesized footsteps and success chimes; no recorded narration yet.
- New rider illustration: built-in image generation using `mimi-standing-front.webp` and `mare.webp` identity/style references. Prompt: recognizable white/orange blue-eyed Mimi, red collar and bell, blue riding helmet, riding cream horse with silver mane facing right, full body, transparent background. Stored as optimized `assets/mimi-riding.webp`.

Validation: `node tools/test_trail_games.cjs` passes both routes in both games, wrong-answer retries, pauses during choices and animations, restart cancellation, final scores and hidden-tab pause. Static HTML asset/return links pass. Browser layout validation is still pending: local Chromium could not launch in this environment (socket permission failure). Publication to main was blocked by automatic approval review; local commits retain the complete implementation.

Update: added dog selection requested for Mira. Belgian Malinois is first/default, with the existing golden-white dog as the second choice. Selection is retained between routes and replays; restart/menu exposes the chooser again. Generated transparent full-body Malinois illustration (fawn coat, black mask, upright ears) stored in agility's own assets folder. Tests cover selecting both dogs and retaining Malinois through both routes. User explicitly authorized publication after the initial review rejection.
