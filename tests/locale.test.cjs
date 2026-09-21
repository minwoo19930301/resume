const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

// The workspace parent is ESM-scoped, so execute the UMD file in a small
// CommonJS sandbox to verify its module.exports branch without changing repo
// package metadata.
const sandboxModule = { exports: {} };
vm.runInNewContext(fs.readFileSync(require.resolve('../assets/locale.js'), 'utf8'), {
  module: sandboxModule,
  URL,
  URLSearchParams,
  globalThis: {},
});
const { chooseLocale, normalizeLocale, legacyURL } = sandboxModule.exports;

test('normalizes supported locale tags and rejects auto/unsupported values', () => {
  assert.equal(normalizeLocale('KO-kr'), 'ko');
  assert.equal(normalizeLocale('en_US'), 'en');
  assert.equal(normalizeLocale('auto'), null);
  assert.equal(normalizeLocale('fr'), null);
});

test('query has priority over storage, browser languages, and timezone', () => {
  assert.equal(chooseLocale({ query: { lang: 'EN' }, stored: 'ko', languages: ['ko-KR'], language: 'ko', timeZone: 'Asia/Seoul' }), 'en');
});

test('storage wins when query is invalid', () => {
  assert.equal(chooseLocale({ query: { lang: 'auto' }, stored: 'KO', languages: ['en-US'], language: 'en', timeZone: 'UTC' }), 'ko');
});

test('first supported browser language wins', () => {
  assert.equal(chooseLocale({ languages: ['fr-FR', 'ko-KR', 'en-US'], language: 'en', timeZone: 'UTC' }), 'ko');
});

test('supported navigator language is used after an unsupported language list', () => {
  assert.equal(chooseLocale({ languages: ['fr-FR'], language: 'KO-kr', timeZone: 'UTC' }), 'ko');
});

test('unsupported language list falls back to English', () => {
  assert.equal(chooseLocale({ languages: ['fr-FR', 'de-DE'], timeZone: 'Asia/Seoul' }), 'en');
});

test('timezone is used only when language information is absent', () => {
  assert.equal(chooseLocale({ timeZone: 'Asia/Seoul' }), 'ko');
  assert.equal(chooseLocale({ timeZone: 'UTC' }), 'en');
});

test('legacy paths move to /resume and preserve valid lang, query, and hash', () => {
  assert.equal(legacyURL('/resume/kr/?lang=en&view=all#top', 'ko'), '/resume/?lang=en&view=all#top');
  assert.equal(legacyURL('/resume/en/index.html?view=all#top', 'ko'), '/resume/?view=all&lang=ko#top');
});

test('legacyURL accepts absolute same-origin-style URLs without losing the origin', () => {
  assert.equal(legacyURL('https://example.com/resume/en/index.html?x=1#h', 'en'), 'https://example.com/resume/?x=1&lang=en#h');
});

test('legacyURL supports a root deployment and leaves other links alone', () => {
  assert.equal(legacyURL('/en/?x=1#work', 'en'), '/?x=1&lang=en#work');
  assert.equal(legacyURL('education.html', 'ko'), 'education.html');
  assert.equal(legacyURL('/resume/kr/education.html', 'ko'), '/resume/kr/education.html');
});

function loadPage(storage) {
  const handlers = {};
  const select = { value: 'auto', addEventListener: (name, callback) => { handlers[name] = callback; } };
  let printCalls = 0;
  const printButton = { addEventListener: (name, callback) => { handlers['print-' + name] = callback; } };
  const node = { dataset: { i18n: 'greeting' }, innerHTML: '' };
  const document = {
    documentElement: { lang: 'ko' },
    getElementById: id => id === 'resume-print' ? printButton : select,
    querySelectorAll: selector => selector === '[data-i18n]' ? [node] : [],
  };
  const location = new URL('https://example.com/resume/?source=application#work');
  const window = { ResumeLocale: sandboxModule.exports, ResumeContent: { greeting: { ko: '안녕하세요', en: 'Hello', ja: 'こんにちは', zh: '你好', es: 'Hola' } }, print() { printCalls += 1; }, addEventListener() {} };
  vm.runInNewContext(fs.readFileSync(require.resolve('../assets/resume.js'), 'utf8'), {
    document, window, localStorage: storage, location, URL, URLSearchParams, Intl,
    navigator: { languages: ['en-US'], language: 'en-US' },
    history: { replaceState: (_state, _title, url) => { location.href = new URL(url, location).href; } },
  });
  return { document, node, select, location, print() { handlers['print-click'](); return printCalls; }, change(value) { select.value = value; handlers.change(); } };
}

