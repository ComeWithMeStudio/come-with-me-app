# Полювання на фігури та кольори

Оновлення 25.10.2026: дві гри по 4 рівні × 5 завдань із діями поза екраном, музикою, озвученням Gigi та демонстраціями рухів Мімі.

`hunting-shapes.html` і `hunting-colors.html` у батьківській папці використовують спільні `game.js`, `game.css`, `tasks.js`, `media.js`, `narration.js`. `tasks.js` містить точні тексти й сталі ID завдань. `taskMotions()` у `game.js` задає відповідність завдання → послідовність рухів; `media.js` містить точні шляхи до наявних MP4.

## Озвучення

52 MP3 у `audio/`: 40 завдань, 2 вступи, 8 оголошень рівнів, спільне завершення рівня та фінал. `narration.json` містить тексти, файли, history_item_id для відновлення з ElevenLabs. Голос Gigi `n7Wi4g1bhpw4Bs8HK5ph`; модель `eleven_multilingual_v2`; stability .65, similarity .23, style .43, speaker boost. Усі записи відновлені з історії первинної генерації без повторного синтезу.

Похвала використовує `/audio/games/common/correct-1.mp3` … `correct-5.mp3`. Гучність голосу 85%. Повтор репліки скасовує попередню чергу, щоб голоси не накладалися.

## Музика та рухи

Рівням 1–4 відповідають `/audio/games/find-for-mimi/music/level-1.mp3` … `level-4.mp3`. Музика зациклена, гучність 14%, під голосом 4,5%. Відео без власного звуку. Пауза зупиняє голос, музику й відео; приховування вкладки також ставить гру на паузу. Кнопка звуку керує голосом та музикою.

Для оплесків, розведення рук, потягування, обертання, кроків, присідання, стрибків — відповідні рухи Мімі. Для пошуку — озирнутися. Складені рухи показуються послідовно. Фрагмент плеску повторюється за кількістю в інструкції; інші рухи — короткі ілюстративні демонстрації. Малювання фігур супроводжується SVG-підказкою. Вступ — махання лапкою; між рівнями — уклін; фінал — поцілунок. Після рухових завдань Мімі аплодує, після пошуку й малювання чергуються танці.

## Проходження

«Готово!» підтверджує виконання дитиною або дорослим; камерної перевірки немає. Відкладене завдання не зараховується. Вибір рівня дозволяє повернутися до нього. Прогрес рахує унікальні виконані завдання, перезапуск скидає його. Час пошуку не обмежений.

Три кроки назад замінені на кроки на місці. Для пошуку кольорових предметів є підказка взяти стільки, скільки доступно поруч. Початкові кількості з карт збережено.

Картки каталогу поки в режимі автора (`?preview=alona`) до дитячої перевірки; прямі URL доступні. Старі екранні ігри не змінені.

## Перевірка

Автоматично пройдено 40 завдань; перевірено завантаження 52 аудіофайлів, 4 мелодій, переходи, повтор, паузу, вимкнення звуку, послідовну демонстрацію складеної дії та ширини 320–1280 px. Переглянуто знімки мобільного й великого екранів. Потрібні авторське прослуховування вимови та дитячий тест.

## 2026-10-27 — mobile media and count cues
- `tasks.js` supplies explicit `cueGroups` for color quantities; artwork mirrors object counts, not movement counts. Multi-color quantities remain those in the spoken task (e.g. 2 red + 1 yellow).
- Single cues enlarged; grouped swatches retain compact sizes and wrap on narrow screens.
- `video/` contains 18 H.264/yuv420p, 640px, 24fps, silent, fast-start derivatives of the existing Mimi movement library. Combined size reduced from 75,636,868 to 2,019,952 bytes. Original library files unchanged. `media.js` maps the derivatives.
- Video poster and waiting/error messages prevent an empty celebration panel. Navigation releases previous video requests; repeated clap segments reuse their loaded source.
- Gigi clips colors-1-3, colors-1-5 and colors-4-2 regenerated with stress cues; author listening remains pending.
- Chromium validation: all 40 tasks and celebration video starts; 20/20 completion per game; explicit color counts; pause/resume; no JavaScript errors; overflow checks at 320, 390, 768, 1280px. Screenshots visually checked at 390px. Real-device network performance still needs user confirmation.
