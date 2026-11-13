const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const base = __dirname + '/../assets/';
function harness(presentedFrames = true, loadImmediately = true) {
  let now = 1000, serial = 0;
  const raf = new Map(), events = new Map(), positions = [];
  const el = () => {
    const listeners = new Map(), classes = new Set();
    return {
      dataset: {}, style: { setProperty() {} }, hidden: true,
      classList: { add: (...cs) => cs.forEach(c => classes.add(c)), remove: (...cs) => cs.forEach(c => classes.delete(c)), contains: c => classes.has(c), toggle: (c, on) => on ? classes.add(c) : classes.delete(c) },
      setAttribute() {}, closest: () => null,
      addEventListener: (name, cb) => listeners.set(name, cb),
      emit: (name, event) => listeners.get(name)?.(event),
    };
  };
  const root = el(), video = el(), stage = { clientHeight: 1000 }, hint = el(), label = {};
  const panels = Array.from({ length: 5 }, el);
  const elements = { 'builder-story': root, 'builder-video': video, 'builder-poster': el(), 'builder-notice': el(), 'builder-notice-text': el(), 'builder-retry': el(), 'builder-scroll-hint': hint };
  const context = {
    URLSearchParams, location: { search: '' }, innerHeight: 1000, scrollY: 0,
    performance: { now: () => now },
    document: { getElementById: id => elements[id], body: el() },
    matchMedia: () => ({ matches: false, addEventListener() {} }),
    requestAnimationFrame: cb => { const id = ++serial; raf.set(id, cb); return id; },
    cancelAnimationFrame: id => raf.delete(id),
    setTimeout: () => ++serial, clearTimeout() {},
    addEventListener: (name, cb) => events.set(name, cb),
  };
  context.window = context;
  context.scrollTo = ({ top }) => { context.scrollY = top; positions.push(top / 4500 * (context.BuilderResumeConfig.duration - 1 / 60)); };
  root.offsetHeight = 5500;
  root.getBoundingClientRect = () => ({ top: -context.scrollY, bottom: 5500 - context.scrollY });
  root.querySelector = () => stage;
  root.querySelectorAll = () => panels;
  hint.querySelector = () => label;
  video.currentTime = 0; video.duration = 7.6; video.load = () => {}; video.pause = () => {};
  let onFrame;
  if (presentedFrames) video.requestVideoFrameCallback = cb => { onFrame = cb; };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(base + 'builder-config.js', 'utf8'), context);
  video.duration = context.BuilderResumeConfig.duration;
  context.BuilderResumeConfig.gestureThreshold ??= 34;
  vm.runInContext(fs.readFileSync(process.env.SCROLL_SCRIPT || base + 'builder-scroll.js', 'utf8'), context);
  if (loadImmediately) video.emit('loadeddata');
  return {
    root, video, positions, config: context.BuilderResumeConfig,
    time: () => context.scrollY / 4500 * (context.BuilderResumeConfig.duration - 1 / 60),
    tick(ms) { const end = now + ms; while (now < end) { now = Math.min(now + 16, end); const current = [...raf.values()]; raf.clear(); current.forEach(cb => cb(now)); } },
    wheel(dir, magnitude = 1) { events.get('wheel')({ deltaY: dir * magnitude, deltaX: 0, deltaMode: 0, target: el(), preventDefault() {} }); },
    present(time) { onFrame?.(now, { mediaTime: time }); },
  };
}
const near = (a, b) => assert.ok(Math.abs(a - b) < .01, `${a} differs from ${b}`);
const h = harness();
assert.equal(h.root.classList.contains('is-opening'),true);
for (let i = 0; i < h.config.anchors.length; i++) {
  h.wheel(1); h.tick(1200); near(h.time(), h.config.anchors[i]);
}
for (let i = h.config.anchors.length - 2; i >= 0; i--) {
  h.wheel(-1); h.tick(1200); near(h.time(), h.config.anchors[i]);
}
const inertia = harness();
inertia.wheel(1,100);
for (let i=1;i<=40;i++) { inertia.tick(50); inertia.wheel(1,100*Math.exp(-i/8)); }
inertia.tick(1200); near(inertia.time(),inertia.config.anchors[0]);
inertia.wheel(1); inertia.tick(1200); near(inertia.time(),inertia.config.anchors[1]);
const queued = harness();
queued.wheel(1); queued.tick(300); queued.wheel(1); queued.tick(2200);
near(queued.time(),queued.config.anchors[1]);
assert.ok(queued.positions.some(t=>Math.abs(t-queued.config.anchors[0])<.001), 'first destination must be reached before queued step');
const reversed = harness();
reversed.wheel(1); reversed.tick(1200); reversed.wheel(1); reversed.tick(300); reversed.wheel(-1); reversed.tick(1200);
near(reversed.time(),reversed.config.anchors[0]);
const loading = harness(true,false);
loading.wheel(1); loading.tick(1500); near(loading.time(),0);
loading.video.emit('loadeddata'); loading.tick(1200); near(loading.time(),loading.config.anchors[0]);
const frame = harness();
frame.present(frame.config.chapters[1].start+.2);
frame.video.currentTime=frame.config.chapters[2].start+.2; frame.video.emit('seeked');
assert.equal(frame.root.dataset.chapter,frame.config.chapters[1].id);
frame.present(frame.config.chapters[2].start+.2); assert.equal(frame.root.dataset.chapter,frame.config.chapters[2].id);
console.log('PASS: black opening; first gesture reveals planning; loading preserves input; one 1px wheel event per chapter in both directions; no momentum skip; next gesture retained during transition; reversal; copy follows displayed frame');
