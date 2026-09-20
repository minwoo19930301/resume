/* One document and one content catalog; the visitor chooses its display language. */
(function () {
  'use strict';
  const content = window.ResumeContent;
  const localeAPI = window.ResumeLocale;
  if (!content || !localeAPI) return;
  const select = document.getElementById('resume-language');
  const storageKey = 'minwoo-resume-language';
  let sessionChoice;

  function readStored() {
    if (sessionChoice !== undefined) return sessionChoice;
    try { return localStorage.getItem(storageKey); } catch (_) { return null; }
  }
  function timeZone() {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (_) { return undefined; }
  }
  function render(language) {
    document.documentElement.lang = language;
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const entry = content[element.dataset.i18n];
      // HTML is authored locally, never taken from a query parameter or remote API.
      if (entry) element.innerHTML = entry[language];
    });
    document.querySelectorAll('[data-i18n-content]').forEach(element => {
      const entry = content[element.dataset.i18nContent];
      if (entry) element.setAttribute('content', entry[language]);
    });
  }
  function refresh() {
    const query = new URLSearchParams(location.search);
    const stored = readStored();
    const manual = localeAPI.normalizeLocale(query.get('lang')) || localeAPI.normalizeLocale(stored);
    render(localeAPI.chooseLocale({
      query, stored,
      languages: navigator.languages,
      language: navigator.language,
      timeZone: timeZone(),
    }));
    if (select) select.value = manual || 'auto';
  }

  if (select) select.addEventListener('change', () => {
    const chosen = localeAPI.normalizeLocale(select.value);
    sessionChoice = chosen;
    const url = new URL(location.href);
    if (chosen) url.searchParams.set('lang', chosen);
    else url.searchParams.delete('lang');
    try {
      if (chosen) localStorage.setItem(storageKey, chosen);
      else localStorage.removeItem(storageKey);
    } catch (_) { /* Blocked storage does not prevent language switching. */ }
    history.replaceState(null, '', url.pathname + url.search + url.hash);
    // The explicit choice still works when localStorage is unavailable.
    refresh();
  });
  window.addEventListener('languagechange', refresh);
  window.addEventListener('popstate', refresh);
  refresh();
})();
