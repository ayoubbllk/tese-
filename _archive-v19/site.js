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
          // l'arche s'aplatit en cadre arrondi ; le rayon est compté dans le repère de la photo
          const rt = lerp(m.W / 2, 18 / s, e), rb = 14 / s;
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

  /* ---------- Accueil : la porte pivot ---------- */
  const pv = $('.pv');
  if (pv && motion) {
    const leaves = $$('.pv__leaf', pv), capN = $('.pv__n', pv), capT = $('.pv__capt', pv);
    const caps = leaves.map((l) => $('img', l).alt);
    const n = leaves.length;
    leaves.forEach((l, k) => { l.style.zIndex = String(10 - k); });
    const m = {};
    let curCap = -1;
    S.list.push({
      measure: () => { m.top = absTop(pv); m.len = Math.max(1, pv.offsetHeight - innerHeight); },
      update: (y) => {
        if (y + innerHeight < m.top || y > m.top + m.len + innerHeight) return;
        const p = clamp((y - m.top) / m.len);
        const seg = .84 / (n - 1);
        let open = 0;
        leaves.forEach((l, k) => {
          if (k === n - 1) return;
          const a = ease(range(p, .06 + k * seg, .06 + (k + 1) * seg - .05));
          l.style.transform = a > 0 ? `rotateY(${(a * 98).toFixed(2)}deg)` : '';
          l.style.setProperty('--dark', (Math.sin(a * Math.PI) * .9).toFixed(3));
          l.style.visibility = a >= 1 ? 'hidden' : '';
          if (a > .5) open = k + 1;
        });
        if (open !== curCap) {
          curCap = open;
          capN.textContent = `${String(open + 1).padStart(2, '0')} / ${String(n).padStart(2, '0')}`;
          capT.textContent = caps[open];
        }
      },
    });
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
