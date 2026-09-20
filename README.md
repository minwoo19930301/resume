# Resume

[김민우 · Minwoo Kim](https://minwoo19930301.github.io/resume/)

One resume URL and one content catalog. Korean and English are display languages of the same document, not separate resumes.

## Language selection

The page uses an explicit `?lang=ko` or `?lang=en` choice first, then a saved preference, then the browser’s preferred languages. If no supported browser language is available it displays English. The Seoul time zone is used only when the browser exposes no language information. No IP geolocation or translation API is called.

The language selector stays on the same page. Choosing Auto clears the saved override. Korean HTML remains readable without JavaScript and supports the reader’s built-in browser translation.

Old `/kr/` and `/en/` links redirect to the unified page while preserving query parameters and fragments. `/kr/education.html` remains an independent document.

## Update content

1. Edit the paired entries in `src/resume.content.json`. Keep company work and internal AI Champion activities clearly attributed. Keep user-requested personal software projects in their own section below company work; distinguish in-development projects and upstream foundations. Exclude Ai-ing, personal AI/AX business and consulting promotions from the main developer resume and its metadata. Preserve existing wording unless the user requests a rewrite; add only user-confirmed experience.
2. Edit `src/resume.template.html` only when changing the document structure.
3. Run `node scripts/build.mjs` to regenerate `index.html`, `assets/content.js` and the legacy aliases.
4. Run `node --test tests/*.cjs` and review the page in both languages, including a narrow screen.

The source catalog is authoritative; generated HTML and JS should not be edited by hand. `assets/locale.js` contains language selection, `assets/resume.js` updates the document, and `assets/effects.js` preserves the existing visual effects.

`kr/education.html` is maintained independently for user-requested external education, mentoring and AX experience. Preserve its existing layout and video examples; keep company knowledge-sharing separate from personal education work and distinguish delivered, assigned and scheduled activities. Its additional styles live in `kr/education-additions.css` and are scoped to the education page.

GitHub Pages serves the repository root from `main`. Building locally does not publish changes.
