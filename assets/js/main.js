// Page behaviour: lazy 3D scenes, scroll reveal, tabs, counters, keyboard
// navigation between sections, and the reading-progress bar.

const scenes = {
  'hero-scene': () => import('./scene-hero.js'),
  'model-scene': () => import('./scene-model.js'),
  'token-scene': () => import('./scene-token.js'),
};

function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch (e) {
    return false;
  }
}

const hasGL = webglAvailable();
if (!hasGL) document.documentElement.classList.add('no-webgl');

// Load each 3D scene shortly before it scrolls into view.
const sceneObserver = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    const el = e.target;
    sceneObserver.unobserve(el);
    const load = scenes[el.id];
    if (!load || !hasGL) continue;
    load()
      .then((m) => { m.default(el); el.classList.add('ready'); })
      .catch((err) => { console.error(err); el.classList.add('failed'); });
  }
}, { rootMargin: '400px 0px' });
Object.keys(scenes).forEach((id) => {
  const el = document.getElementById(id);
  if (el) sceneObserver.observe(el);
});

// Reveal on scroll.
const revealObserver = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    e.target.classList.add('in');
    revealObserver.unobserve(e.target);
    e.target.querySelectorAll('[data-count]').forEach(countUp);
  }
}, { threshold: 0.15 });
document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

function countUp(el) {
  const end = parseFloat(el.dataset.count);
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { el.textContent = end; return; }
  const start = performance.now();
  const dur = 1100;
  const step = (now) => {
    const p = Math.min(1, (now - start) / dur);
    el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// Tabs.
document.querySelectorAll('[data-tabs]').forEach((group) => {
  const tabs = [...group.querySelectorAll('[role="tab"]')];
  const select = (tab) => {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute('aria-selected', on);
      t.tabIndex = on ? 0 : -1;
      const panel = document.getElementById(t.getAttribute('aria-controls'));
      panel.hidden = !on;
      if (on) panel.querySelectorAll('.reveal').forEach((r) => r.classList.add('in'));
    });
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(t));
    t.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const n = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
      n.focus();
      select(n);
    });
  });
});

// Section navigation: dots, active link, progress and keyboard.
const sections = [...document.querySelectorAll('main > section')];
const dots = document.querySelector('.dots');
sections.forEach((s) => {
  const a = document.createElement('a');
  a.href = '#' + s.id;
  a.setAttribute('aria-label', s.dataset.title || s.id);
  a.dataset.label = s.dataset.title || '';
  dots.appendChild(a);
});
const dotLinks = [...dots.querySelectorAll('a')];
const navLinks = [...document.querySelectorAll('.topnav a')];
let current = 0;

const activeObserver = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    current = sections.indexOf(e.target);
    dotLinks.forEach((d, i) => d.classList.toggle('on', i === current));
    const group = e.target.dataset.group;
    navLinks.forEach((l) => l.classList.toggle('on', l.dataset.group === group));
  }
}, { rootMargin: '-45% 0px -50% 0px' });
sections.forEach((s) => activeObserver.observe(s));

const bar = document.querySelector('.progress span');
const onScroll = () => {
  const max = document.documentElement.scrollHeight - innerHeight;
  bar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
  document.body.classList.toggle('scrolled', scrollY > 40);
};
addEventListener('scroll', onScroll, { passive: true });
onScroll();

addEventListener('keydown', (e) => {
  if (e.target.closest('input, textarea, select, [role="tab"]') || e.metaKey || e.ctrlKey || e.altKey) return;
  let next = null;
  if (['ArrowDown', 'PageDown', 'ArrowRight'].includes(e.key)) next = Math.min(current + 1, sections.length - 1);
  if (['ArrowUp', 'PageUp', 'ArrowLeft'].includes(e.key)) next = Math.max(current - 1, 0);
  if (e.key === 'Home') next = 0;
  if (e.key === 'End') next = sections.length - 1;
  if (next === null) return;
  e.preventDefault();
  sections[next].scrollIntoView({ behavior: 'smooth' });
});

// Mobile menu.
const menuBtn = document.querySelector('.menu-btn');
menuBtn?.addEventListener('click', () => {
  const open = document.body.classList.toggle('menu-open');
  menuBtn.setAttribute('aria-expanded', open);
});
navLinks.forEach((l) => l.addEventListener('click', () => {
  document.body.classList.remove('menu-open');
  menuBtn?.setAttribute('aria-expanded', 'false');
}));
