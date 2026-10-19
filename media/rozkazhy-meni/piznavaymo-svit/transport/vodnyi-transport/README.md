# Водний транспорт — Маленькі відкриття

Route: `media/rozkazhy-meni/piznavaymo-svit/transport/vodnyi-transport/index.html`.
Transport menu card links here. A single document and audio element preserve playback across automatic chapter transitions.

## Scenes

| Scene | Motion and setting |
|---|---|
| Intro | Sunny bay, three preview vessels |
| Rowboat | Lake, independent wooden oars rotate about oarlocks; two submerged perch |
| Sailboat | Wind-like rocking and crossing the bay, three gliding gull instances |
| Motorboat | Crossing with animated foam trail |
| Ferry | Departure from pier; gray harbor seal resting on its own rock |
| Cargo | Large container ship passing lighthouse; distant gulls |
| Submarine | Descending through clear water, fish, turtle, bubbles, sunlight rays |
| Finish | All six vessels in a responsive grid |

## Art

All newly generated art used the built-in imagegen tool. Transparent sprites retain their generated alpha; optimized as WebP. Existing shared transport originals were not overwritten. Three original files (cargo/ferry/submarine) fail decoding; other originals showed edge artifacts, so this story uses fresh complete vessel sprites.

| Assets | Generation prompt specification |
|---|---|
| lake / lake-wide | Peaceful freshwater lake, forested shore and green hills, sky upper 35%, open clear water lower 65%, stones and reeds in bottom corners. Polished luminous children's picture-book background, no animals, boats, text or people. Portrait 1024×1536 and wide 1536×1024. |
| bay / bay-wide | Sunny turquoise seaside bay, white coral lighthouse right, village in distance, wooden pier at left edge, foreground rocks lower right; open navigable water. Same picture-book style, no vehicles, animals, people or text. Portrait and wide companions. |
| underwater / underwater-wide | Clear luminous cyan tropical sea beneath wavy surface, descending sunbeams, sandy seabed and coral garden in lower quarter and corners, clear middle corridor. Same style, no fish, animals, vehicles or text. Portrait and wide companions. |
| gull | One natural white gray black-tipped seagull gliding right, yellow beak, entire bird; transparent background, no text or scenery. |
| rowboat | Blue wooden rowboat, wood bench seats, right-facing three-quarter side view, small metal oarlocks, no oars or water, transparent background. |
| oar | One honey-gold wooden oar, handle left and broad blade right, horizontal entire object; transparent background. |
| sailboat | Red and white sailboat, right-facing side view, tall mast, taut white sails with red bands, transparent background, no water/people/text. |
| motorboat | Compact orange and white speedboat, right-facing side view, open cockpit and rear engine; transparent background, no water/people/text. |
| ferry | Blue and white passenger ferry, two decks with windows and orange lifebuoys, bow right; transparent background, no water/people/text. |
| cargo | Large blue/red container ship, stacked colorful containers, white bridge rear left, bow right; transparent background, no water/people/text. |
| submarine | Rounded yellow research submarine, three blue portholes, periscope and rear propeller, facing right; transparent background, no water/people/text. |
| seal-rock | Gray harbor seal resting horizontally on a low rounded coastal rock, relaxed flippers and raised head; transparent background, no scenery/text. |

Existing nature assets reused: perch, blue discus, yellow tang and sea turtle from `media/pograymo/pryroda/assets/aquatic/`. Local copies allow standalone scene previews.

## Narration and controls

`narration.json` records exact speech text. Gigi voice `n7Wi4g1bhpw4Bs8HK5ph`, `eleven_multilingual_v2`, MP3 44.1kHz/128kbps; stability .65, similarity .23, style .43, speaker boost on. Intro, six scenes and finish have separate clips.

Full story auto-advances after each clip plus 1.2 seconds. CSS durations use actual metadata. Separate scenes repeat visual motion without repeating narration. Pause preserves the remaining transition delay. Replay, mute, restart and return-to-menu controls; hidden tabs pause. Screen Wake Lock is requested during viewing, recovered on playback/touch after release, and released on exit. Reduced motion has static visible vessels.

## Verification

Playwright at 393×852 and 1366×852: all six individual scenes, all eight chapters, automatic intro-to-rowboat transition, manual progression, pause/resume, mute, restart, image decode, no 404 or page errors, no horizontal overflow. Visual screenshots inspected and wide vessel dimensions adjusted to avoid clipping below stage. Physical device pronunciation and OS wake-lock behavior remain for user confirmation.
