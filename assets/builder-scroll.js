(() => {
  'use strict';
  const config = window.BuilderResumeConfig;
  const root = document.getElementById('builder-story');
  if (!root || !config) return;
  const video = document.getElementById('builder-video');
  const poster = document.getElementById('builder-poster');
  const panels = [...root.querySelectorAll('.builder-panel')];
  const notice = document.getElementById('builder-notice');
  const noticeText = document.getElementById('builder-notice-text');
  const retry = document.getElementById('builder-retry');
  const hint = document.getElementById('builder-scroll-hint');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const query = new URLSearchParams(location.search);
  const forceStatic = query.get('motion') === 'static';
  const forceMissing = query.get('video') === 'missing';
  const mobile = matchMedia('(max-width:760px)');
  const primary = mobile.matches ? config.mobileSource : config.source;
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  let ready = false, failed = false, frame = 0, target = 0, loadTimer = 0, source = '';
  const isStatic = () => forceStatic || reduced.matches || failed;
  const duration = () => Math.max(0, Math.min(video.duration || config.duration, config.duration) - 1 / 60);

  function setNotice(text, canRetry = false) {
    notice.hidden = !text;
    noticeText.textContent = text;
    retry.hidden = !canRetry;
  }
  const usesPresentedFrames = 'requestVideoFrameCallback' in video;
  let coastFrame = 0, coastDirection = 0, queuedDirection = 0, pendingDirection = 0;
  function stopCoast() {
    cancelAnimationFrame(coastFrame); coastFrame = 0; coastDirection = 0; queuedDirection = 0;
    root.classList.remove('is-coasting');
  }
  function layout() {
    const fixed = isStatic();
    root.classList.toggle('is-static', fixed);
    root.style.height = fixed ? 'auto' : `${(config.scrollScreens + 1) * 100}svh`;
    if (fixed) { stopCoast(); pendingDirection = 0; document.body.classList.remove('is-in-story'); }
  }
  function focusAt(time) {
    const points = config.mobileFocus;
    let i = 0;
    while (i < points.length - 2 && time > points[i + 1][0]) i++;
    const [a, x] = points[i], [b, y] = points[i + 1];
    return x + (y - x) * clamp((time - a) / (b - a));
  }
  function display(time) {
    const chapters = config.chapters;
    const index = Math.max(0, chapters.findLastIndex(chapter => time >= chapter.start));
    const chapter = chapters[index];
    const opening = time < .025;
    root.classList.toggle('is-opening', opening);
    root.style.setProperty('--opening-opacity', String(clamp(1 - time / .38)));
    root.dataset.chapter = chapter.id;
    if (hint) {
      hint.querySelector('.hint-label').textContent = index === chapters.length - 1 ? '이력서 더 보기' : '스크롤하세요';
    }
    root.dataset.displayTime = time.toFixed(3);
    root.style.setProperty('--mobile-focus', `${focusAt(time).toFixed(2)}%`);
    panels.forEach((panel, i) => {
      const selected = i === index;
      panel.classList.toggle('is-active', selected);
      panel.setAttribute('aria-hidden', String(!selected || opening));
      if (!selected) return;
      const enter = i === 0 ? 1 : clamp((time - chapter.start) / .16);
      const leave = i === chapters.length - 1 ? 1 : clamp((chapter.end - time) / .16);
      panel.style.opacity = String(Math.min(enter, leave));
      panel.style.transform = `translateY(${(1 - enter) * 10}px)`;
    });
  }
  function seekLatest() {
    if (!ready || isStatic() || video.seeking) return;
    if (Math.abs(video.currentTime - target) > .008) video.currentTime = target;
  }
  function render() {
    frame = 0;
    if (isStatic()) return;
    const bounds = root.getBoundingClientRect();
    const stageHeight = root.querySelector('.builder-stage').clientHeight;
    const progress = clamp(-bounds.top / Math.max(1, root.offsetHeight - stageHeight));
    // The playhead follows the page continuously, including while a brief gesture coasts the page.
    target = progress * duration();
    root.dataset.videoTime = target.toFixed(3);
    document.body.classList.toggle('is-in-story', bounds.top < innerHeight && bounds.bottom > innerHeight * .15);
    seekLatest();
  }
  function schedule() {
    if (!frame && !isStatic()) frame = requestAnimationFrame(render);
  }

  function geometry() {
    const top = root.getBoundingClientRect().top + scrollY;
    const range = Math.max(1, root.offsetHeight - root.querySelector('.builder-stage').clientHeight);
    return {top, range, end: top + range};
  }
  function canAdvance(direction) {
    if (isStatic()) return false;
    const {top, end} = geometry();
    return scrollY >= top - 1 && scrollY <= end + 2 && !(direction < 0 && scrollY <= top + 1 && !coastFrame);
  }
  function advance(direction) {
    if (!canAdvance(direction)) return false;
    // Keep the opening gesture if the video is still loading behind the black screen.
    if (!ready) { pendingDirection = direction; return true; }
    // A distinct new gesture is an instruction, even while the previous one
    // is finishing. Keep one next step; never interrupt or skip its destination.
    if (coastFrame && direction === coastDirection) { queuedDirection = direction; return true; }
    const {top, range} = geometry();
    const from = scrollY;
    const startTime = clamp((from - top) / range) * duration();
    // Reversals start from the current position, never a future destination.
    const reference = startTime;
    const anchors = config.anchors;
    let toTime;
    if (direction > 0) toTime = anchors.find(t => t > reference + .12) ?? (duration() + 1);
    else toTime = anchors.findLast(t => t < reference - .12) ?? 0;
    // The first gesture reveals Planning from black; later ones advance one chapter.
    const to = toTime > duration() ? top + root.offsetHeight : top + range * toTime / duration();
    stopCoast();
    coastDirection = direction;
    root.classList.add('is-coasting');
    const started = performance.now();
    const milliseconds = toTime > duration() ? 1000 : 1120;
    const coast = now => {
      const progress = clamp((now - started) / milliseconds);
      // A clear acceleration, then a soft landing. No input is needed after the initial flick.
      const eased = progress * progress * (3 - 2 * progress);
      window.scrollTo({top: from + (to - from) * eased, behavior: 'instant'});
      render();
      if (progress < 1) coastFrame = requestAnimationFrame(coast);
      else {
        const next = queuedDirection;
        stopCoast();
        if (next) advance(next);
      }
    };
    coastFrame = requestAnimationFrame(coast);
    return true;
  }
  const interactive = event => event.target.closest('input, textarea, select, [contenteditable="true"], .resume-controls');
  let wheelAt = -Infinity, wheelMagnitude = 0, wheelDirection = 0, gestureAt = -Infinity;
  addEventListener('wheel', event => {
    if (event.ctrlKey || interactive(event) || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
    const direction = Math.sign(event.deltaY);
    if (!direction || !canAdvance(direction)) return;
    event.preventDefault();
    const now = performance.now();
    const magnitude = Math.abs(event.deltaY) * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1);
    // Start on the first vertical input, regardless of distance. A decaying
    // momentum tail belongs to that gesture; a pause, reversal, or new impulse
    // identifies the next one. No accumulated-pixel threshold is required.
    const fresh = now - wheelAt > 160 || direction !== wheelDirection ||
      (now - gestureAt > 240 && magnitude > wheelMagnitude * 2.5 && magnitude > wheelMagnitude + 2);
    wheelAt = now; wheelDirection = direction; wheelMagnitude = magnitude;
    if (fresh) { gestureAt = now; advance(direction); }
  }, {passive: false});
  let touchY = null, touchX = 0, touchUsed = false;
  root.addEventListener('touchstart', event => {
    if (event.touches.length !== 1 || interactive(event)) { touchY = null; return; }
    touchY = event.touches[0].clientY; touchX = event.touches[0].clientX; touchUsed = false;
  }, {passive: true});
  root.addEventListener('touchmove', event => {
    if (touchY === null || event.touches.length !== 1) return;
    const dy = touchY - event.touches[0].clientY;
    const dx = touchX - event.touches[0].clientX;
    if (Math.abs(dx) > Math.abs(dy)) return;
    const direction = Math.sign(dy);
    if (!canAdvance(direction)) return;
    event.preventDefault();
    if (!touchUsed && Math.abs(dy) > 8) { touchUsed = true; advance(direction); }
  }, {passive: false});
  root.addEventListener('touchend', () => { touchY = null; }, {passive: true});
  addEventListener('keydown', event => {
    if (interactive(event) || event.altKey || event.ctrlKey || event.metaKey || event.repeat || event.target.closest('a, button')) return;
    const direction = ['ArrowDown', 'PageDown', ' '].includes(event.key) ? (event.shiftKey ? -1 : 1) : ['ArrowUp', 'PageUp'].includes(event.key) ? -1 : 0;
    if (direction && advance(direction)) event.preventDefault();
    if (event.key === 'Escape' || event.key === 'Home' || event.key === 'End') stopCoast();
  });
  addEventListener('pointerdown', event => {
    if (!root.contains(event.target) || interactive(event)) stopCoast();
  }, {passive: true});

  function fail(message) {
    clearTimeout(loadTimer);
    ready = false; failed = true;
    video.pause();
    root.classList.remove('is-ready');
    cancelAnimationFrame(frame); frame = 0;
    layout();
    setNotice(message, true);
  }
  function load(url) {
    clearTimeout(loadTimer);
    ready = false; failed = false; source = url;
    root.classList.remove('is-ready');
    setNotice('');
    video.src = url;
    video.load();
    layout();
    loadTimer = setTimeout(() => {
      if (!ready) fail('영상을 불러오지 못해 정지 화면으로 표시합니다.');
    }, 16000);
  }
  video.addEventListener('loadeddata', () => {
    clearTimeout(loadTimer);
    ready = true; failed = false;
    root.classList.add('is-ready');
    setNotice(''); layout(); display(video.currentTime); render();
    if (pendingDirection) {
      const next = pendingDirection; pendingDirection = 0; advance(next);
    }
  });
  video.addEventListener('error', () => {
    if (!forceMissing && source === primary && primary !== config.source) load(config.source);
    else fail('영상을 불러오지 못해 정지 화면으로 표시합니다.');
  });
  video.addEventListener('seeked', () => {
    // currentTime can be ahead of the displayed frame. Only one source should
    // update the copy, otherwise it flickers across chapter boundaries.
    if (!usesPresentedFrames) display(video.currentTime);
    seekLatest();
  });
  video.addEventListener('play', () => video.pause());
  if (usesPresentedFrames) {
    const onFrame = (_, metadata) => {
      display(metadata.mediaTime);
      video.requestVideoFrameCallback(onFrame);
    };
    video.requestVideoFrameCallback(onFrame);
  }
  poster.addEventListener('error', () => {
    if (!poster.dataset.backup) { poster.dataset.backup = '1'; poster.src = './img/pic.jpeg'; }
  });
  retry.addEventListener('click', () => load(forceMissing ? './img/missing-preview-video.mp4' : primary));
  addEventListener('scroll', schedule, {passive: true});
  addEventListener('resize', schedule, {passive: true});
  addEventListener('pageshow', schedule);
  reduced.addEventListener('change', () => {
    video.pause(); layout();
    if (!isStatic()) { if (!ready) load(primary); else render(); }
  });
  layout(); display(0);
  if (!isStatic() || forceMissing) { load(forceMissing ? './img/missing-preview-video.mp4' : primary); render(); }
})();
