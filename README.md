# Hen → han/hun

Browser extension (Manifest V3, Chrome/Edge; Firefox needs a small manifest tweak) that replaces the Norwegian neopronoun "hen" with han/hun on Norwegian pages.

## Install (Chrome / Edge)

1. Open `chrome://extensions` and enable **Developer mode**.
2. Click **Load unpacked** and select this folder.
3. Click the extension icon to choose your settings.

## Settings

- **han/hun** (default): hen → han/hun, ham/henne (object), hans/hennes (possessive). On Nynorsk text the forms are han/ho, han/henne, hans/hennar (in "always hun" mode: ho, henne, hennar). Nynorsk is picked from the nearest `lang` attribute (`nn`), or, for `lang="no"` or no `lang`, from marker words like *ikkje*, *eg*, *kva*.
- **han eller hun**: the same as the default, but with "eller" instead of a slash: hen → han eller hun, ham eller henne, hans eller hennes (Nynorsk: han eller ho, han eller henne, hans eller hennar).
- **always han** or **always hun**
- **always vedkommende**: hen → vedkommende, hens → vedkommendes. On Nynorsk text: vedkomande, vedkomandes. The word does not inflect for case, so subject/object detection does not matter in this mode.
- **random per page**: one pick per page load, so a text never flips gender midway
- Per-site disable list, and an option to skip the language check
- Dictionary sites are always skipped, since they discuss "hen" as a word: ordnett.no, naob.no, ordbokene.no, ordbok.uib.no and dokpro.uio.no (including subdomains). The list is `DICTIONARY_HOSTS` in `content.js`.

The extension only runs on pages marked `lang="nb|nn|no"`, or detected as Norwegian from the text. Elements with a different `lang` attribute are skipped.

## How it works

- `hen.js` is the core logic. Every standalone "hen" is treated as the pronoun except in a few adverb uses (*gå hen til/og*, *la det stå hen*, *falle hen i søvn*, *hen i det uvisse*, *adverbet hen*, and the interrogative *Hvor/Kvar skal du hen?*, *hvor du bor hen*). Subject vs. object form is decided with word lists (prepositions, finite verbs, fronted phrases for V2 order). It also handles imperatives (*La hen gå.* vs. *La hen gå?*), adverbs between hen and its verb (*tror hen ikke kommer*), coordinated pronouns that fix the case (*han, hun eller hen*, *han/hun/hen*), relative clauses (*alle som kjenner hen vet*) and speech tags (*«…», sa hen*). The lists at the top of the file are the tuning surface.
- `content.js` walks text nodes, passes surrounding text as context, and watches for dynamically added content with a `MutationObserver`.

## Tests

```
node test/run.js
```

Add real-world sentences that go wrong to the `cases` array in `test/run.js`, then adjust the word lists in `hen.js`.

## Publishing

```
node scripts/package.js
```

builds `dist/hen-extension-<version>.zip` containing only the runtime files (it also checks that the icons exist and have the sizes the manifest claims). Bump `version` in `manifest.json` before each new upload. Listing text, permission justifications and the asset checklist are in [store/LISTING.md](store/LISTING.md); the privacy policy is [PRIVACY.md](PRIVACY.md).

## Known limitations

- Subject/object detection is heuristic. Known misses: an object followed by a finite verb inside an infinitive subject (*Å møte hen var fint* → subject form), a comma-less *for* meaning "because" (read as the preposition), a verb that is not in the word lists directly after hen (*hen* + unlisted verb after a verb that is neither clausal nor a preposition), and hen alone in its own element such as a list item, where the rest of the sentence is not visible.
- Only the visible page text is rewritten: not `document.title`, `alt`/`placeholder`/`aria-label` attributes, or text inside `<input>`/`<textarea>`. URLs, e-mail addresses and hashtags that merely contain "hen" (`www.hen.no`, `#hen`, `hen@x.no`) are left alone.
- Pages that talk about the word itself (e.g. Språkrådet's [hen article](https://sprakradet.no/spraksporsmal-og-svar/hen/)) come out odd, since a mention of the word ("pronomenet hen", a heading like "Eit anna hen") can't be told from a use. Add such sites to the per-site disable list.
- *hvor … hen* is recognised only with a locational verb (*bo, dra, reise, gå, sitte …*) or a bare modal + subject (*Hvor skal du hen?*). *Hvor sa du hen?* with other verbs is treated as the pronoun.
- Nynorsk verb coverage is a word list too: forms not in `VERB`/`VERB_NN` (many weak -ar verbs) are not seen as finite, so subject/object can be wrong in *ho/henne* mode. The object form of *han* is the same as the subject form in Nynorsk, so "always han" is unaffected.
- Text in canvas, images or shadow DOM (open or closed) is not touched; `about:blank`/`srcdoc` iframes are not matched either.
- Swedish/Danish pages are skipped by the language check, which can occasionally misjudge short pages; use "Skip language check" to override.
