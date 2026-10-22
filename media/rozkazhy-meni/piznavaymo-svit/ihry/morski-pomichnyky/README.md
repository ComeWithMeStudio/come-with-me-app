# Морські помічники Мімі

Six untimed activities built for the approved water-adventure idea of 22 October 2026:

1. Choose the rowboat and tap the oar three times to reach a buoy.
2. Choose the sailboat and tap the wind three times to fill its sails.
3. Choose the motorboat, load a parcel, then tap the destination pier.
4. Choose the ferry, board three passengers, then travel to the other pier.
5. Choose the container ship, select a colored container and its matching loading position three times; color plus symbol provides a second cue.
6. Choose the submarine and find a yellow fish, blue fish and turtle in any order.

Each chapter offers three vessel choices; all six vessels participate. Wrong answers give a gentle retry. Advancement is explicit after each activity. Native buttons support touch, mouse and keyboard. Loading containers uses select-then-activate, without requiring dragging.

The title uses the existing underwater scenery and a new transparent Mimi diver. Built-in imagegen used the existing front-facing Mimi as the identity reference: white/orange kitten, blue eyes, red collar and bell, blue/orange wetsuit, clear mask, regulator, yellow tank and orange flippers; no background or text. The optimized WebP is in assets/mimi-diver.webp. Mimi gently drifts in the underwater title scene.

Illustrations and lake/bay/underwater backgrounds reuse ../../transport/vodnyi-transport/assets/. Screen layouts adapt at 600px and use the existing -wide backgrounds on larger displays. Containers, wind, buoys and destination piers use CSS; passenger boarding uses emoji badges.

Fourteen local Gigi MP3 clips cover introduction, each chapter's choice/action instructions, and finale. Eleven Multilingual v2; stability .65, similarity .23, style .43, speaker boost. narration.json records every clip and synthesis text. Explicit stress marks for нати́сни and обери́ are for speech only. Rejected playback exposes a retry button; visible instructions remain available.

Quiet sea ambience is 16% during surface play and stops for intro, underwater play, pause and exit. Pause freezes CSS and Web Animations and disables play targets. Hiding the tab pauses; resumption is explicit. Wake lock is requested after the start gesture where supported. Reduced motion preserves all activities while shortening travel.
