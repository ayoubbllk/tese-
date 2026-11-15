/* Act Wood — commun à toutes les pages : transitions, méga-menu, titres, pages « savoir-faire »,
   et les nouvelles sections de l'accueil (index des métiers, bande, porte pivot, inspirations, CNC). */
(() => {
  const root = document.documentElement;
  const motion = root.classList.contains('motion');
  const home = document.body.classList.contains('home');
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const range = (v, a, b) => clamp((v - a) / (b - a));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const absTop = (el) => { let t = 0; while (el) { t += el.offsetTop; el = el.offsetParent; } return t; };
  const hdH = () => parseFloat(getComputedStyle(root).getPropertyValue('--hd')) || 80;
  const gutter = () => { const g = parseFloat(getComputedStyle($('.wrap') || document.body).paddingLeft) || 20; return Math.max(g, (innerWidth - 1600) / 2 + g); };

  /* ---------- Transition entre les pages ---------- */
  const store = (k, v) => { try { if (v == null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, v); } catch (_) { /* rien */ } };
  const arrived = root.classList.contains('tr-in');
  store('aw-tr', null);
  const onArrive = [];
  if (arrived) {
    requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('tr-go')));
    setTimeout(() => onArrive.forEach((f) => f()), 380);
    setTimeout(() => root.classList.remove('tr-in', 'tr-go'), 1000);
  } else requestAnimationFrame(() => onArrive.forEach((f) => f()));
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.target && a.target !== '_self') return;
    if (a.hasAttribute('download')) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || !/^https?:$/.test(url.protocol)) return;
    const samePage = url.pathname.replace(/index\.html$/, '') === location.pathname.replace(/index\.html$/, '');
    if (samePage) return;
    if (!motion) return;
    e.preventDefault();
    store('aw-tr', '1');
    root.classList.add('tr-out');
    setTimeout(() => { location.href = url.href; }, 640);
  });
  // retour arrière depuis le cache du navigateur : on retire le rideau
  addEventListener('pageshow', (e) => { if (e.persisted) root.classList.remove('tr-out', 'tr-in', 'tr-go'); });

  /* ---------- Méga-menu « Savoir-faire » ---------- */
  const hd = $('#hd');
  const megaBtn = $('.hd__mega');
  const mega = $('#mega');
  if (megaBtn && mega) {
    mega.hidden = false;
    let closeT;
    const set = (open) => {
      clearTimeout(closeT);
      mega.classList.toggle('is-open', open);
      megaBtn.setAttribute('aria-expanded', String(open));
      hd.classList.toggle('mega-open', open);
    };
    const later = () => { clearTimeout(closeT); closeT = setTimeout(() => set(false), 220); };
    megaBtn.addEventListener('click', () => set(megaBtn.getAttribute('aria-expanded') !== 'true'));
    if (matchMedia('(hover: hover)').matches) {
      megaBtn.addEventListener('mouseenter', () => set(true));
      megaBtn.addEventListener('mouseleave', later);
      mega.addEventListener('mouseenter', () => clearTimeout(closeT));
      mega.addEventListener('mouseleave', later);
    }
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && mega.classList.contains('is-open')) { set(false); megaBtn.focus(); } });
    document.addEventListener('click', (e) => { if (!e.target.closest('.mega, .hd__mega')) set(false); });
    $$('a', mega).forEach((a) => a.addEventListener('click', () => set(false)));
    addEventListener('scroll', () => { if (mega.classList.contains('is-open') && !mega.matches(':hover')) set(false); }, { passive: true });
  }

  /* ---------- En-tête des pages intérieures (l'accueil a le sien, dans main.js) ---------- */
  if (!home && hd) {
    const toggle = $('.hd__toggle', hd);
    const setMenu = (open) => {
      hd.classList.toggle('is-open', open);
      root.classList.toggle('hd-lock', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    };
    toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
    $$('.hd__menu a', hd).forEach((a) => a.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && hd.classList.contains('is-open')) { setMenu(false); toggle.focus(); } });
    let last = scrollY, acc = 0;
    const progress = $('#progress');
    addEventListener('scroll', () => {
      const yy = scrollY, d = yy - last;
      last = yy;
      acc = Math.sign(d) === Math.sign(acc) ? acc + d : d;
      if (yy < 200 || acc < -12) hd.classList.remove('is-hidden');
      else if (acc > 24 && !(mega && mega.classList.contains('is-open'))) hd.classList.add('is-hidden');
      if (progress) progress.style.transform = `scaleX(${clamp(yy / Math.max(1, document.documentElement.scrollHeight - innerHeight))})`;
    }, { passive: true });
    // la pastille suit le lien survolé
    const nav = $('.hd__nav', hd), pill = $('.hd__pill', hd), links = $$('.hd__nav a, .hd__mega', hd);
    const place = (t) => {
      links.forEach((l) => l.classList.toggle('is-pill', l === t));
      nav.classList.toggle('has-pill', !!t);
      if (t) { pill.style.width = `${t.offsetWidth}px`; pill.style.setProperty('--px', `${t.offsetLeft}px`); }
    };
    links.forEach((l) => { l.addEventListener('mouseenter', () => place(l)); l.addEventListener('focus', () => place(l)); l.addEventListener('blur', () => place(null)); });
    nav.addEventListener('mouseleave', () => place(null));
    // bouton « remplissage » de l'en-tête : les lettres roulent
    $$('.b-fill').forEach((b) => {
      const a = b.textContent.trim(), h = b.dataset.hover || a;
      const row = (t) => `<span class="row" aria-hidden="true">${[...t].map((c, i) => `<span style="--i:${i}">${c === ' ' ? '&nbsp;' : c}</span>`).join('')}</span>`;
      b.setAttribute('aria-label', a);
      b.innerHTML = `<span class="lbl">${row(a)}${row(h)}</span>`;
    });
    const yr = $('#year');
    if (yr) yr.textContent = new Date().getFullYear();
  }

  /* ---------- Titres : les mots montent un à un ---------- */
  const splits = $$('[data-split]');
  splits.forEach((el) => {
    let i = 0;
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const parts = n.textContent.split(/(\s+)/);
          const frag = document.createDocumentFragment();
          parts.forEach((p) => {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span');
            w.className = 'w';
            w.innerHTML = `<span style="--i:${i++}"></span>`;
            w.firstChild.textContent = p;
            frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
      });
    };
    el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
    walk(el);
    $$('.w', el).forEach((w) => w.setAttribute('aria-hidden', 'true'));
  });

  /* ---------- Apparitions ---------- */
  const watch = (els, cls = 'is-in', margin = '0px 0px -8% 0px') => {
    if (!els.length) return;
    if (!motion || !('IntersectionObserver' in window)) { els.forEach((el) => el.classList.add(cls)); return; }
    const io = new IntersectionObserver((en) => en.forEach((x) => { if (x.isIntersecting) { x.target.classList.add(cls); io.unobserve(x.target); } }), { rootMargin: margin, threshold: .05 });
    els.forEach((el) => io.observe(el));
  };
  if (!home) watch($$('.reveal'));
  watch($$('.g-item'));
  watch(splits.filter((el) => !el.closest('.ph')));
  // les étapes et leurs arches qui se tracent (sur l'accueil, main.js gère déjà .reveal)
  if (home) watch($$('.pp__steps li'));

  /* ---------- Pages : ouverture ---------- */
  const ph = $('.ph');
  const S = { list: [], y: -1, dirty: true };
  if (ph) {
    onArrive.push(() => { root.classList.add('ph-in'); $$('[data-split]', ph).forEach((e) => e.classList.add('is-in')); });
    if (motion) {
      const win = $('.ph__win', ph), img = $('img', win), head = $('.ph__head', ph), stage = $('.ph__stage', ph);
      const sides = $$('.ph__side', ph);
      const film = $('video', win);
      const ratio = parseFloat(win.style.getPropertyValue('--ratio')) || .8;
      const m = {};
      // la photo garde ses proportions : elle part de l'arche (à droite, ou sous le titre sur téléphone)
      // et vient au centre, à sa taille finale ; on ne la recadre jamais
      const measure = () => {
        const vw = innerWidth, vh = innerHeight, hd = hdH(), g = gutter();
        m.top = absTop(ph); m.len = Math.max(1, ph.offsetHeight - vh); m.vh = vh;
        let H1 = vh - hd - 56, W1 = H1 * ratio;
        const maxW = vw > 860 ? vw * .6 : vw - 24;
        if (W1 > maxW) { W1 = maxW; H1 = W1 / ratio; }
        m.x1 = (vw - W1) / 2; m.y1 = hd + (vh - hd - H1) / 2;
        let w0, h0, x0, y0;
        if (vw > 860) {
          const L = vw * .53, R = vw - g, avW = R - L, avH = vh - hd - 64;
          h0 = Math.min(avH, avW / ratio); w0 = h0 * ratio;
          x0 = R - w0; y0 = hd + 32 + (avH - h0) / 2;
        } else {
          const T = Math.min(head.offsetTop + head.offsetHeight + 22, vh * .62), avH = vh - T - 18;
          w0 = vw - 2 * g; h0 = w0 / ratio;
          if (h0 > avH) { h0 = avH; w0 = h0 * ratio; }
          x0 = (vw - w0) / 2; y0 = T;
        }
        m.x0 = x0; m.y0 = y0; m.s0 = w0 / W1; m.W = W1; m.H = H1;
        win.style.setProperty('--w', `${W1.toFixed(1)}px`);
        win.style.setProperty('--h', `${H1.toFixed(1)}px`);
        // les deux arches latérales, posées de part et d'autre, un peu plus bas
        const sh = H1 * .62, sw = sh * .78;
        m.sides = sides.map((el, k) => {
          el.style.setProperty('--sw', `${sw.toFixed(1)}px`);
          el.style.setProperty('--sh', `${sh.toFixed(1)}px`);
          return { el, x: k ? m.x1 + W1 + 28 : m.x1 - 28 - sw, y: m.y1 + H1 - sh + 30 };
        });
      };
      S.list.push({
        measure,
        update: (y) => {
          if (y > m.top + m.len + m.vh) return;
          const p = clamp((y - m.top) / m.len);
          const e = ease(range(p, 0, .6));
          const s = lerp(m.s0, 1, e);
          win.style.transform = `translate3d(${lerp(m.x0, m.x1, e).toFixed(1)}px, ${lerp(m.y0, m.y1, e).toFixed(1)}px, 0) scale(${s.toFixed(4)})`;
          // cadre arrondi constant à l'écran : le rayon est compté dans le repère de la photo
          const rt = 18 / s, rb = 18 / s;
          win.style.clipPath = `inset(0 round ${rt.toFixed(1)}px ${rt.toFixed(1)}px ${rb.toFixed(1)}px ${rb.toFixed(1)}px)`;
          const zoom = `scale(${(1.12 - .12 * e).toFixed(4)})`;
          img.style.transform = zoom;
          if (film) film.style.transform = zoom;
          const out = range(p, .04, .38);
          head.style.opacity = (1 - out).toFixed(3);
          head.style.translate = `0 ${(-90 * ease(out)).toFixed(1)}px`;
          head.style.visibility = out >= 1 ? 'hidden' : '';
          const e2 = ease(range(p, .22, .78));
          m.sides.forEach((sd, k) => {
            sd.el.style.opacity = e2.toFixed(3);
            sd.el.style.transform = `translate3d(${sd.x.toFixed(1)}px, ${(sd.y + (1 - e2) * m.vh * (k ? .7 : .5)).toFixed(1)}px, 0)`;
          });
          stage.style.setProperty('--tag', range(p, .55, .7).toFixed(3));
        },
      });
    }
  }

  /* ---------- Pages : la pile qui avance seule (d'après « Slider-01 », Framer) ----------
     Six places : la photo du dessus à droite, les précédentes reculent vers la gauche en rapetissant,
     la plus ancienne passe derrière, la suivante arrive par la droite. Toutes les 2,5 s. */
  const sl = $('.sl');
  const allItems = $$('.g-item');
  if (sl && allItems.length > 2) {
    const N = allItems.length;
    const capN = $('.sl__n'), capB = $('.sl__cap b');
    const cardsS = allItems.map((it, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'sl__card is-jump';
      b.setAttribute('aria-label', `Agrandir : ${$('b', it).textContent}`);
      b.innerHTML = `<img src="${$('img', it).getAttribute('src')}" alt="" loading="lazy">`;
      b.addEventListener('click', () => it.click());
      sl.appendChild(b);
      return b;
    });
    // place → [centre horizontal (fraction), échelle, plan, voile]
    const slots = (mob) => mob
      ? { 0: [.69, 1, 5, 0], 1: [.45, .9, 4, .12], 2: [.28, .8, 3, .24], 3: [.16, .7, 2, .36], hid: [.24, .3, 1, .6], inc: [1.3, 1.2, 1, 0] }
      : { 0: [.82, 1, 5, 0], 1: [.55, .9, 4, .1], 2: [.34, .8, 3, .2], 3: [.18, .7, 2, .3], hid: [.27, .3, 1, .6], inc: [1.25, 1.2, 1, 0] };
    let cur = 0, W = 0, mob = false, last = cardsS.map(() => null);
    const size = () => {
      W = sl.clientWidth; mob = innerWidth <= 760;
      const cw = (mob ? .54 : .34) * W;
      sl.style.setProperty('--slw', `${cw}px`);
      sl.style.setProperty('--slh', `${(cw / .8) * 1.06}px`);
    };
    const rankOf = (i) => ((cur - i) % N + N) % N;
    const lay = (instant) => {
      const S = slots(mob);
      cardsS.forEach((c, i) => {
        const r = rankOf(i);
        const key = r <= 3 ? r : r === N - 1 && N > 5 ? 'inc' : 'hid';
        const [x, s, z, veil] = S[key];
        // de l'arrière à l'entrée (à droite, hors champ) : on saute sans animation
        const jump = instant || (key === 'inc' && last[i] !== 'inc') || (key === 'hid' && last[i] === 'hid');
        c.classList.toggle('is-jump', jump);
        c.style.transform = `translate3d(${(x * W).toFixed(1)}px, -50%, 0) translateX(-50%) scale(${s})`;
        c.style.zIndex = z;
        c.style.setProperty('--veil', veil);
        c.style.opacity = key === 'hid' && N > 5 && r > 4 ? '0' : '1';
        c.tabIndex = key === 0 ? 0 : -1;
        last[i] = key;
      });
      const it = allItems[cur];
      capN.textContent = `${String(cur + 1).padStart(2, '0')} / ${String(N).padStart(2, '0')}`;
      capB.textContent = $('b', it).textContent;
    };
    size();
    lay(true);
    requestAnimationFrame(() => cardsS.forEach((c) => c.classList.remove('is-jump')));
    if ('ResizeObserver' in window) new ResizeObserver(() => { size(); lay(true); }).observe(sl);
    if (motion) {
      let seen = false, t = 0;
      const tick = () => {
        clearTimeout(t);
        if (!seen || document.visibilityState === 'hidden') return;
        t = setTimeout(() => { cur = (cur + 1) % N; lay(false); tick(); }, 2500);
      };
      new IntersectionObserver((en) => { seen = en[0].isIntersecting; tick(); }, { threshold: .2 }).observe(sl);
      document.addEventListener('visibilitychange', tick);
    }
  }

  /* ---------- Pages : le paquet de cartes (d'après « Carousel-01 », Framer) ----------
     La carte du dessus, deux autres inclinées derrière (une de chaque côté). On la tire de côté
     pour passer à la suivante ; un clic l'agrandit ; flèches, vignettes et clavier. */
  $$('.pg').forEach((sec) => {
    const host = $('.pg__deck', sec);
    const its = $$('.g-item', sec);
    if (!host || its.length < 2) return;
    sec.classList.add('has-deck');
    const N = its.length, label = host.dataset.label || '';
    const insp = !!$('.g-item__cap i', sec);
    const arrowL = '<svg viewBox="0 0 18 12" aria-hidden="true"><path d="M18 6H2M7 1L2 6l5 5" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';
    const arrowR = '<svg viewBox="0 0 18 12" aria-hidden="true"><path d="M0 6h16M11 1l5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';
    host.innerHTML = `<div class="dk" tabindex="0" role="group" aria-roledescription="carrousel" aria-label="${label}. Flèches gauche et droite pour parcourir, Entrée pour agrandir.">
      <div class="dk__stage"></div>
      <div class="dk__bar"><button type="button" class="b-round" data-dir="-1" aria-label="Photo précédente">${arrowL}</button><div class="dk__rail"></div><button type="button" class="b-round" data-dir="1" aria-label="Photo suivante">${arrowR}</button></div>
    </div>`;
    const dk = $('.dk', host), stage = $('.dk__stage', host), rail = $('.dk__rail', host);
    const cardsD = its.map((it, i) => {
      const c = document.createElement('div');
      c.className = 'dk__card is-gone is-jump';
      const cap = $('b', it).textContent;
      c.innerHTML = `<div class="dk__in"><div class="dk__img"><img src="${$('img', it).getAttribute('src')}" alt="" draggable="false" loading="lazy"><span class="dk__chip">${insp ? 'Inspiration · ' : ''}${String(i + 1).padStart(2, '0')} / ${String(N).padStart(2, '0')}</span></div><div class="dk__veil"></div>
        <div class="dk__foot"><div><small>${label}</small><b>${cap}</b></div><span class="dk__zoom" aria-hidden="true"><svg viewBox="0 0 16 16"><path d="M7 1h2v6h6v2H9v6H7V9H1V7h6z" fill="currentColor"/></svg></span></div></div>`;
      stage.appendChild(c);
      const th = document.createElement('button');
      th.type = 'button';
      th.setAttribute('aria-label', `Afficher : ${cap}`);
      th.innerHTML = `<img src="${$('img', it).getAttribute('src')}" alt="" loading="lazy">`;
      th.addEventListener('click', () => go(i - cur));
      rail.appendChild(th);
      return c;
    });
    const thumbs = [...rail.children];
    let cur = 0, mob = false, D = {};
    const size = () => {
      mob = host.clientWidth < 640;
      const avail = host.clientWidth - (mob ? 30 : 110);
      const hMax = Math.min(innerHeight * .78, 700) - 60;
      let w = Math.min(avail, mob ? 380 : 470), h = w / .76;
      if (h > hMax && !mob) { h = hMax; w = h * .76; }
      D = { w, h, spread: mob ? 17 : 42, rot: mob ? 6 : 7 };
      dk.style.setProperty('--cw', `${w.toFixed(0)}px`);
      dk.style.setProperty('--chh', `${h.toFixed(0)}px`);
      dk.style.setProperty('--foot', `${mob ? 86 : 98}px`);
      stage.style.setProperty('--dkh', `${(h + 56).toFixed(0)}px`);
    };
    // rang 0 : dessus ; 1 : derrière à gauche ; 2 : derrière à droite
    const pose = (r) => {
      if (r === 0) return { x: 0, y: 10, rot: 0, s: 1, veil: 0 };
      const side = r === 1 ? -1 : 1;
      return { x: side * D.spread, y: r === 1 ? -9 : -23, rot: side * D.rot, s: r === 1 ? .955 : .91, veil: r === 1 ? .1 : .2 };
    };
    const tf = (p, dy = 0, k = 1) => `translate3d(${p.x}px, ${p.y + dy}px, 0) rotate(${p.rot}deg) scale(${(p.s * k).toFixed(4)})`;
    const prev = cardsD.map(() => -1);
    const lay = (instant) => {
      cardsD.forEach((c, i) => {
        const r = ((i - cur) % N + N) % N;
        const vis = r <= 2 && (N > 2 || r <= 1);
        c.classList.toggle('is-top', r === 0);
        if (!vis) {
          c.classList.add('is-gone');
          c.style.zIndex = 0;
          prev[i] = -1;
          return;
        }
        const p = pose(r);
        c.style.zIndex = 30 - r;
        c.style.setProperty('--veil', p.veil);
        if (prev[i] === -1 && !instant) {
          // une carte qui revient apparaît en place, légèrement plus bas
          c.classList.add('is-jump');
          c.style.transform = tf(p, 8, .98);
          void c.offsetWidth;
          c.classList.remove('is-jump');
        } else c.classList.toggle('is-jump', !!instant);
        c.classList.remove('is-gone');
        c.style.transform = tf(p);
        prev[i] = r;
      });
      thumbs.forEach((t, k) => { t.classList.toggle('is-on', k === cur); t.setAttribute('aria-current', String(k === cur)); });
      const on = thumbs[cur];
      if (on) rail.scrollTo({ left: on.offsetLeft - rail.clientWidth / 2 + on.offsetWidth / 2, behavior: instant || !motion ? 'auto' : 'smooth' });
      if (instant) requestAnimationFrame(() => cardsD.forEach((c) => c.classList.remove('is-jump')));
    };
    const go = (d) => { if (!d) return; cur = ((cur + d) % N + N) % N; lay(!motion); };
    size(); lay(true);
    if ('ResizeObserver' in window) new ResizeObserver(() => { size(); lay(true); }).observe(host);
    $$('.dk__bar .b-round', host).forEach((b) => b.addEventListener('click', () => go(Number(b.dataset.dir))));
    dk.addEventListener('keydown', (e) => {
      if (e.target !== dk) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); its[cur].click(); }
    });
    // tirer la carte du dessus ; clic simple : agrandir (dessus) ou amener la carte (derrière)
    let g = null;
    stage.addEventListener('pointerdown', (e) => {
      const c = e.target.closest('.dk__card');
      if (!c || e.button !== 0) return;
      g = { c, i: cardsD.indexOf(c), x0: e.clientX, x: e.clientX, t: performance.now(), v: 0, id: e.pointerId, moved: false };
    });
    stage.addEventListener('pointermove', (e) => {
      if (!g || g.id !== e.pointerId || g.i !== cur) return;
      const dx = e.clientX - g.x0;
      if (!g.moved && Math.abs(dx) > 6) {
        g.moved = true; dk.classList.add('is-drag');
        g.c.classList.add('is-jump');
        try { stage.setPointerCapture(e.pointerId); } catch (_) { /* rien */ }
      }
      if (!g.moved) return;
      const now = performance.now();
      g.v = (e.clientX - g.x) / Math.max(1, now - g.t); g.x = e.clientX; g.t = now;
      const p = pose(0);
      g.c.style.transform = `translate3d(${(p.x + dx * .85).toFixed(1)}px, ${p.y}px, 0) rotate(${(clamp(dx / D.w, -1, 1) * 14).toFixed(2)}deg)`;
    });
    const end = (e) => {
      if (!g || g.id !== e.pointerId) return;
      const s = g;
      g = null;
      dk.classList.remove('is-drag');
      s.c.classList.remove('is-jump');
      if (s.moved) {
        const dx = s.x - s.x0, far = Math.abs(dx) > Math.min(100, D.w * .22) || (Math.abs(dx) > 20 && Math.abs(s.v) > .65);
        if (far) go(dx < 0 ? 1 : -1); else lay(false);
        return;
      }
      if (e.type !== 'pointerup') return;
      if (s.i === cur) its[cur].click(); else go(s.i - cur);
    };
    stage.addEventListener('pointerup', end);
    stage.addEventListener('pointercancel', end);
  });

  /* ---------- Pages : visionneuse ---------- */
  const items = $$('.g-item');
  const viewer = $('#viewer');
  if (items.length && viewer) {
    const vImg = $('#viewer-img'), vCap = $('#viewer-cap');
    let cur = 0, opener = null;
    const show = (i) => {
      cur = (i + items.length) % items.length;
      const img = $('img', items[cur]);
      vImg.src = img.src; vImg.alt = img.alt;
      const nm = document.createElement('b'), mt = document.createElement('span');
      nm.textContent = $('b', items[cur]).textContent;
      const insp = $('i', items[cur]);
      mt.textContent = `${insp ? 'Inspiration · ' : ''}${cur + 1} / ${items.length}`;
      vCap.replaceChildren(nm, mt);
    };
    items.forEach((it, i) => it.addEventListener('click', () => { opener = it; show(i); viewer.showModal(); }));
    $('.viewer__close', viewer).addEventListener('click', () => viewer.close());
    $$('.viewer__nav', viewer).forEach((b) => b.addEventListener('click', () => show(cur + Number(b.dataset.dir))));
    viewer.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') show(cur - 1); if (e.key === 'ArrowRight') show(cur + 1); });
    viewer.addEventListener('click', (e) => { if (e.target === viewer) viewer.close(); });
    viewer.addEventListener('close', () => opener && opener.focus({ preventScroll: true }));
  }

  /* ---------- Accueil : l'index des savoir-faire, la photo suit le pointeur ---------- */
  const sx = $('.sx');
  if (sx && motion && matchMedia('(hover: hover)').matches) {
    const float = $('.sx__float', sx), imgs = $$('img', float), rows = $$('.sx__row', sx), list = $('.sx__list', sx);
    const F = { x: 0, y: 0, tx: 0, ty: 0, r: 0, raf: 0, on: false, cur: -1 };
    const loop = () => {
      F.raf = 0;
      const dx = F.tx - F.x;
      F.x += dx * .16; F.y += (F.ty - F.y) * .16;
      F.r = lerp(F.r, clamp(dx * .08, -10, 10), .2);
      float.style.setProperty('--fx', `${F.x.toFixed(1)}px`);
      float.style.setProperty('--fy', `${F.y.toFixed(1)}px`);
      float.style.setProperty('--fr', `${F.r.toFixed(2)}deg`);
      if (F.on || Math.abs(dx) > .5) F.raf = requestAnimationFrame(loop);
    };
    const pos = (e) => {
      const r = sx.getBoundingClientRect();
      F.tx = e.clientX - r.left; F.ty = e.clientY - r.top;
      if (!F.raf) F.raf = requestAnimationFrame(loop);
    };
    const pick = (i) => {
      if (i === F.cur) return;
      imgs.forEach((im, k) => { im.classList.toggle('was-on', k === F.cur); im.classList.toggle('is-on', k === i); });
      F.cur = i;
    };
    list.addEventListener('mouseenter', (e) => { const r = sx.getBoundingClientRect(); F.x = F.tx = e.clientX - r.left; F.y = F.ty = e.clientY - r.top; F.on = true; float.classList.add('is-on'); pos(e); });
    list.addEventListener('mousemove', pos);
    list.addEventListener('mouseleave', () => { F.on = false; float.classList.remove('is-on'); });
    rows.forEach((row, i) => row.addEventListener('mouseenter', () => pick(i)));
  }

  /* ---------- Accueil : la bande des métiers ---------- */
  const mqRows = $$('.mq__row');
  const MQ = mqRows.map((row) => ({ track: $('.mq__track', row), dir: row.classList.contains('mq__row--rev') ? 1 : -1, x: 0, w: 0 }));
  let vel = 0, lastSY = scrollY, lastT = performance.now(), visMq = false;
  if (MQ.length && motion) {
    // on duplique le contenu pour une boucle sans couture
    MQ.forEach((q) => { const c = q.track.cloneNode(true); c.setAttribute('aria-hidden', 'true'); q.track.parentElement.appendChild(c); q.clone = c; });
    new IntersectionObserver((en) => { visMq = en[0].isIntersecting; }).observe($('.mq'));
    let flip = 1;
    const tick = (t) => {
      requestAnimationFrame(tick);
      const dt = Math.min(64, t - lastT) / 1000; lastT = t;
      const sy = scrollY, d = sy - lastSY; lastSY = sy;
      vel = lerp(vel, d / Math.max(dt, .001), .1);
      if (Math.abs(d) > 1) flip = Math.sign(d);
      if (!visMq) return;
      MQ.forEach((q) => {
        if (!q.w) q.w = q.track.offsetWidth;
        const speed = (60 + Math.min(Math.abs(vel), 3000) * .35) * flip;
        q.x += q.dir * speed * dt;
        if (q.x < -q.w) q.x += q.w;
        if (q.x > 0) q.x -= q.w;
        const tr = `translate3d(${q.x.toFixed(1)}px,0,0)`;
        q.track.style.transform = tr; q.clone.style.transform = tr;
      });
    };
    requestAnimationFrame(tick);
    addEventListener('resize', () => MQ.forEach((q) => { q.w = 0; }));
  }

  /* ---------- Accueil : les portes sur un cadran (d'après « Volvelle », Framer) ----------
     Les vignettes sont posées sur une grande roue dont on ne voit que le haut. La porte choisie
     vient au sommet, grandit, et sa photo s'épanouit en cercle depuis le cadran : en grand et nette
     au centre, en lumière floutée dans tout le fond. Tirer, cliquer, flèches, ou laisser tourner. */
  const vv = $('.vv');
  if (vv) {
    const dial = $('.vv__dial', vv), cards = $$('.vv__card', vv), ring = $('.vv__ring', vv), notch = $('.vv__notch', vv);
    const amb = $('.vv__amb', vv), pours = $('.vv__pours', vv), photo = $('.vv__photo', vv), rims = $('.vv__rims', vv);
    const title = $('.vv__title', vv), mat = $('.vv__mat', vv), num = $('.vv__n b', vv), text = $('.vv__text', vv);
    const n = cards.length;
    const items = cards.map((c) => ({ src: $('img', c).getAttribute('src'), title: c.dataset.title, mat: c.dataset.mat }));
    const SPIN = .95, BLOOM = 1.25, EVERY = 5;
    const G = {};
    const fold = (deg, span) => ((((deg + span / 2) % span) + span) % span) - span / 2;
    const bez = (x1, y1, x2, y2) => (t) => { // courbe de Bézier cubique, comme les « ease » de Framer
      let u = t;
      for (let k = 0; k < 6; k++) {
        const cx = 3 * x1 * u * (1 - u) ** 2 + 3 * x2 * u * u * (1 - u) + u ** 3 - t;
        const d = 3 * x1 * (1 - u) ** 2 + 6 * (x2 - x1) * u * (1 - u) + 3 * (1 - x2) * u * u;
        if (Math.abs(d) < 1e-6) break;
        u = clamp(u - cx / d);
      }
      return 3 * y1 * u * (1 - u) ** 2 + 3 * y2 * u * u * (1 - u) + u ** 3;
    };
    const SWEEP = bez(.65, 0, .35, 1);

    const shape = () => {
      const W = vv.clientWidth, H = vv.clientHeight, mob = W <= 760;
      Object.assign(G, mob
        ? { w: 62, h: 84, R: Math.max(280, W * .82), step: 14, top: .8, lift: 1.28 }
        : { w: 96, h: 128, R: Math.max(440, W * .42), step: 11.5, top: .78, lift: 1.32 });
      G.W = W; G.H = H; G.mob = mob;
      G.span = n * G.step;
      G.dialTop = dial.offsetTop;
      G.ox = W / 2; G.oy = H * G.top;                // sommet de la roue, dans la section
      G.oyd = G.oy - G.dialTop;                       // le même point, dans le cadran
      G.ringR = Math.max(40, G.R - G.h / 2 - 26);
      cards.forEach((c) => { c.style.setProperty('--cw', `${G.w}px`); c.style.setProperty('--ch', `${G.h}px`); });
      // la photo : entre le texte (ou l'en-tête) et la vignette choisie, en gardant ses proportions
      const top = mob ? text.offsetTop + text.offsetHeight + 14 : hdH() + 24;
      const bottom = G.oy - (G.h * G.lift) / 2 - (mob ? 18 : 30);
      const ph = Math.max(160, bottom - top);
      photo.style.top = `${top}px`;
      photo.style.height = `${ph}px`;
      // l'anneau gradué, centré sur la roue
      const r = G.ringR, fine = G.step / 4, cnt = Math.min(900, Math.floor(360 / fine));
      let ticks = '';
      for (let k = 0; k < cnt; k++) {
        const a = k * fine * Math.PI / 180, len = k % 4 === 0 ? 12 : 5;
        const s = Math.sin(a), c = -Math.cos(a);
        ticks += `<line x1="${(s * r).toFixed(1)}" y1="${(c * r).toFixed(1)}" x2="${(s * (r - len)).toFixed(1)}" y2="${(c * (r - len)).toFixed(1)}" stroke="currentColor" stroke-width="${k % 4 === 0 ? 1 : .6}" opacity="${k % 4 === 0 ? .55 : .3}"/>`;
      }
      ring.setAttribute('width', 2 * r); ring.setAttribute('height', 2 * r);
      ring.setAttribute('viewBox', `${-r} ${-r} ${2 * r} ${2 * r}`);
      ring.innerHTML = `<circle r="${r}" fill="none" stroke="currentColor" stroke-width=".8" opacity=".35"/><circle r="${r - 20}" fill="none" stroke="currentColor" stroke-width=".5" opacity=".2"/>${ticks}`;
      ring.style.left = `${G.ox - r}px`; ring.style.top = `${G.oyd + G.R - r}px`;
      notch.style.left = `${G.ox}px`; notch.style.top = `${G.oyd + G.R - r}px`;
      G.far = Math.hypot(Math.max(G.ox, W - G.ox), Math.max(G.oy, H - G.oy)) + 8;
    };

    // position de la roue (en degrés) ; la porte i est au sommet quand T = -i × pas
    const S2 = { T: 0, pick: 0, anim: null, raf: 0, scale: cards.map((_, i) => (i ? 1 : 0)) };
    const place = () => {
      cards.forEach((c, i) => {
        const th = fold(i * G.step + S2.T, G.span), rad = th * Math.PI / 180;
        const on = i === S2.pick;
        const target = on ? G.lift : 1;
        S2.scale[i] += (target - S2.scale[i]) * (motion ? .16 : 1);
        const x = G.ox + G.R * Math.sin(rad) - G.w / 2;
        const y = G.oyd + (G.R - G.R * Math.cos(rad)) - G.h / 2;
        const fade = n < 3 ? 1 : clamp((G.span / 2 - Math.abs(th)) / (G.step * .9));
        c.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) rotate(${th.toFixed(2)}deg) scale(${S2.scale[i].toFixed(3)})`;
        c.style.opacity = fade.toFixed(3);
        c.style.zIndex = on ? 3 : 1;
        c.style.setProperty('--shade', (clamp(Math.abs(th) / (G.step * 4)) * .32).toFixed(3));
        const drift = clamp((-th / (G.step * 3)) * G.w * .14, -G.w * .14, G.w * .14);
        c.firstElementChild.style.transform = `translateX(${drift.toFixed(1)}px)`;
      });
      ring.style.transform = `rotate(${S2.T.toFixed(2)}deg)`;
    };
    const loop = (t) => {
      S2.raf = 0;
      let busy = false;
      if (S2.anim) {
        const a = S2.anim;
        if (a.spring) {
          const dt = Math.min(.032, (t - (a.last || t)) / 1000) || .016;
          a.last = t;
          for (let k = 0; k < 4; k++) { const h = dt / 4; a.v += (90 * (a.to - S2.T) - 20 * a.v) * h; S2.T += a.v * h; }
          if (Math.abs(a.to - S2.T) < .01 && Math.abs(a.v) < .01) { S2.T = a.to; S2.anim = null; }
        } else {
          const k = clamp((t - a.t0) / (a.dur * 1000));
          S2.T = a.from + (a.to - a.from) * SWEEP(k);
          if (k >= 1) S2.anim = null;
        }
        busy = true;
      }
      place();
      if (busy || S2.scale.some((s, i) => Math.abs(s - (i === S2.pick ? G.lift : 1)) > .002)) S2.raf = requestAnimationFrame(loop);
    };
    const kick = () => { if (!S2.raf) S2.raf = requestAnimationFrame(loop); };
    const nearest = (i) => { const goal = -i * G.step; return goal + Math.round((S2.T - goal) / G.span) * G.span; };
    const glide = (i, soft) => {
      const to = nearest(i);
      if (!motion) { S2.T = to; S2.anim = null; } else S2.anim = soft ? { spring: true, to, v: S2.anim && S2.anim.v || 0 } : { from: S2.T, to, t0: performance.now(), dur: SPIN };
      kick();
    };

    // la photo choisie s'épanouit en cercle depuis le sommet du cadran
    const pour = (into, i, ox, oy, far) => {
      const d = document.createElement('div');
      d.className = 'vv__pour';
      d.innerHTML = `<img src="${items[i].src}" alt="">`;
      into.appendChild(d);
      while (into.children.length > 3) into.firstElementChild.remove();
      if (!motion) return;
      const img = d.firstElementChild;
      const seed = (Math.min(G.w, G.h) * G.lift) / 2;
      d.style.clipPath = `circle(${seed}px at ${ox}px ${oy}px)`;
      img.style.transform = 'scale(1.28) rotate(-5deg)';
      img.style.filter = into === amb ? '' : 'blur(10px)';
      void d.offsetWidth;
      d.style.transition = `clip-path ${BLOOM}s cubic-bezier(.65, 0, .35, 1) ${SPIN * .5}s`;
      img.style.transition = `transform ${BLOOM * 1.5}s cubic-bezier(.16, 1, .3, 1) ${SPIN * .5}s, filter ${BLOOM * 1.5}s cubic-bezier(.16, 1, .3, 1) ${SPIN * .5}s`;
      d.style.clipPath = `circle(${far}px at ${ox}px ${oy}px)`;
      img.style.transform = 'scale(1.02)';
      if (into !== amb) img.style.filter = 'blur(0)';
    };
    const rim = () => {
      if (!motion) return;
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('cx', G.ox); c.setAttribute('cy', G.oy); c.setAttribute('fill', 'none'); c.setAttribute('stroke', 'currentColor');
      rims.appendChild(c);
      const seed = (Math.min(G.w, G.h) * G.lift) / 2, t0 = performance.now() + SPIN * 500;
      const step = (t) => {
        const k = clamp((t - t0) / (BLOOM * 1000));
        const e = SWEEP(k);
        c.setAttribute('r', (seed + (G.far - seed) * e).toFixed(1));
        c.setAttribute('stroke-width', (1.5 - e).toFixed(2));
        c.setAttribute('opacity', (k < .3 ? k / .3 * .7 : .7 * (1 - (k - .3) / .7)).toFixed(3));
        if (k < 1) requestAnimationFrame(step); else c.remove();
      };
      requestAnimationFrame(step);
    };
    const setTitle = (i) => {
      const rows = items[i].title.split('|');
      const fill = () => {
        title.innerHTML = rows.map((r, ri) => `<span class="vv__row">${[...r].map((ch, ci) => `<i style="--d:${(SPIN * .3 + ri * .09 + ci * .022).toFixed(3)}s">${ch}</i>`).join('')}</span>`).join('');
        title.setAttribute('aria-label', rows.join(' '));
        title.classList.remove('is-out');
        mat.textContent = items[i].mat;
        mat.classList.remove('is-out');
      };
      if (!motion) { fill(); return; }
      title.classList.add('is-out'); mat.classList.add('is-out');
      setTimeout(fill, 260);
    };
    const choose = (target, soft = false) => {
      const i = ((target % n) + n) % n;
      if (i === S2.pick) { glide(i, soft); return; }
      S2.pick = i;
      cards.forEach((c, k) => { c.classList.toggle('is-on', k === i); c.setAttribute('aria-current', String(k === i)); });
      glide(i, soft);
      const pr = photo.getBoundingClientRect(), sr = vv.getBoundingClientRect(), pin = pours.getBoundingClientRect();
      pour(amb, i, G.ox, G.oy, G.far);
      // dans le passe-partout, le cercle part du même point (le sommet du cadran)
      const ox = G.ox - (pin.left - sr.left), oy = G.oy - (pin.top - sr.top);
      pour(pours, i, ox, oy, Math.hypot(Math.max(ox, pr.width - ox), Math.max(oy, pr.height + Math.abs(oy))) + 8);
      rim();
      setTitle(i);
      num.textContent = String(i + 1).padStart(2, '0');
      restartTimer();
    };

    // lecture automatique : seulement à l'écran, page visible, sans survol ni prise en main
    let seen = false, rest = false, held = false, timer = 0;
    const auto = () => motion && seen && !rest && !held && document.visibilityState !== 'hidden';
    const restartTimer = () => {
      clearTimeout(timer);
      vv.classList.remove('is-run');
      if (!auto()) return;
      void vv.offsetWidth;
      vv.classList.add('is-run');
      timer = setTimeout(() => choose(S2.pick + 1), EVERY * 1000);
    };
    new IntersectionObserver((en) => { seen = en[0].isIntersecting; restartTimer(); }, { threshold: .25 }).observe(vv);
    document.addEventListener('visibilitychange', restartTimer);
    [dial, photo].forEach((el) => {
      el.addEventListener('mouseenter', () => { rest = true; restartTimer(); });
      el.addEventListener('mouseleave', () => { rest = false; restartTimer(); });
    });

    // tirer la roue ; un simple clic choisit la porte
    let grab = null;
    dial.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      grab = { x: e.clientX, base: S2.T, id: e.pointerId, lx: e.clientX, lt: performance.now(), v: 0, pull: false, card: e.target.closest('.vv__card') };
      S2.anim = null;
    });
    dial.addEventListener('pointermove', (e) => {
      if (!grab || grab.id !== e.pointerId) return;
      const dx = e.clientX - grab.x;
      if (!grab.pull && Math.abs(dx) > 6) {
        grab.pull = true; held = true; restartTimer();
        dial.classList.add('is-drag');
        try { dial.setPointerCapture(e.pointerId); } catch (_) { /* rien */ }
      }
      if (!grab.pull) return;
      const now = performance.now(), dt = Math.max(1, now - grab.lt);
      grab.v = grab.v * .6 + ((e.clientX - grab.lx) / dt) * .4;
      grab.lx = e.clientX; grab.lt = now;
      S2.T = grab.base + dx * (G.step / (G.w + 34));
      kick();
    });
    const release = (e) => {
      if (!grab || grab.id !== e.pointerId) return;
      const g = grab;
      grab = null;
      dial.classList.remove('is-drag');
      held = false;
      if (g.pull) {
        const thrown = S2.T + g.v * 220 * (G.step / (G.w + 34));
        choose(Math.round(-thrown / G.step), true);
      } else if (e.type === 'pointerup' && g.card) choose(cards.indexOf(g.card));
      else restartTimer();
    };
    dial.addEventListener('pointerup', release);
    dial.addEventListener('pointercancel', release);
    cards.forEach((c, i) => c.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(i); } }));
    dial.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); choose(S2.pick + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); choose(S2.pick - 1); }
    });
    let wheelAt = 0;
    dial.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaX) < 8 || Math.abs(e.deltaX) < Math.abs(e.deltaY)) return;
      e.preventDefault();
      const now = Date.now();
      if (now - wheelAt < 520) return;
      wheelAt = now;
      choose(S2.pick + (e.deltaX > 0 ? 1 : -1));
    }, { passive: false });
    $$('.vv__btns .b-round', vv).forEach((b) => b.addEventListener('click', () => choose(S2.pick + Number(b.dataset.dir))));

    // départ
    amb.innerHTML = `<div class="vv__pour"><img src="${items[0].src}" alt=""></div>`;
    cards[0].classList.add('is-on');
    setTitle(0);
    const relayout = () => { shape(); S2.T = nearest(S2.pick); place(); };
    relayout();
    S2.scale[0] = G.lift;
    place();
    if ('ResizeObserver' in window) new ResizeObserver(relayout).observe(vv); else addEventListener('resize', relayout);
    if (document.fonts) document.fonts.ready.then(relayout);
  }

  /* ---------- Accueil : les inspirations défilent de côté ---------- */
  const hz = $('.hz');
  if (hz && motion) {
    const track = $('.hz__track', hz), bar = $('.hz__bar i', hz), cards = $$('.hz__card', hz);
    const m = {};
    S.list.push({
      measure: () => {
        hz.style.height = '';
        track.style.transform = '';
        m.dist = Math.max(0, track.scrollWidth - innerWidth);
        hz.style.height = `${innerHeight + m.dist}px`;
        m.top = absTop(hz); m.len = Math.max(1, m.dist);
        m.cards = cards.map((c) => ({ img: $('img', c), x: c.offsetLeft + c.offsetWidth / 2 }));
      },
      update: (y) => {
        if (y + innerHeight < m.top || y > m.top + m.len + innerHeight) return;
        const p = clamp((y - m.top) / m.len);
        const tx = -p * m.dist;
        track.style.transform = `translate3d(${tx.toFixed(1)}px,0,0)`;
        bar.style.transform = `scaleX(${p.toFixed(4)})`;
        m.cards.forEach((c) => {
          const off = (c.x + tx - innerWidth / 2) / innerWidth;
          if (Math.abs(off) < 1.4) c.img.style.transform = `translate3d(${(off * -7).toFixed(2)}%,0,0)`;
        });
      },
    });
  }

  /* ---------- Accueil : le panneau CNC se découpe ---------- */
  const cx = $('.cx');
  if (cx) {
    const star = $('#cx-star', cx);
    const m = {};
    const setStar = (p) => {
      const s = lerp(.42, 2.3, ease(range(p, .12, .86)));
      star.setAttribute('transform', `translate(40 40) rotate(${(p * 45).toFixed(2)}) scale(${s.toFixed(4)}) translate(-40 -40)`);
    };
    if (!motion) setStar(1);
    else S.list.push({
      measure: () => { m.top = absTop(cx); m.len = Math.max(1, cx.offsetHeight - innerHeight); },
      update: (y) => {
        if (y + innerHeight < m.top || y > m.top + m.len + innerHeight) return;
        const p = clamp((y - m.top + innerHeight * .5) / (m.len + innerHeight * .5));
        setStar(p);
        cx.classList.toggle('is-cut', p > .72);
      },
    });
  }

  /* ---------- Boucle commune ---------- */
  if (S.list.length) {
    const measureAll = () => { S.list.forEach((s) => s.measure()); S.dirty = true; };
    const frame = () => {
      requestAnimationFrame(frame);
      const y = scrollY;
      if (y === S.y && !S.dirty) return;
      S.y = y; S.dirty = false;
      S.list.forEach((s) => s.update(y));
    };
    measureAll();
    requestAnimationFrame(frame);
    let rz;
    addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(measureAll, 120); });
    addEventListener('load', measureAll);
    if (document.fonts) document.fonts.ready.then(measureAll);
    if ('ResizeObserver' in window) {
      let last = 0;
      new ResizeObserver(() => { const h = document.body.offsetHeight; if (h !== last) { last = h; measureAll(); } }).observe(document.body);
    }
  }

  /* ---------- Vidéos Higgsfield (quand elles sont branchées) : chargées à l'approche, jouées en boucle ---------- */
  const vids = $$('video[data-src]');
  if (vids.length && motion && 'IntersectionObserver' in window) {
    const vio = new IntersectionObserver((en) => en.forEach((x) => {
      const v = x.target;
      if (x.isIntersecting) {
        if (!v.src) { v.src = v.dataset.src; v.addEventListener('loadeddata', () => v.classList.add('is-ready'), { once: true }); v.addEventListener('error', () => v.remove(), { once: true }); }
        // un film joué une seule fois (la porte qui s'ouvre) reste sur sa dernière image
        if (!v.ended) v.play().catch(() => {});
      } else v.pause();
    }), { rootMargin: '30% 0px' });
    vids.forEach((v) => vio.observe(v));
  } else vids.forEach((v) => v.remove());
})();