test('manual and automatic language selection work when storage is blocked', () => {
  const blocked = () => { throw new Error('Storage is disabled'); };
  const page = loadPage({ getItem: blocked, setItem: blocked, removeItem: blocked });
  assert.equal(page.node.innerHTML, 'Hello');
  page.change('ko');
  assert.equal(page.document.documentElement.lang, 'ko');
  assert.equal(page.node.innerHTML, '안녕하세요');
  assert.equal(page.location.search, '?source=application&lang=ko');
  assert.equal(page.location.hash, '#work');
  page.change('auto');
  assert.equal(page.node.innerHTML, 'Hello');
  assert.equal(page.select.value, 'auto');
  assert.equal(page.location.search, '?source=application');
});

test('automatic selection ignores an old preference when storage is read-only', () => {
  const blocked = () => { throw new Error('Storage is read-only'); };
  const page = loadPage({ getItem: () => 'ko', setItem: blocked, removeItem: blocked });
  assert.equal(page.node.innerHTML, '안녕하세요');
  page.change('auto');
  assert.equal(page.node.innerHTML, 'Hello');
  assert.equal(page.select.value, 'auto');
});


test('supports regional Japanese, Chinese and Spanish language settings', () => {
  for (const [tag, expected] of [['ja-JP','ja'],['zh-CN','zh'],['zh-Hant-TW','zh'],['es-MX','es']]) {
    assert.equal(normalizeLocale(tag), expected);
    assert.equal(chooseLocale({ languages: [tag, 'en-US'] }), expected);
  }
  assert.equal(legacyURL('/resume/en/?lang=ja#work', 'en'), '/resume/?lang=ja#work');
});

test('new languages render and print without changing the selected language', () => {
  const page = loadPage({getItem: () => null, setItem() {}, removeItem() {}});
  for (const [locale,text,htmlLang] of [['ja','こんにちは','ja'],['zh','你好','zh-Hans'],['es','Hola','es']]) {
    page.change(locale);
    assert.equal(page.node.innerHTML, text);
    assert.equal(page.document.documentElement.lang, htmlLang);
    assert.equal(page.select.value, locale);
  }
  assert.equal(page.print(), 1);
  assert.equal(page.node.innerHTML, 'Hola');
  assert.equal(page.location.search, '?source=application&lang=es');
});

test('all resume translations preserve links, code and paragraph counts', () => {
  const content = JSON.parse(fs.readFileSync(require.resolve('../src/resume.content.json'), 'utf8'));
  const matches = (s, pattern) => [...s.matchAll(pattern)].map(m => m[1]).sort();
  for (const [key, entry] of Object.entries(content)) {
    for (const locale of ['ko', 'en', 'ja', 'zh', 'es']) assert.ok(entry[locale]?.trim(), key + ':' + locale);
    for (const locale of ['ja', 'zh', 'es']) {
      assert.deepEqual(matches(entry[locale], /href="([^"]*)"/g), matches(entry.en, /href="([^"]*)"/g), key + ':' + locale + ' links');
      assert.deepEqual(matches(entry[locale], /<code>(.*?)<\/code>/g), matches(entry.en, /<code>(.*?)<\/code>/g), key + ':' + locale + ' code');
      assert.equal((entry[locale].match(/<p>/g) || []).length, (entry.en.match(/<p>/g) || []).length, key + ':' + locale + ' paragraphs');
      assert.doesNotMatch(entry[locale], /⟦\d+⟧|\{\{.*?\}\}/, key + ':' + locale + ' placeholders');
    }
  }
});
