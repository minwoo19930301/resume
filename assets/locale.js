(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.ResumeLocale = api;
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this), function () {
  'use strict';

  function normalizeLocale(value) {
    if (typeof value !== 'string') return null;
    var part = value.trim().toLowerCase().replace(/_/g, '-').split('-')[0];
    return ['ko', 'en', 'ja', 'zh', 'es'].includes(part) ? part : null;
  }

  function valueFromQuery(query) {
    if (query == null) return null;
    if (typeof query === 'string') {
      var text = query.charAt(0) === '?' ? query.slice(1) : query;
      return new URLSearchParams(text).get('lang');
    }
    if (typeof URLSearchParams !== 'undefined' && query instanceof URLSearchParams) {
      return query.get('lang');
    }
    if (typeof query === 'object') return query.lang;
    return null;
  }

  function chooseLocale(options) {
    options = options || {};
    var queryLocale = normalizeLocale(valueFromQuery(options.query));
    if (queryLocale) return queryLocale;

    var storedLocale = normalizeLocale(options.stored);
    if (storedLocale) return storedLocale;

    var languages = Array.isArray(options.languages) ? options.languages : null;
    if (languages && languages.length) {
      for (var i = 0; i < languages.length; i += 1) {
        var candidate = normalizeLocale(languages[i]);
        if (candidate) return candidate;
      }
    }

    if (normalizeLocale(options.language)) return normalizeLocale(options.language);
    if (languages && languages.length) return 'en';
    if (typeof options.language === 'string' && options.language.trim()) return 'en';
    return options.timeZone === 'Asia/Seoul' ? 'ko' : 'en';
  }

  function legacyURL(href, locale) {
    var targetLocale = normalizeLocale(locale);
    if (!targetLocale) throw new TypeError('unsupported resume locale');

    var base = 'https://resume.invalid/';
    var url = new URL(href, base);
    var oldPath = /\/(?:kr|ko|en)(?:\/index\.html)?\/?$/i.test(url.pathname);
    if (!oldPath) return href;
    url.pathname = url.pathname.replace(/\/(?:kr|ko|en)(?:\/index\.html)?\/?$/i, '/');
    var existing = normalizeLocale(url.searchParams.get('lang'));
    url.searchParams.set('lang', existing || targetLocale);
    if (href.charAt(0) === '/') return url.pathname + url.search + url.hash;
    return url.href.replace(base, '');
  }

  return { chooseLocale: chooseLocale, normalizeLocale: normalizeLocale, legacyURL: legacyURL };
});
