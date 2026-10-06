# Store listing

Copy-paste text for the Chrome Web Store and Edge Add-ons dashboards. Not part of the package (`scripts/package.js` only zips runtime files).

Package: `node scripts/package.js` → `dist/hen-extension-<version>.zip`. Bump `version` in `manifest.json` before every new upload.

## Basics

| Field | Value |
| --- | --- |
| Name | Hen → han/hun *(taken from `manifest.json`)* |
| Category | Accessibility, or Productivity |
| Primary language | Norwegian Bokmål (add English as a second listing language) |
| Privacy policy URL | https://github.com/vebmyk/han-hun/blob/master/PRIVACY.md |
| Homepage / support URL | https://github.com/vebmyk/han-hun |

## Summary (max 132 characters)

**English** (98)

> Rewrites the Norwegian pronoun "hen" as han/hun (or han, hun, vedkommende) on Norwegian web pages.

**Norsk** (99)

> Erstatter pronomenet «hen» med han/hun (eller bare han, hun eller vedkommende) på norske nettsider.

## Description

**English**

```
Hen → han/hun rewrites the Norwegian pronoun "hen" on web pages, so you read han, hun or vedkommende instead.

What it does
• Replaces "hen" with the right form: han/hun (subject), ham/henne (object), hans/hennes (possessive). It also supports Nynorsk (han/ho, hans/hennar).
• Choose the replacement: "han/hun", "han eller hun", always "han", always "hun", always "vedkommende", or a random pick per page (the same pick for the whole page, so a text never changes midway).
• Only runs on Norwegian pages: pages marked nb/nn/no, or recognised as Norwegian from the text. You can turn the language check off.
• Per-site disable list. Dictionary sites such as ordnett.no and ordbokene.no are skipped automatically, since they discuss "hen" as a word.
• Works on content that loads after the page, such as feeds and comment sections.

Good to know
• Picking subject or object form (han vs. ham, hun vs. henne) is done with word lists and rules, not a language model. It is right in most ordinary sentences but will occasionally miss. Known limitations are listed in the README.
• Only visible page text is changed: not the tab title, image text or text you type into forms.
• Settings changes apply after you reload the page.

Privacy
Everything happens in your browser. The extension collects nothing, sends nothing and has no analytics. Only your settings are saved, via the browser's own storage.

Open source (GPL). Source code, tests and bug reports: https://github.com/vebmyk/han-hun
```

**Norsk**

```
Hen → han/hun skriver om pronomenet «hen» på nettsider, slik at du leser han, hun eller vedkommende i stedet.

Dette gjør den
• Erstatter «hen» med riktig form: han/hun (subjekt), ham/henne (objekt), hans/hennes (eiendomsord). Støtter også nynorsk (han/ho, hans/hennar).
• Du velger erstatning: «han/hun», «han eller hun», alltid «han», alltid «hun», alltid «vedkommende», eller tilfeldig per side (samme valg hele siden, så en tekst skifter aldri midt i).
• Kjører bare på norske sider: sider merket nb/nn/no, eller gjenkjent som norske ut fra teksten. Språksjekken kan slås av.
• Liste over nettsteder du vil deaktivere. Ordbokssider som ordnett.no og ordbokene.no hoppes over automatisk, siden de omtaler «hen» som ord.
• Virker også på innhold som lastes inn etter at siden er åpnet, for eksempel strømmer og kommentarfelt.

Greit å vite
• Valget mellom subjekts- og objektsform (han/ham, hun/henne) gjøres med ordlister og regler, ikke en språkmodell. Det blir riktig i de fleste vanlige setninger, men bommer av og til. Kjente begrensninger står i README.
• Bare synlig sidetekst endres: ikke fanetittel, tekst i bilder eller tekst du skriver i skjemaer.
• Endringer i innstillingene gjelder etter at du har lastet siden på nytt.

Personvern
Alt skjer i nettleseren din. Utvidelsen samler ikke inn noe, sender ikke noe og har ingen analyse. Bare innstillingene dine lagres, i nettleserens egen lagring.

Åpen kildekode (GPL). Kildekode, tester og feilmeldinger: https://github.com/vebmyk/han-hun
```

## Privacy tab (Chrome Web Store)

**Single purpose**

> Replaces the Norwegian pronoun "hen" with han/hun (or han, hun, vedkommende) in the text of Norwegian web pages.

**Permission justifications**

- `storage`: Saves the user's settings (enabled, replacement mode, skip-language-check, list of disabled sites). Nothing else is stored.
- Host access / content script on `<all_urls>`, all frames: The extension must read and rewrite text on Norwegian pages, which can be on any domain, including text inside iframes (comment widgets, embedded articles). It checks each page's language first and does nothing on non-Norwegian pages. Page text is processed locally and never leaves the browser.

**Remote code:** No. All code ships in the package; there are no remote scripts, no `eval`, and no network requests.

**Data usage:** Tick none of the data-collection categories. The extension does not collect or transmit user data. Then tick all three certifications (no selling data, no unrelated use, no creditworthiness/lending use).

## Assets to produce

- **Screenshots** (at least 1, up to 5): 1280×800 (or 640×400), 24-bit PNG without alpha, or JPEG. `store/screenshots/demo-after.png` (and `demo-before.png` for comparison) show our own demo page, `store/demo/index.html`, with subject, object, possessive, adverb (left alone), dialogue and Nynorsk cases. Use these first: no third-party content. To regenerate after changing the page or `hen.js`: render `store/demo/index.html` and `index.html?mode=after` at 1280×800 (the `after` mode loads the real `hen.js` + `content.js`; headless Edge with `--screenshot --window-size=1280,800 --force-device-scale-factor=1` works). `popup.png` shows the settings popup: `store/demo/popup-scene.html` around `store/demo/popup.png`, which is the real `options.html` + `options.js` rendered at 2× with `chrome.storage` stubbed to its defaults (re-render it if `options.html` changes).
- **Small promo tile:** `store/screenshots/promo-tile-440x280.png`, from `store/demo/promo.html` (440×280, required by the Chrome Web Store).
- **Marquee promo tile:** 1400×560 (optional).
- **Store icon:** `icons/icon_128.png` is used from the package; the dashboard also asks for a 128×128 upload.

## Review notes

The `<all_urls>` content script triggers the "read and change all your data on all websites" warning and a longer review. If the reviewer asks, point to the permission justification above and `PRIVACY.md`.
