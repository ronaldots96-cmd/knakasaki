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

// --- WhatsApp: máscara de exibição + valor normalizado p/ webhook (DDDNUMERO, sem código do país) ---
const whatsappInput = document.getElementById('whatsapp-input');
const whatsappNormalized = document.getElementById('whatsapp-normalized');
const whatsappError = document.getElementById('whatsapp-error');
const WHATSAPP_ERROR_MSG = 'Informe um WhatsApp válido com DDD, no formato (31) 98765-4321.';

const maskWhatsapp = (digits) => {
  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

if (whatsappInput && whatsappNormalized) {
  whatsappInput.addEventListener('input', () => {
    const digits = whatsappInput.value.replace(/\D/g, '').slice(0, 11);
    whatsappInput.value = maskWhatsapp(digits);
    whatsappNormalized.value = digits.length === 11 ? digits : '';

    if (whatsappError && !whatsappError.classList.contains('hidden')) {
      whatsappInput.classList.remove('border-red-500');
      whatsappError.classList.add('hidden');
    }
  });
}

// --- Envio do formulário: valida, envia ao webhook e exibe confirmação ---
const CONTACT_WEBHOOK_URL = 'https://n8n.v4lisboatech.com.br/webhook/613da106-3c12-429e-a53f-a3761fd5a695';
const contactForm = document.getElementById('contact-form');
const contactFormFields = document.getElementById('contact-form-fields');
const contactFormSuccess = document.getElementById('contact-form-success');
const contactFormError = document.getElementById('contact-form-error');
const contactSubmitBtn = document.getElementById('contact-submit-btn');
const contactSubmitLabel = document.getElementById('contact-submit-label');

if (contactForm && whatsappInput && whatsappError) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (contactFormError) contactFormError.classList.add('hidden');

    if (!contactForm.checkValidity()) {
      contactForm.reportValidity();
      return;
    }

    const digits = whatsappInput.value.replace(/\D/g, '');
    if (digits.length !== 11) {
      whatsappInput.classList.add('border-red-500');
      whatsappError.textContent = WHATSAPP_ERROR_MSG;
      whatsappError.classList.remove('hidden');
      whatsappInput.focus();
      return;
    }
    whatsappInput.classList.remove('border-red-500');
    whatsappError.classList.add('hidden');

    const marketplaces = Array.from(
      document.querySelectorAll('#marketplace-options input[name="marketplaces"]:checked')
    ).map((cb) => cb.value);

    const payload = {
      nome: document.getElementById('name-input').value,
      cnpj: cnpjInput ? cnpjInput.value : '',
      whatsapp: whatsappNormalized.value,
      email: document.getElementById('email-input').value,
      ja_vende_marketplace: marketplaceSelect.value,
      marketplaces,
      mensagem: document.getElementById('message-input').value,
    };

    if (contactSubmitBtn) contactSubmitBtn.disabled = true;
    if (contactSubmitLabel) contactSubmitLabel.textContent = 'Enviando...';

    try {
      await fetch(CONTACT_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (contactFormFields) contactFormFields.classList.add('hidden');
      if (contactFormSuccess) {
        contactFormSuccess.classList.remove('hidden');
        contactFormSuccess.classList.add('flex');
      }
    } catch (err) {
      if (contactFormError) {
        contactFormError.textContent = 'Não foi possível enviar agora. Tente novamente em instantes.';
        contactFormError.classList.remove('hidden');
      }
    } finally {
      if (contactSubmitBtn) contactSubmitBtn.disabled = false;
      if (contactSubmitLabel) contactSubmitLabel.textContent = 'Falar com um especialista';
    }
  });
}

// --- Já vende em marketplace? (libera checkboxes ao marcar "Sim") ---
const marketplaceSelect = document.getElementById('marketplace-select');
const marketplaceOptions = document.getElementById('marketplace-options');
if (marketplaceSelect && marketplaceOptions) {
  marketplaceSelect.addEventListener('change', () => {
    const showOptions = marketplaceSelect.value === 'sim';
    marketplaceOptions.classList.toggle('hidden', !showOptions);
    if (!showOptions) {
      marketplaceOptions.querySelectorAll('input[type="checkbox"]').forEach((cb) => { cb.checked = false; });
    }
  });
}

// --- CNPJ: máscara e validação local (dígito verificador, módulo 11) ---
const isValidCNPJ = (value) => {
  const digits = value.replace(/\D/g, '');
  if (digits.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(digits)) return false; // rejeita sequências repetidas (ex: 00000000000000)

  const calcCheckDigit = (base) => {
    const weights = base.length === 12
      ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
      : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const sum = base.split('').reduce((acc, d, i) => acc + Number(d) * weights[i], 0);
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const base12 = digits.slice(0, 12);
  const digit1 = calcCheckDigit(base12);
  const base13 = base12 + String(digit1);
  const digit2 = calcCheckDigit(base13);

  return digits === base13 + String(digit2);
};

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
    cnpjFeedback.className = 'mt-1 text-xs ' + color + (text ? ' block' : ' hidden');
  };

  cnpjInput.addEventListener('input', () => {
    cnpjInput.value = maskCnpj(cnpjInput.value);
    cnpjInput.classList.remove('border-green-500', 'border-ember-500');

    const digits = cnpjInput.value.replace(/\D/g, '');
    if (digits.length < 14) {
      setFeedback('', 'text-neutral-500');
      return;
    }

    if (isValidCNPJ(digits)) {
      cnpjInput.classList.add('border-green-500');
      setFeedback('CNPJ válido', 'text-green-500');
    } else {
      cnpjInput.classList.add('border-ember-500');
      setFeedback('CNPJ inválido', 'text-ember-400');
    }
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
