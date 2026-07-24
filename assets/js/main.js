// Icons
lucide.createIcons();
document.getElementById('year').textContent = new Date().getFullYear();

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (reduce) document.body.classList.add('reduce-motion');

// Attempt to play hero video (iOS Safari blocks autoplay in Low Power Mode / data saver)
const hv = document.querySelector('.hero-video');
if (hv) {
  const playPromise = hv.play();
  if (playPromise !== undefined) {
    playPromise.catch(() => {
      // Autoplay blocked — hide video so aurora fallback shows fully
      hv.style.opacity = '0';
    });
  }
  // Also handle iOS pausing after first frame
  hv.addEventListener('pause', () => {
    if (hv.currentTime < 1) {
      hv.style.opacity = '0';
    }
  });
}

// --- Nav background on scroll ---
const nav = document.getElementById('nav');
const onScroll = () => {
  if (window.scrollY > 24) nav.classList.add('shadow-md');
  else nav.classList.remove('shadow-md');
};
onScroll(); window.addEventListener('scroll', onScroll, {passive:true});

// --- Mobile menu ---
const mBtn = document.getElementById('menu-btn');
const mMenu = document.getElementById('mobile-menu');
mBtn.addEventListener('click', () => mMenu.classList.toggle('hidden'));
document.querySelectorAll('.mobile-link').forEach(l => l.addEventListener('click', () => mMenu.classList.add('hidden')));

// --- Hero char reveal ---
(function(){
  const title = document.getElementById('hero-title');
  const text = title.textContent.trim();
  const hi = 'expertise';
  const hiStart = text.toLowerCase().indexOf(hi);
  title.innerHTML = '';
  const buildChars = (str, offset) => {
    [...str].forEach((ch, k) => {
      const i = offset + k;
      const span = document.createElement('span');
      span.className = 'char';
      span.textContent = ch === ' ' ? ' ' : ch;
      span.style.transitionDelay = (i * 28) + 'ms';
      if (hiStart >= 0 && i >= hiStart && i < hiStart + hi.length) span.style.color = 'var(--accent)';
      title.appendChild(span);
    });
  };
  const splitAt = text.indexOf(', ');
  if (splitAt > -1) {
    buildChars(text.slice(0, splitAt + 1), 0);
    title.appendChild(document.createElement('br'));
    buildChars(text.slice(splitAt + 2), splitAt + 2);
  } else {
    buildChars(text, 0);
  }
  setTimeout(() => document.querySelectorAll('.char').forEach(c => c.classList.add('revealed')), 150);
})();

// --- Scroll reveal observer ---
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting){ e.target.classList.add('in-view'); io.unobserve(e.target); } });
}, { threshold: 0.12 });
document.querySelectorAll('.animate-on-scroll').forEach(el => io.observe(el));

// --- Counters ---
const counterIO = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target;
    const target = +el.dataset.target;
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    const dur = 1600; const start = performance.now();
    const fmt = n => n.toLocaleString('pt-BR');
    const tick = (now) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = prefix + fmt(Math.floor(eased * target)) + suffix;
      if (p < 1) requestAnimationFrame(tick); else el.textContent = prefix + fmt(target) + suffix;
    };
    requestAnimationFrame(tick);
    counterIO.unobserve(el);
  });
}, { threshold: 0.5 });
document.querySelectorAll('.counter').forEach(el => counterIO.observe(el));

// --- Flashlight effect ---
const grid = document.getElementById('flashlight-grid');
if (grid) grid.addEventListener('mousemove', (e) => {
  grid.querySelectorAll('.flashlight-card').forEach(card => {
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mouse-x', (e.clientX - r.left) + 'px');
    card.style.setProperty('--mouse-y', (e.clientY - r.top) + 'px');
  });
});
