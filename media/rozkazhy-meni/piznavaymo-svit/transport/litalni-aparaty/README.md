# Літальні апарати

Route: `media/rozkazhy-meni/piznavaymo-svit/transport/litalni-aparaty/`.

Five mini stories are available individually or as one continuous journey with an introduction and finish. One audio element persists between chapters so the initial user gesture can unlock the full journey. Narration length sets flight duration; transitions wait for narration to end. Pause freezes CSS animations and audio, including a pending transition. Leaving the viewer stops playback. Visibility changes pause the story. Screen wake lock is used where supported and released on exit.

Scenes:

- Balloon: three balloons at different depths, gently rising and falling over the river valley; no extra clouds, birds or sun sprites.
- Helicopter: a landing pad, separate body, main rotor and small tail rotor; vertical takeoff, hover and onward flight.
- Propeller airplane: the red plane body with a separately animated propeller, clouds in foreground and background.
- Airship: slow cruise over the valley, seven cranes in a distant formation.
- Passenger airplane: reusable CSS night sky with 64 stars, crescent moon, haze and one shooting star per cycle.

## Reusable assets

`assets/landscape.webp` is independent of all aircraft. `night-sky.css` defines the `.night-sky`, `.stars`, `.star`, `.moon`, `.shooting-star` and `.night-cloud` components; the `stars()` function in `story.js` supplies deterministic star positions. These components can be reused in other games and quiet stories.

New assets were created with built-in imagegen, using the existing red airplane as a style reference. They are kept as individual transparent sprites; the landscape is opaque. Prompt set:

| File | Generation brief |
| --- | --- |
| landscape.webp | Sunny storybook river valley, green hills, tiny village, distant blue mountains, clear empty upper sky; no vehicles, birds or text. |
| balloon.webp | One rainbow hot-air balloon and wicker basket, complete isolated sprite, no people or backdrop. |
| airship.webp | Blue-and-silver airship, nose right, small windowed gondola, matching polished toy illustration. |
| helicopter-body.webp | Yellow helicopter body with cockpit, skids, tail and bare rotor mast; no main or tail blades. |
| rotor.webp | One symmetric four-blade rotor viewed from above, charcoal blades with yellow tips, silver centered hub. |
| crane.webp | One grey crane flying right, extended neck, trailing legs, black wing tips and red crown. |
| red-body.webp | Edit of the original red airplane: remove propeller blades, preserve body, radial engine and silver hub. |
| red-propeller.webp | One separate three-blade charcoal propeller with red tips, white stripes and centered silver hub. |

The old balloon, airship and helicopter WebP files in the shared aircraft folder are truncated (their RIFF lengths exceed their actual file lengths). This story uses the new complete assets without overwriting those old files. The two intact shared airplanes remain the card/finale references.

Gigi voice: `n7Wi4g1bhpw4Bs8HK5ph`, Eleven Multilingual v2, stability .65, similarity .23, style .43, speaker boost. Full text is in `narration.json`; seven local MP3 files cover the intro, five aircraft and finish.

Validation: all five individual scenes and the complete chapter sequence tested at phone and laptop widths, including image decoding, pause/resume, mute, replay, menu return and restart. Reduced-motion styles retain static visible aircraft and disable the shooting star.