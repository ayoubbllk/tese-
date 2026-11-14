(() => {
  document.documentElement.classList.add('js');

  /* En-tête : verre sombre dès qu'on quitte le haut de page */
  const hd = document.getElementById('hd');
  const onScroll = () => hd.classList.toggle('is-solid', window.scrollY > 40);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* Menu mobile */
  const toggle = hd.querySelector('.hd__toggle');
  const setMenu = (open) => {
    hd.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.textContent = open ? 'Fermer' : 'Menu';
  };
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  hd.querySelectorAll('.hd__nav a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && hd.classList.contains('is-open')) { setMenu(false); toggle.focus(); }
  });

  /* Apparitions au défilement */
  const els = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('is-in'));
  } else {
    const io = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
    }), { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    els.forEach((el) => io.observe(el));
  }

  /* Visionneuse des réalisations */
  const works = [...document.querySelectorAll('.work')];
  const viewer = document.getElementById('viewer');
  const vImg = document.getElementById('viewer-img');
  const vCap = document.getElementById('viewer-cap');
  let cur = 0, opener = null;
  const show = (i) => {
    cur = (i + works.length) % works.length;
    const img = works[cur].querySelector('img');
    vImg.src = img.src;
    vImg.alt = img.alt;
    vCap.textContent = `${works[cur].querySelector('b').textContent} — ${works[cur].querySelector('i').textContent}`;
  };
  works.forEach((w, i) => w.addEventListener('click', () => { opener = w; show(i); viewer.showModal(); }));
  viewer.querySelector('.viewer__close').addEventListener('click', () => viewer.close());
  viewer.querySelectorAll('.viewer__nav').forEach((b) => b.addEventListener('click', () => show(cur + Number(b.dataset.dir))));
  viewer.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') show(cur - 1);
    if (e.key === 'ArrowRight') show(cur + 1);
  });
  viewer.addEventListener('click', (e) => { if (e.target === viewer) viewer.close(); });
  viewer.addEventListener('close', () => opener && opener.focus());

  /* Formulaire : validation, puis ouverture de la messagerie avec le message prêt */
  const form = document.getElementById('form');
  const status = document.getElementById('form-status');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let first = null;
    form.querySelectorAll('[required]').forEach((f) => {
      const bad = !f.value.trim();
      f.setAttribute('aria-invalid', String(bad));
      if (bad && !first) first = f;
    });
    if (first) {
      status.textContent = 'Merci de compléter les champs soulignés en rouge.';
      status.classList.add('is-error');
      first.focus();
      return;
    }
    const d = Object.fromEntries(new FormData(form));
    const body = `Nom : ${d.nom}\nContact : ${d.contact}\nType de projet : ${d.type}\n\n${d.message}`;
    status.classList.remove('is-error');
    status.textContent = 'Votre messagerie s\'ouvre avec le message prêt à envoyer. Merci !';
    window.location.href = `mailto:contact@actwood.dz?subject=${encodeURIComponent(`Projet ${d.type} — ${d.nom}`)}&body=${encodeURIComponent(body)}`;
  });
  form.addEventListener('input', (e) => {
    if (e.target.value && e.target.value.trim()) e.target.setAttribute('aria-invalid', 'false');
  });

  document.getElementById('year').textContent = new Date().getFullYear();
})();
