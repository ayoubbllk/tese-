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
  const hdH = () => parseFloat(getComputedStyle(root).getPropertyValue('--hd')) || 80;

  let vw = innerWidth, vh = innerHeight, y = scrollY;
  let dirty = true;

  /* ---------- Vidéos (sans mouvement, on garde les photos et rien n'est téléchargé) ---------- */
  const videos = [];
  $$('video[data-video]').forEach((v) => {
    const src = v.dataset.video;
    if (!src || !motion) { v.remove(); return; }
    const item = { v, ready: false, loop: v.hasAttribute('loop'), auto: v.hasAttribute('data-autoplay') };
    v.addEventListener('loadeddata', () => {
      item.ready = true;
      v.classList.add('is-ready');
      if (item.auto) { if (item.seen) v.play().catch(() => {}); }
      // Safari n'affiche les images d'une vidéo pilotée au défilement qu'après une première lecture
      else if (!item.loop) { const pr = v.play(); if (pr) pr.then(() => { v.pause(); dirty = true; }).catch(() => {}); }
      dirty = true;
    }, { once: true });
    // en attendant la vidéo, on montre sa première image (la photo réelle revient si elle ne se charge pas)
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
  if ('IntersectionObserver' in window) {
    const vio = new IntersectionObserver((entries) => entries.forEach((en) => {
      const it = en.target._item;
      if (!it) return;
      if (en.isIntersecting) { it.load(); if (it.loop && motion) en.target.play().catch(() => {}); }
      else if (it.loop) en.target.pause();
    }), { rootMargin: '50% 0px' });
    videos.forEach((it) => vio.observe(it.v));
  } else videos.forEach((it) => it.load());
  // le film d'ouverture se charge tout de suite, se joue une fois et reste sur le moucharabieh
  const heroVideo = $('.hero__video');
  if (heroVideo && heroVideo._item) {
    const it = heroVideo._item;
    it.load();
    // sur téléphone, le cadre est sous le texte : le film attend d'être bien visible pour se jouer
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((en, obs) => {
        if (!en[0].isIntersecting) return;
        it.seen = true;
        if (it.ready) heroVideo.play().catch(() => {});
        obs.disconnect();
      }, { threshold: .45 }).observe(heroVideo.parentElement);
    } else it.seen = true;
  }

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

  /* ---------- Bouton « remplissage » : un disque part du pointeur, les lettres roulent ---------- */
  $$('.b-fill').forEach((b) => {
    const a = b.textContent.trim(), h = b.dataset.hover || a;
    const row = (t) => `<span class="row" aria-hidden="true">${[...t].map((c, i) => `<span style="--i:${i}">${c === ' ' ? '&nbsp;' : c}</span>`).join('')}</span>`;
    b.setAttribute('aria-label', a);
    b.innerHTML = `<span class="lbl">${row(a)}${row(h)}</span>`;
    if (!motion) return;
    const disc = (e, out) => {
      const r = b.getBoundingClientRect(), x = e.clientX - r.left, yy = e.clientY - r.top;
      const rad = Math.max(Math.hypot(x, yy), Math.hypot(r.width - x, yy), Math.hypot(x, r.height - yy), Math.hypot(r.width - x, r.height - yy)) + 2;
      const d = document.createElement('i');
      d.className = `dot${out ? ' out' : ''}`;
      Object.assign(d.style, { left: `${x - rad}px`, top: `${yy - rad}px`, width: `${rad * 2}px`, height: `${rad * 2}px` });
      b.prepend(d);
      requestAnimationFrame(() => requestAnimationFrame(() => { d.style.transform = 'scale(1)'; }));
      if (out) setTimeout(() => { if (!b.matches(':hover')) $$('.dot', b).forEach((n) => n.remove()); }, 600);
    };
    b.addEventListener('mouseenter', (e) => { $$('.dot', b).forEach((n) => n.remove()); disc(e, false); });
    b.addEventListener('mouseleave', (e) => disc(e, true));
  });

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
  const parc = $('#methode');
  const psteps = $$('.fstep', parc);
  const pcaps = $$('.pm__cap span', parc);
  const plan = $('.film__layer--plan', parc);
  const planLines = $$('.plan-lines path', parc);
  const planHatch = $('.plan-hatch', parc);
  const planDims = $$('.plan-dims', parc);
  const pa = $('.pm__a', parc), pb = $('.pm__b', parc);
  const pvideo = $('.pm__video', parc);
  const band = $('#patrimoine');
  const bandVideo = $('.band__video', band);
  const filmEls = $$('.film[data-open]');
  const scrubEls = $$('.film[data-scrub]');
  const tess = $('#metiers');

  const m = { scenes: {}, films: [], scrubs: [], docH: 0, tess: null };
  const sm = { parc: 0 };

  const measure = () => {
    vw = innerWidth; vh = innerHeight;
    const scene = (el) => ({ top: absTop(el), len: Math.max(1, el.offsetHeight - vh) });
    m.scenes.parc = scene(parc);
    m.scenes.band = scene(band);
    m.scrubs = scrubEls.map((el) => ({
      img: $('img', el), video: $('video', el), top: absTop(el.parentElement), h: el.parentElement.offsetHeight,
      // image collante (moitié d'écran) : le film se joue pendant qu'elle reste à l'écran
      sticky: getComputedStyle(el).position === 'sticky' && el.parentElement.offsetHeight > el.offsetHeight + vh * .3,
    }));
    m.films = filmEls.map((el) => {
      const sc = el.closest('.scene');
      return { el, inner: $('.film__inner', el), last: -1, band: !!el.closest('#patrimoine'), top: sc ? absTop(sc) : absTop(el.parentElement) };
    });
    m.tess = { top: absTop(tess), h: tess.offsetHeight, stage: $('.tess__stage', tess).offsetHeight };
    m.docH = document.documentElement.scrollHeight;
    dirty = true;
  };

  /* ---------- Les cadres s'ouvrent en arrivant à l'écran ---------- */
  const updateFilms = () => {
    m.films.forEach((f) => {
      const t = 1 - ease(range(y + vh - f.top, vh * .05, vh * .75));
      if (Math.abs(t - f.last) < .0008) return;
      f.last = t;
      f.el.style.clipPath = t > .001 ? `inset(${(t * 12).toFixed(2)}% ${(t * 9).toFixed(2)}% round ${(6 + t * 10).toFixed(1)}px)` : '';
      f.inner.style.transform = t > .001 ? `scale(${(1 + .1 * t).toFixed(4)})` : '';
      f.el.style.setProperty('--shut', t.toFixed(3));
      if (f.band) band.classList.toggle('is-open', t < .12);
    });
  };

  /* ---------- Films qui avancent avec le défilement ---------- */
  const updateScrubs = () => {
    m.scrubs.forEach((f) => {
      if (y + vh < f.top || y > f.top + f.h) return;
      const d = y + vh - f.top;
      const k = f.sticky ? range(d, vh * .55, f.h) : range(d, vh * .2, vh * .95);
      if (!scrubTo(f.video, k)) f.img.style.transform = `scale(${(1.12 - .12 * k).toFixed(4)})`;
    });
  };

  /* ---------- Méthode : du dessin à la pose ---------- */
  const updateParcours = (p, draw) => {
    const step = p < .34 ? 0 : p < .68 ? 1 : 2;
    psteps.forEach((li, i) => li.classList.toggle('is-on', i === step));
    pcaps.forEach((s, i) => s.classList.toggle('is-on', i === step));
    // le plan se trace
    const d = range(draw, 0, .75);
    planLines.forEach((path, i) => { path.style.strokeDashoffset = 1 - range(d, i * .12, i * .12 + .52); });
    planHatch.style.opacity = range(draw, .55, .85);
    planDims.forEach((g) => { g.style.opacity = range(draw, .7, 1); });
    // puis se retire, de bas en haut, sur les façades à l'atelier
    const w = ease(range(p, .28, .4));
    plan.style.clipPath = w > 0 ? `inset(0 0 ${(w * 100).toFixed(2)}% 0)` : '';
    plan.style.visibility = w >= 1 ? 'hidden' : '';
    // les façades deviennent le buffet posé
    const v = range(p, .4, .92);
    if (!scrubTo(pvideo, v)) {
      const x = range(v, .3, .75);
      pa.style.opacity = 1 - x;
      pa.style.transform = `scale(${lerp(1.08, 1, w) + .05 * x})`;
      pb.style.opacity = x;
      pb.style.transform = `scale(${1.05 - .05 * range(v, .3, 1)})`;
    }
  };

  /* ---------- Métiers : la liste, la photo et le texte avancent ensemble ---------- */
  const tLayers = $$('.tess__layer', tess);
  const tItems = $$('.tess__item', tess);
  const tBtns = $$('.tess__list button', tess);
  const tBars = $$('.tess__progress span', tess);
  const tCaps = $$('.tess__cap span', tess);
  let tCur = -1;
  const setTess = (i) => {
    if (i === tCur) return;
    tCur = i;
    tLayers.forEach((l, k) => { l.classList.toggle('is-shown', k <= i); l.classList.toggle('is-top', k === i); });
    tItems.forEach((it, k) => { it.classList.toggle('is-on', k === i); it.classList.toggle('is-before', k < i); it.setAttribute('aria-hidden', String(k !== i)); });
    tBtns.forEach((b, k) => { b.classList.toggle('is-on', k === i); b.setAttribute('aria-pressed', String(k === i)); });
    tBars.forEach((b, k) => b.classList.toggle('is-on', k <= i));
    tCaps.forEach((c, k) => c.classList.toggle('is-on', k === i));
  };
  setTess(0);
  const updateTess = () => {
    const T = m.tess;
    const travel = T.h - T.stage;
    const t = travel > 0 ? clamp((y + hdH() - T.top) / travel) : 0;
    setTess(Math.min(tItems.length - 1, Math.floor(t * tItems.length)));
  };
  tBtns.forEach((b, i) => b.addEventListener('click', () => {
    if (!motion) { setTess(i); return; }
    const T = m.tess;
    const travel = T.h - T.stage;
    window.scrollTo({ top: T.top - hdH() + travel * ((i + .5) / tItems.length), behavior: 'smooth' });
  }));

  /* ---------- Boucle ---------- */
  let lastY = -1;
  const sceneP = (s) => clamp((y - s.top) / s.len);
  const frame = () => {
    requestAnimationFrame(frame);
    y = scrollY;
    let moving = dirty || y !== lastY;
    dirty = false;
    lastY = y;
    const P = m.scenes.parc, B = m.scenes.band;
    const diff = sceneP(P) - sm.parc;
    if (Math.abs(diff) > .0004) { sm.parc += diff * .14; moving = true; } else if (diff) { sm.parc += diff; moving = true; }
    if (!moving && !videos.some((it) => it.v.seeking)) return;

    const inView = (top, len) => y + vh > top - vh * .2 && y < top + len + vh * 1.2;
    // le plan se trace dès que la scène entre à l'écran, pas seulement une fois épinglée
    if (inView(P.top, P.len)) updateParcours(sm.parc, range(y - P.top, -vh * .75, P.len * .22));
    if (inView(B.top, B.len)) scrubTo(bandVideo, range(y + vh - B.top, vh * .1, B.len + vh));
    updateScrubs();
    updateFilms();
    updateTess();
    hd.classList.toggle('is-solid', y > 10);
    progress.style.transform = `scaleX(${clamp(y / Math.max(1, m.docH - vh))})`;
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
    if (pvideo && pvideo._item) {
      const pio = new IntersectionObserver((en) => { if (en[0].isIntersecting) { pvideo._item.load(); pio.disconnect(); } }, { rootMargin: '100% 0px' });
      pio.observe(parc);
    }
  } else {
    const onScroll = () => hd.classList.toggle('is-solid', scrollY > 10);
    onScroll();
    addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- Visionneuse des réalisations ---------- */
  const cards = $$('.work');
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
  const openViewer = (i, from) => { opener = from; show(i); viewer.showModal(); };
  cards.forEach((w, i) => w.addEventListener('click', () => openViewer(i, w)));
  $('.viewer__close', viewer).addEventListener('click', () => viewer.close());
  $$('.viewer__nav', viewer).forEach((b) => b.addEventListener('click', () => show(cur + Number(b.dataset.dir))));
  viewer.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') show(cur - 1);
    if (e.key === 'ArrowRight') show(cur + 1);
  });
  viewer.addEventListener('click', (e) => { if (e.target === viewer) viewer.close(); });
  viewer.addEventListener('close', () => opener && opener.focus({ preventScroll: true }));

  /* ---------- Réalisations : le carrousel en profondeur ----------
     Les photos sont posées en arc dans l'espace : celle du centre de face, les autres reculent,
     pivotent et se floutent. Un ressort amène le carrousel sur la photo choisie. */
  const depth = $('#depth');
  if (motion && depth) {
    const stage = $('.depth__stage', depth);
    const capB = $('.depth__cap b'), capS = $('.depth__mat'), capN = $('.depth__n');
    const thumbs = $('.depth__thumbs');
    const items = cards.map((c) => ({ src: $('img', c).getAttribute('src'), alt: $('img', c).alt, name: $('b', c).textContent, mat: $('i', c).textContent }));
    const n = items.length;
    cards.forEach((c) => c.setAttribute('tabindex', '-1'));
    const els = items.map((it, i) => {
      const card = document.createElement('div');
      card.className = 'depth__card';
      card.dataset.i = i;
      card.innerHTML = `<div class="depth__frame"><img data-src="${it.src}" alt="" draggable="false"></div><div class="depth__mirror"><img data-src="${it.src}" alt="" draggable="false"></div>`;
      stage.appendChild(card);
      return card;
    });
    new IntersectionObserver((en, obs) => {
      if (!en[0].isIntersecting) return;
      $$('img[data-src]', stage).forEach((img) => { img.src = img.dataset.src; });
      obs.disconnect();
    }, { rootMargin: '120% 0px' }).observe(depth);

    const tBtnsD = items.map((it) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', `Afficher : ${it.name}`);
      b.innerHTML = `<img src="${it.src}" alt="" loading="lazy">`;
      thumbs.appendChild(b);
      return b;
    });
    const C = { w: 0, h: 0, sideScale: .66, spacing: 40, depth: 150, curve: 42, maxBlur: 5 };
    const layout = () => {
      const H = depth.clientHeight;
      C.h = Math.round(H * (innerWidth < 760 ? .7 : .66));
      C.w = Math.round(C.h * .76);
      C.spacing = innerWidth < 760 ? 14 : 40;
      depth.style.perspective = `${innerWidth < 760 ? 900 : 1300}px`;
      stage.style.width = `${C.w}px`;
      stage.style.height = `${C.h}px`;
      stage.style.marginLeft = `${-C.w / 2}px`;
      stage.style.marginTop = `${-C.h / 2}px`;
      els.forEach((el) => {
        el.style.width = `${C.w}px`; el.style.height = `${C.h}px`;
        el.lastChild.style.height = `${C.h * .5}px`;
      });
      S.dirty = true;
    };
    const xFor = (o) => {
      const s = Math.sign(o), a = Math.abs(o);
      const first = C.w * .46 + C.spacing, step = C.w * C.sideScale * .62;
      return a <= 1 ? o * first : s * (first + (a - 1) * step);
    };
    const place = (p) => {
      els.forEach((el, i) => {
        const o = i - p, a = Math.abs(o);
        const z = -Math.min(a, 4) * C.depth;
        const r = -clamp(o, -1, 1) * C.curve;
        const s = 1 - (1 - C.sideScale) * Math.min(a, 1);
        const op = 1 - Math.min(Math.max(a - 3, 0) / 1.3, 1);
        const blur = Math.min(Math.max(a - .35, 0) * 2.6, C.maxBlur);
        el.style.transform = `translateX(${xFor(o).toFixed(2)}px) translateZ(${z.toFixed(2)}px) rotateY(${r.toFixed(2)}deg) scale(${s.toFixed(4)})`;
        el.style.opacity = op.toFixed(3);
        el.style.filter = blur > .05 ? `blur(${blur.toFixed(2)}px)` : 'none';
        el.style.zIndex = String(Math.round(1000 - a * 10));
        el.style.visibility = op <= 0 ? 'hidden' : '';
      });
    };

    // ressort (raideur 170, amortissement 34) entre la position voulue et la position affichée
    const S = { target: 0, pos: 0, vel: 0, active: -1, raf: 0, last: 0, dirty: true };
    const caption = (i) => {
      if (i === S.active) return;
      S.active = i;
      capB.textContent = items[i].name.replace(/-/g, '‑'); // trait d'union insécable
      capS.textContent = items[i].mat;
      capN.textContent = `${String(i + 1).padStart(2, '0')} / ${String(n).padStart(2, '0')}`;
      tBtnsD.forEach((b, k) => { b.classList.toggle('is-on', k === i); b.setAttribute('aria-current', String(k === i)); });
    };
    const tick = (t) => {
      S.raf = 0;
      const dt = Math.min(.032, (t - (S.last || t)) / 1000) || .016;
      S.last = t;
      for (let k = 0; k < 4; k++) {
        const h = dt / 4;
        const acc = 170 * (S.target - S.pos) - 34 * S.vel;
        S.vel += acc * h;
        S.pos += S.vel * h;
      }
      const still = Math.abs(S.target - S.pos) < .001 && Math.abs(S.vel) < .001;
      if (still) { S.pos = S.target; S.vel = 0; }
      place(S.pos);
      if (!still || S.dirty) { S.dirty = false; S.raf = requestAnimationFrame(tick); } else S.last = 0;
    };
    const kick = () => { if (!S.raf) S.raf = requestAnimationFrame(tick); };
    const clampT = (v) => clamp(v, 0, n - 1);
    const commit = (v) => { S.target = clampT(Math.round(v)); caption(S.target); kick(); };

    // on commence au milieu de la série, pour que la photo du centre soit entourée des deux côtés
    const first = Math.floor((n - 1) / 2);
    S.target = S.pos = first;
    layout();
    caption(first);
    place(first);
    tBtnsD.forEach((b, i) => b.addEventListener('click', () => commit(i)));
    if ('ResizeObserver' in window) new ResizeObserver(() => { layout(); kick(); }).observe(depth);
    else addEventListener('resize', () => { layout(); kick(); });

    // tirer à la main ; un simple clic choisit la photo, ou l'agrandit si elle est déjà au centre
    let drag = null;
    const perCard = () => Math.max(120, C.w * .55);
    depth.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      drag = { id: e.pointerId, x0: e.clientX, x: e.clientX, t: performance.now(), v: 0, start: S.target, moved: false, card: e.target.closest('.depth__card'), center: !!e.target.closest('.depth__stage') };
    });
    depth.addEventListener('pointermove', (e) => {
      if (!drag || drag.id !== e.pointerId) return;
      const dx = e.clientX - drag.x0;
      if (!drag.moved && Math.abs(dx) > 6) {
        drag.moved = true;
        depth.classList.add('is-drag');
        try { depth.setPointerCapture(e.pointerId); } catch (_) { /* rien */ }
      }
      if (!drag.moved) return;
      const now = performance.now();
      if (now > drag.t) drag.v = (e.clientX - drag.x) / (now - drag.t);
      drag.x = e.clientX; drag.t = now;
      S.target = clampT(drag.start - dx / perCard());
      caption(clampT(Math.round(S.target)));
      kick();
    });
    const release = (e) => {
      if (!drag || drag.id !== e.pointerId) return;
      const d = drag;
      drag = null;
      depth.classList.remove('is-drag');
      if (d.moved) { commit(S.target - (performance.now() - d.t < 90 ? d.v : 0) * 150 / perCard()); return; }
      if (e.type !== 'pointerup' || (!d.card && !d.center)) return;
      // en 3D, le navigateur rend parfois le cadre de la scène au lieu de la carte du centre
      const i = d.card ? Number(d.card.dataset.i) : S.target;
      if (i === S.target) openViewer(i, depth); else commit(i);
    };
    depth.addEventListener('pointerup', release);
    depth.addEventListener('pointercancel', release);
    // pavé tactile : glisser à deux doigts vers la gauche ou la droite (le défilement vertical reste à la page)
    let snap;
    depth.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY) || Math.abs(e.deltaX) < .5) return;
      e.preventDefault();
      S.target = clampT(S.target + e.deltaX * .0055);
      caption(clampT(Math.round(S.target)));
      kick();
      clearTimeout(snap);
      snap = setTimeout(() => commit(S.target), 160);
    }, { passive: false });
    depth.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); commit(S.target + (e.key === 'ArrowRight' ? 1 : -1)); }
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openViewer(S.target, depth); }
    });
    $$('.depth__bar .b-round').forEach((b) => b.addEventListener('click', () => commit(S.target + Number(b.dataset.dir))));
  }

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
      status.textContent = 'Merci de compléter les champs encadrés en rouge.';
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

  const yr = $('#year');
  if (yr) yr.textContent = new Date().getFullYear();
})();
