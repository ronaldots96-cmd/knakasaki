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

// --- Vídeo da seção Sobre (play sob demanda) ---
const sobreVideo = document.getElementById('sobre-video');
const sobreVideoPlay = document.getElementById('sobre-video-play');
const sobreVideoInfo = document.getElementById('sobre-video-info');
if (sobreVideo && sobreVideoPlay) {
  sobreVideoPlay.addEventListener('click', () => {
    sobreVideoPlay.remove();
    if (sobreVideoInfo) sobreVideoInfo.remove();
    sobreVideo.controls = true;
    sobreVideo.play();
  });
}

// --- CNPJ: máscara e validação via API ---
const cnpjInput = document.getElementById('cnpj-input');
const cnpjFeedback = document.getElementById('cnpj-feedback');
if (cnpjInput && cnpjFeedback) {
  const maskCnpj = (value) => value
    .replace(/\D/g, '')
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');

  const setFeedback = (text, color) => {
    cnpjFeedback.textContent = text;
    cnpjFeedback.className = 'mt-1 block text-xs min-h-[14px] ' + color;
  };

  let debounceTimer;
  cnpjInput.addEventListener('input', () => {
    cnpjInput.value = maskCnpj(cnpjInput.value);
    cnpjInput.classList.remove('border-green-500', 'border-ember-500');
    setFeedback('', 'text-neutral-500');

    const digits = cnpjInput.value.replace(/\D/g, '');
    clearTimeout(debounceTimer);
    if (digits.length !== 14) return;

    debounceTimer = setTimeout(async () => {
      setFeedback('Validando CNPJ...', 'text-neutral-500');
      try {
        const res = await fetch(`https://api.insomnium.com.br/validar_cnpj/${digits}`);
        const data = await res.json().catch(() => null);
        const valido = res.ok && !(data && data.valido === false);
        if (valido) {
          cnpjInput.classList.add('border-green-500');
          setFeedback('CNPJ válido', 'text-green-500');
        } else {
          cnpjInput.classList.add('border-ember-500');
          setFeedback('CNPJ inválido', 'text-ember-400');
        }
      } catch (err) {
        setFeedback('Não foi possível validar agora', 'text-neutral-500');
      }
    }, 500);
  });
}

// --- Flashlight effect ---
const grid = document.getElementById('flashlight-grid');
if (grid) grid.addEventListener('mousemove', (e) => {
  grid.querySelectorAll('.flashlight-card').forEach(card => {
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mouse-x', (e.clientX - r.left) + 'px');
    card.style.setProperty('--mouse-y', (e.clientY - r.top) + 'px');
  });
});
