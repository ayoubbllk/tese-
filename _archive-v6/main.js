(() => {
  const root = document.documentElement;
  const motion = root.classList.contains('motion');
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const range = (v, a, b) => clamp((v - a) / (b - a));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  const absTop = (el) => { let t = 0; while (el) { t += el.offsetTop; el = el.offsetParent; } return t; };

  let vw = innerWidth, vh = innerHeight, y = scrollY;

  /* ---------- Arche outrepassée : même tracé que le masque CSS (100 × 140) ---------- */
  const N = 48;
  const ARCH = [[5.5, 140]];
  for (let i = 0; i <= N; i++) {
    const a = (158 + 224 * i / N) * Math.PI / 180;
    ARCH.push([50 + 48 * Math.cos(a), 58 + 48 * Math.sin(a)]);
  }
  ARCH.push([94.5, 140]);
  const archN = ARCH.map(([x, yy]) => [x / 100, yy / 140]);
  // le même nombre de points, posés sur le pourtour d'un rectangle
  const SPRING = 76 / 140, SIDE = SPRING * 1.4, PERIM = SIDE * 2 + 1;
  const rectN = archN.map((_, i) => {
    if (i === 0) return [0, 1];
    if (i === archN.length - 1) return [1, 1];
    const s = (i - 1) / N * PERIM;
    if (s < SIDE) return [0, SPRING - s / 1.4];
    if (s < SIDE + 1) return [s - SIDE, 0];
    return [1, (s - SIDE - 1) / 1.4];
  });
  // forme intermédiaire : rectangle (t = 0) → arche (t = 1), dans une boîte donnée en fractions
  const morphPoints = (t, box = [0, 0, 1, 1], from = [0, 0, 1, 1]) => archN.map((p, i) => {
    const r = rectN[i];
    const x = lerp(from[0] + r[0] * from[2], box[0] + p[0] * box[2], t);
    const yy = lerp(from[1] + r[1] * from[3], box[1] + p[1] * box[3], t);
    return [x, yy];
  });
  const toPolygon = (pts) => `polygon(${pts.map(([x, yy]) => `${(x * 100).toFixed(3)}% ${(yy * 100).toFixed(3)}%`).join(',')})`;

  /* ---------- Vidéos (sans mouvement, on garde les photos et rien n'est téléchargé) ---------- */
  const videos = [];
  $$('video[data-video]').forEach((v) => {
    const src = v.dataset.video;
    if (!src || !motion) { v.remove(); return; }
    const item = { v, ready: false, loop: v.hasAttribute('loop') };
    v.addEventListener('loadeddata', () => {
      item.ready = true;
      v.classList.add('is-ready');
      // Safari n'affiche les images d'une vidéo pilotée au défilement qu'après une première lecture
      if (!item.loop) { const pr = v.play(); if (pr) pr.then(() => { v.pause(); dirty = true; }).catch(() => {}); }
      dirty = true;
    }, { once: true });
    // le film part du bois brut : en attendant qu'il charge, on montre sa première image
    // (la photo réelle revient si la vidéo ne se charge pas)
    const still = v.parentElement.querySelector('img[data-start]');
    if (still) { still.dataset.final = still.src; still.src = still.dataset.start; }
    v.addEventListener('error', () => { if (still) still.src = still.dataset.final; v.remove(); }, { once: true });
    item.load = () => { if (!v.src) { v.src = src; v.load(); } };
    videos.push(item);
    v._item = item;
  });
  const scrubTo = (v, frac) => {
    const it = v && v._item;
    if (!it || !it.ready || !v.duration) return false;
    const t = clamp(frac) * (v.duration - .05);
    if (!v.seeking && Math.abs(v.currentTime - t) > .015) v.currentTime = t;
    return true;
  };
  // boucles d'ambiance : lecture seulement à l'écran
  if ('IntersectionObserver' in window) {
    const vio = new IntersectionObserver((entries) => entries.forEach((en) => {
      const it = en.target._item;
      if (!it) return;
      if (en.isIntersecting) { it.load(); if (it.loop && motion) en.target.play().catch(() => {}); }
      else if (it.loop) en.target.pause();
    }), { rootMargin: '50% 0px' });
    videos.forEach((it) => vio.observe(it.v));
  } else videos.forEach((it) => it.load());

  /* ---------- En-tête ---------- */
  const hd = $('#hd');
  const toggle = $('.hd__toggle', hd);
  const setMenu = (open) => {
    hd.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.textContent = open ? 'Fermer' : 'Menu';
  };
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  $$('.hd__nav a', hd).forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && hd.classList.contains('is-open')) { setMenu(false); toggle.focus(); }
  });
  const progress = $('#progress');
  const chapter = $('#chapter'), chNum = $('#chapter-num'), chName = $('#chapter-name');
  let curChapter = '';
  const setChapter = (val) => {
    if (val === curChapter) return;
    curChapter = val;
    chapter.classList.toggle('is-on', !!val);
    if (val) { const [n, name] = val.split('|'); chNum.textContent = n; chName.textContent = name; }
  };

  /* ---------- Apparitions ---------- */
  const reveals = $$('.reveal');
  if (!motion || !('IntersectionObserver' in window)) reveals.forEach((el) => el.classList.add('is-in'));
  else {
    const io = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
    }), { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    reveals.forEach((el) => io.observe(el));
  }

  /* ---------- Éléments pilotés par le défilement ---------- */
  const hero = $('#top');
  const heroMedia = $('#hero-media');
  const heroInner = $('.hero-media__inner', heroMedia);
  const heroVeil = $('.hero-media__veil', heroMedia);
  const heroVideo = $('.hero-media__video', heroMedia);
  const heroPoster = $('.hero-media__poster', heroMedia);
  const heroRing = $('.hero-ring');
  const heroRingPoly = $('#hero-ring');
  const heroCap = $('.hero-cap');
  const heroCopy = $('.hero-copy');
  const heroSteps = $('.hero-steps');
  const heroStepLis = $$('li', heroSteps);
  const heroCue = $('.hero-cue');

  const parc = $('#parcours');
  const psteps = $$('.fstep', parc);
  const pcaps = $$('.pm__cap span', parc);
  const pbar = $('.ftext__bar i', parc);
  const plan = $('.film__layer--plan', parc);
  const planLines = $$('.plan-lines path', parc);
  const planHatch = $('.plan-hatch', parc);
  const planDims = $$('.plan-dims', parc);
  const pa = $('.pm__a', parc), pb = $('.pm__b', parc);
  const pvideo = $('.pm__video', parc);

  const cards = $$('.work');

  const band = $('#patrimoine');
  const bandVideo = $('.band__video', band);
  const slideEls = $$('[data-slide]');
  const filmEls = $$('.film[data-open]');
  const scrubEls = $$('.film[data-scrub]');

  const m = { scenes: {}, slide: [], films: [], scrubs: [], markers: [], docH: 0, heroBox: null };
  const sm = { hero: 0, parc: 0 };

  const measure = () => {
    vw = innerWidth; vh = innerHeight;

    const scene = (el) => ({ top: absTop(el), len: Math.max(1, el.offsetHeight - vh) });
    m.scenes.hero = scene(hero);
    m.scenes.parc = scene(parc);
    m.scenes.band = scene(band);
    // films non épinglés : ils avancent pendant que leur bloc traverse l'écran
    m.scrubs = scrubEls.map((el) => ({
      img: $('img', el), video: $('video', el), top: absTop(el.parentElement), h: el.parentElement.offsetHeight,
      // image collante (moitié d'écran) : le film se joue pendant qu'elle reste à l'écran
      sticky: getComputedStyle(el).position === 'sticky' && el.parentElement.offsetHeight > el.offsetHeight + vh * .3,
    }));

    m.slide = slideEls.map((el) => ({ el, top: absTop(el), dir: +(el.dataset.slide || 1) }));

    // chaque film s'ouvre d'une arche centrée, à la taille de son cadre
    m.films = filmEls.map((el) => {
      const sc = el.closest('.scene');
      const w = el.offsetWidth, h = el.offsetHeight;
      let bh = h * .8, bw = bh / 1.4;
      if (bw > w * .7) { bw = w * .7; bh = bw * 1.4; }
      return {
        el, inner: $('.film__inner', el), last: -1, band: !!el.closest('#patrimoine'),
        top: sc ? absTop(sc) : absTop(el.parentElement),
        box: [(w - bw) / 2 / w, (h - bh) / 2 / h + .02, bw / w, bh / h],
      };
    });

    m.markers = [
      { top: absTop($('#atelier')), v: 'I|L\'écoute' },
      { top: absTop($('#savoir-faire')), v: 'II|Savoir-faire' },
      { top: m.scenes.parc.top, v: 'III|Méthode' },
      { top: m.scenes.band.top, v: '|Patrimoine' },
      { top: absTop($('#realisations')), v: 'IV|Réalisations' },
      { top: absTop($('#pour-qui')), v: 'V|Chez vous' },
    ];
    m.docH = document.documentElement.scrollHeight;

    // boîte finale de l'arche d'ouverture (en fractions de l'écran)
    m.heroBox = null;
    m.heroCap = false;
    if (motion) {
      const hdH = 84;
      if (vw >= 900) {
        const wrapRight = Math.min(vw, (vw + 1400) / 2) - parseFloat(getComputedStyle($('.wrap')).paddingRight);
        let bh = Math.min(vh * .76, vh - hdH - 72);
        let bw = bh * 100 / 140;
        if (bw > vw * .36) { bw = vw * .36; bh = bw * 1.4; }
        const top = hdH + (vh - hdH - bh) / 2 + 6;
        m.heroBox = [(wrapRight - bw) / vw, top / vh, bw / vw, bh / vh];
      } else {
        const top = heroCopy.offsetTop + heroCopy.offsetHeight + 28;
        const bh = vh - top - 28;
        if (bh >= 220) {
          const bw = Math.min(bh * 100 / 140, vw - 2 * 20);
          m.heroBox = [(vw - bw) / 2 / vw, top / vh, bw / vw, (bw * 1.4) / vh];
        }
      }
      if (m.heroBox) {
        const [bx, by, bw, bh] = m.heroBox;
        const ox = 14 / vw, oy = 14 / vh;
        heroRingPoly.setAttribute('points', morphPoints(1, [bx - ox, by - oy, bw + 2 * ox, bh + 2 * oy])
          .map(([x, yy]) => `${(x * 100).toFixed(3)},${(yy * 100).toFixed(3)}`).join(' '));
        // légende sous l'arche, seulement s'il reste la place
        const capTop = (by + bh) * vh + 30;
        m.heroCap = capTop + 20 < vh;
        heroCap.style.transform = `translate(${(bx * vw).toFixed(1)}px, ${capTop.toFixed(1)}px)`;
      }
    }
    dirty = true;
  };

  /* ---------- Ouverture ---------- */
  const updateHero = (p) => {
    // 0 → .6 : le film défile ; .6 → .9 : le cadre se referme en arche
    const film = range(p, 0, .6);
    const t = m.heroBox ? ease(range(p, .6, .9)) : 0;
    // sans film, la photo d'atelier avance lentement vers nous
    heroPoster.style.transform = scrubTo(heroVideo, film) ? '' : `scale(${1 + .12 * film})`;

    if (m.heroBox) {
      const box = m.heroBox;
      heroMedia.style.clipPath = t > 0 ? toPolygon(morphPoints(t, box)) : '';
      const sEnd = Math.max(box[2], box[3]) * 1.1;
      const s = lerp(1, sEnd, t);
      const tx = lerp(0, (box[0] + box[2] / 2) * vw - sEnd * vw / 2, t);
      const ty = lerp(0, (box[1] + box[3] / 2) * vh - sEnd * vh / 2, t);
      heroInner.style.transform = t > 0 ? `translate3d(${tx}px, ${ty}px, 0) scale(${s})` : '';
      heroRing.style.opacity = range(t, .85, 1);
      heroCap.style.opacity = m.heroCap ? range(t, .9, 1) : 0;
    }
    heroVeil.style.opacity = 1 - range(t, 0, .7);

    // le texte s'efface pendant le film puis revient à côté de l'arche
    const out = range(p, .05, .17);
    const back = m.heroBox ? range(t, .5, 1) : range(p, .62, .82);
    let o, dy;
    if (back > 0) { o = back; dy = (1 - back) * 24; } else { o = 1 - out; dy = -40 * out; }
    heroCopy.style.opacity = o;
    heroCopy.style.transform = `translate3d(0, ${dy}px, 0)`;
    heroCopy.classList.toggle('is-ink', t > .5);
    heroCopy.style.pointerEvents = o < .4 ? 'none' : '';

    heroSteps.style.opacity = range(p, .1, .18) * (1 - range(p, .56, .64));
    const idx = film < .34 ? 0 : film < .7 ? 1 : 2;
    heroStepLis.forEach((li, i) => li.classList.toggle('is-on', i === idx));
    heroCue.classList.toggle('is-off', p > .02);
    return t;
  };

  /* ---------- Les cadres-films s'ouvrent d'une arche en arrivant à l'écran ---------- */
  const updateFilms = () => {
    m.films.forEach((f) => {
      const t = 1 - ease(range(y + vh - f.top, vh * .1, vh * .9));
      if (Math.abs(t - f.last) < .0008) return;
      f.last = t;
      f.el.style.clipPath = t > .001 ? toPolygon(morphPoints(t, f.box)) : '';
      f.inner.style.transform = t > .001 ? `scale(${(1 + .14 * t).toFixed(4)})` : '';
      if (f.band) band.classList.toggle('is-open', t < .12);
    });
  };

  /* ---------- Films non épinglés : ils avancent pendant que leur bloc traverse l'écran ---------- */
  const updateScrubs = () => {
    m.scrubs.forEach((f) => {
      if (y + vh < f.top || y > f.top + f.h) return;
      // l'ouvrage est terminé quand son cadre atteint le haut de l'écran (ou, s'il reste collé à l'écran, avant la fin du texte)
      const d = y + vh - f.top;
      const k = f.sticky ? range(d, vh * .55, f.h) : range(d, vh * .2, vh * .95);
      // sans film, la photo recule doucement dans son cadre
      if (!scrubTo(f.video, k)) f.img.style.transform = `scale(${(1.18 - .18 * k).toFixed(4)})`;
    });
  };

  /* ---------- Du dessin à la pose ---------- */
  const updateParcours = (p) => {
    const step = p < .34 ? 0 : p < .68 ? 1 : 2;
    psteps.forEach((li, i) => li.classList.toggle('is-on', i === step));
    pcaps.forEach((s, i) => s.classList.toggle('is-on', i === step - 1));
    pbar.style.transform = `scaleX(${p})`;

    // le plan se trace
    const d = range(p, .03, .24);
    planLines.forEach((path, i) => { path.style.strokeDashoffset = 1 - range(d, i * .12, i * .12 + .52); });
    planHatch.style.opacity = range(p, .15, .25);
    planDims.forEach((g) => { g.style.opacity = range(p, .19, .27); });

    // puis se retire, de bas en haut, sur les façades à l'atelier
    const w = ease(range(p, .28, .4));
    plan.style.clipPath = w > 0 ? `inset(0 0 ${(w * 100).toFixed(2)}% 0)` : '';
    plan.style.visibility = w >= 1 ? 'hidden' : '';

    // les façades deviennent le buffet posé
    const v = range(p, .4, .92);
    if (!scrubTo(pvideo, v)) {
      const x = range(v, .3, .75);
      const blur = Math.sin(Math.PI * x) * 2.5;
      pa.style.opacity = 1 - x;
      pa.style.transform = `scale(${lerp(1.08, 1, w) + .05 * x})`;
      pb.style.opacity = x;
      pb.style.transform = `scale(${1.05 - .05 * range(v, .3, 1)})`;
      const f = blur > .2 ? `blur(${blur.toFixed(2)}px)` : '';
      pa.style.filter = f; pb.style.filter = f;
    }
    return step;
  };

  /* ---------- Boucle ---------- */
  let dirty = true;
  let lastY = -1;
  const sceneP = (s) => clamp((y - s.top) / s.len);

  const frame = () => {
    requestAnimationFrame(frame);
    y = scrollY;
    let moving = dirty || y !== lastY;
    dirty = false;
    lastY = y;

    const H = m.scenes.hero, P = m.scenes.parc, B = m.scenes.band;
    const targets = { hero: sceneP(H), parc: sceneP(P) };
    for (const k in targets) {
      const diff = targets[k] - sm[k];
      if (Math.abs(diff) > .0004) { sm[k] += diff * .14; moving = true; } else if (diff) { sm[k] = targets[k]; moving = true; }
    }
    if (!moving && !videos.some((it) => it.v.seeking)) return;

    const inView = (top, len) => y + vh > top - vh * .2 && y < top + len + vh * 1.2;
    let heroT = 1;
    if (inView(H.top, H.len)) heroT = updateHero(sm.hero);
    if (inView(P.top, P.len)) updateParcours(sm.parc);
    // la caméra glisse dans la cuisine du moment où elle apparaît jusqu'à la fin de la scène
    if (inView(B.top, B.len)) scrubTo(bandVideo, range(y + vh - B.top, vh * .1, B.len + vh));
    updateScrubs();
    updateFilms();
    m.slide.forEach((d) => { d.el.style.backgroundPositionX = `${((y - d.top) * .35 * d.dir).toFixed(1)}px`; });

    // en-tête
    const heroEnd = H.top + H.len;
    hd.classList.toggle('is-light', y < heroEnd && heroT < .02 && !heroCopy.classList.contains('is-ink') && !hd.classList.contains('is-open'));
    hd.classList.toggle('is-solid', y > heroEnd - 10);
    progress.style.transform = `scaleX(${clamp(y / Math.max(1, m.docH - vh))})`;
    let ch = '';
    m.markers.forEach((mk) => { if (y + vh * .45 >= mk.top) ch = mk.v; });
    setChapter(ch);
  };

  if (motion) {
    measure();
    requestAnimationFrame(frame);
    let rz;
    addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(measure, 120); });
    addEventListener('load', measure);
    if (document.fonts) document.fonts.ready.then(measure);
    if ('ResizeObserver' in window) {
      let last = 0;
      new ResizeObserver(() => { const h = document.body.offsetHeight; if (h !== last) { last = h; measure(); } }).observe(document.body);
    }
    // la vidéo d'ouverture se charge tout de suite, les autres à l'approche
    if (heroVideo && heroVideo._item) heroVideo._item.load();
    if (pvideo && pvideo._item) {
      const pio = new IntersectionObserver((en) => { if (en[0].isIntersecting) { pvideo._item.load(); pio.disconnect(); } }, { rootMargin: '100% 0px' });
      pio.observe(parc);
    }
  } else {
    const onScroll = () => hd.classList.toggle('is-solid', scrollY > 40);
    onScroll();
    addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- Visionneuse des réalisations ---------- */
  const viewer = $('#viewer');
  const vImg = $('#viewer-img');
  const vCap = $('#viewer-cap');
  let cur = 0, opener = null;
  const show = (i) => {
    cur = (i + cards.length) % cards.length;
    const img = $('img', cards[cur]);
    vImg.src = img.src;
    vImg.alt = img.alt;
    vCap.textContent = `${$('b', cards[cur]).textContent} — ${$('i', cards[cur]).textContent}`;
  };
  cards.forEach((w, i) => w.addEventListener('click', () => { opener = w; show(i); viewer.showModal(); }));
  $('.viewer__close', viewer).addEventListener('click', () => viewer.close());
  $$('.viewer__nav', viewer).forEach((b) => b.addEventListener('click', () => show(cur + Number(b.dataset.dir))));
  viewer.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') show(cur - 1);
    if (e.key === 'ArrowRight') show(cur + 1);
  });
  viewer.addEventListener('click', (e) => { if (e.target === viewer) viewer.close(); });
  viewer.addEventListener('close', () => opener && opener.focus({ preventScroll: true }));

  /* ---------- Formulaire : validation, puis ouverture de la messagerie avec le message prêt ---------- */
  const form = $('#form');
  const status = $('#form-status');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let first = null;
    $$('[required]', form).forEach((f) => {
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

  $('#year').textContent = new Date().getFullYear();
})();
