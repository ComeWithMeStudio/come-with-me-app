# Літерна пошта Мімі: завершення інтеграції
Дата: 12.11.2026. Статус: функціональну браузерну перевірку завершено; схвалення Альони не зафіксовано.

## Вихідний стан
Pages успішно опублікував денні зміни fa12f16. Наявну гру з 12 листів завершували перед новою.
У браузері виявлено порожній автобус. Файл city-bus-yellow.webp завантажувався HTTP 200 і мав naturalWidth, але не декодувався Pillow та FFmpeg. Отже, HTTP 200 і naturalWidth не доводять справність малюнка.

## Зміни
- Окремий assets/bus-v2.webp лише для цієї гри. Спільний пошкоджений файл не змінено.
- Малюнок створено вбудованим генератором: один жовтий міський автобус, прозорий фон, повний силует, м'яка мальована дитяча стилістика, сині вікна, без тексту, людей і логотипів. Зменшено до 512×512 зі збереженням прозорості.
- Повне перемішування Fisher–Yates замість лише циклічного зсуву трьох відповідей.
- Зупинка поточної репліки під час переходу до нового листа.
- На фіналі кнопка повторного прослуховування підписана «Послухати привітання».
- Аудіоелементи в DOM: можна перевірити readyState, помилки та фактичний стан відтворення.
- На вузькому екрані всі три варіанти розміщено в один ряд; кнопки слів мають доступні назви, кнопки звуку не нижче 44 px.
- docs/qa/letter-post-viewports.html: ручна перевірка справжньої сторінки у вікнах iframe шириною 320/390/768/1280 CSS px. Це не емуляція фізичного телефона.

## Фактично перевірено до фінального проходу
- В опублікованій версії з озвученням пройдено 12 завдань, неправильну відповідь, фінал і повтор.
- Усі 10 MP3 завантажено та повністю декодовано FFmpeg без помилок.
- Сім наявних малюнків декодовано Pillow; автобус замінено й видно в браузері.
- Вступ та слово «Автобус» справді відтворюються (paused=false, currentTime зростає); вимкнення звуку зупиняє всі audio.
- Локальний Chromium не запускається: socket() failed, Operation not permitted. Використано спільний Chrome.
- Фізичні iOS/Android і суб'єктивну вимову не перевірено асистентом.

## Фінальний результат перевірки
- Публікація af70af9 на Pages успішна (run 43132502610).
- Chrome: усі 12 завдань пройдено на широкому екрані та в iframe шириною 390 px. Неправильна відповідь не просуває гру; правильна блокує повторне зарахування; фінал, повтор і вихід до каталогу працюють.
- Усі вісім слів запущено з відповідних кнопок: readyState=4, paused=false і currentTime>0; нове слово зупиняє попереднє. Фінальна репліка також фактично запустилася.
- Перевірено верстку при 320, 390, 768 і 1280 CSS px. scrollWidth дорівнює clientWidth; три картки в одному рядку, кнопки звуку 44 px на вузькому екрані.
- Знімки: docs/qa/letter-post-mobile-390.jpg та docs/qa/letter-post-wide-1280.jpg.
- Не робити висновку про бездоганну вимову з readyState: суб'єктивне прослуховування і фізичні iOS/Android тут не перевірялися.

## Точний запит до вбудованого генератора автобуса
Use case: illustration-story. Asset type: picture card for a Ukrainian children's learning game, ages 6. Draw one cheerful yellow city bus, isolated on a genuinely transparent background, centered, entire vehicle visible, side three-quarter view, large readable silhouette. Polished softly painted children's storybook 3D illustration, warm yellow body, blue windows, two visible dark rubber wheels, friendly rounded proportions, consistent with detailed painted animal and fruit picture cards. No eyes or face, no people, no text, no logo, no watermark, no scenery. Bus should occupy most of the square canvas with small safe transparent margins.

Файл у проєкті: media/pograymo/litery/ihry/literna-poshta/assets/bus-v2.webp. Згенерований PNG збережено до масштабування; фінальний WebP 512×512 зі збереженою прозорістю завантажено в GitHub. Не замінювали спільний пошкоджений оригінал.
