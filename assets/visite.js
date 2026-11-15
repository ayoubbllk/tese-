/* Nejera wa Tasmim El Khacheb — la visite : l'entrée par la porte, la visite guidée d'étape en étape,
   et la musique du patrimoine (un orchestre hawzi joué en direct, sans fichier audio). */
(() => {
  const root = document.documentElement;
  const motion = root.classList.contains('motion');
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const store = {
    get: (k) => { try { return sessionStorage.getItem(k); } catch (_) { return null; } },
    set: (k, v) => { try { if (v == null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, v); } catch (_) { /* rien */ } },
  };
  const arrowL = '<svg viewBox="0 0 18 12" aria-hidden="true"><path d="M18 6H2M7 1L2 6l5 5" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';
  const arrowR = '<svg viewBox="0 0 18 12" aria-hidden="true"><path d="M0 6h16M11 1l5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';

  /* =========================================================
     La musique : un petit orchestre hawzi (Tlemcen), calculé dans le navigateur.
     Mode zidane sur ré. La kamenja (violon tenu sur le genou) chante la mélodie en glissant
     d'une note à l'autre ; le mandole, cordes doublées, la double en l'ornant de trémolos ;
     la derbouka et le tar tiennent le rythme berouali (six croches, vif et dansant).
     ========================================================= */
  const Music = (() => {
    let ctx = null, master, dry, wet, analyser, data, timer = 0, next = 0, step = 0, playing = false, notes = [];
    let level = 0, turn = 0, raf = 0, target = .45, fast = 0, slow = 0;
    let vio = null, phrase = [], pIdx = 0, pLeft = 0, pCount = 0;
    const EIGHTH = .19;
    // zidane sur ré : ré mi♭ fa♯ sol la si♭ do ré mi♭ fa♯ sol la
    const HZ = [146.83, 155.56, 185.0, 196.0, 220.0, 233.08, 261.63, 293.66, 311.13, 369.99, 392.0, 440.0];
    // berouali : D = doum (derbouka), T = tek, B = coup grave du tar, 0 = silence
    const RHYTHM = ['D', 0, 'T', 'B', 'T', 'T'];
    // les phrases : [degré, durée en croches] ; chaque phrase dure deux mesures et retombe sur ré
    const PHRASES = [
      [[4, 1], [4, 1], [5, 1], [6, 1], [7, 2], [6, 1], [5, 1], [4, 1], [3, 1], [4, 2]],
      [[7, 3], [6, 1], [5, 1], [4, 1], [5, 2], [4, 1], [3, 1], [4, 2]],
      [[4, 2], [5, 1], [4, 1], [3, 1], [2, 1], [3, 2], [2, 1], [1, 1], [0, 2]],
      [[2, 1], [3, 1], [4, 2], [3, 1], [2, 1], [1, 2], [2, 1], [1, 1], [0, 2]],
      [[0, 1], [2, 1], [3, 1], [4, 3], [5, 1], [4, 1], [3, 2], [2, 2]],
      [[4, 1], [3, 1], [2, 1], [3, 1], [2, 1], [1, 1], [0, 6]],
    ];
    const ORDER = [0, 1, 2, 3, 0, 1, 4, 5];
    const pluckBuffer = (f) => {
      const sr = ctx.sampleRate, N = Math.round(sr / f), L = Math.floor(sr * 1.4);
      const buf = ctx.createBuffer(1, L, sr), y = buf.getChannelData(0);
      for (let i = 0; i < N; i++) y[i] = Math.random() * 2 - 1;
      y[N] = y[0] * .996;
      for (let i = N + 1; i < L; i++) y[i] = .498 * (y[i - N] + y[i - N - 1]); // corde métallique : brillante, plus courte
      return buf;
    };
    const noiseBuffer = () => {
      const b = ctx.createBuffer(1, ctx.sampleRate * .4, ctx.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      return b;
    };
    const reverb = () => {
      const sr = ctx.sampleRate, L = sr * 2.2, ir = ctx.createBuffer(2, L, sr);
      for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < L; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / L, 3.4); }
      const cv = ctx.createConvolver(); cv.buffer = ir; return cv;
    };
    let noise;
    // la kamenja : une seule voix d'archet qui glisse, avec un vibrato qui s'installe sur les notes tenues
    const makeViolin = () => {
      const o1 = ctx.createOscillator(), o2 = ctx.createOscillator(), mix = ctx.createGain();
      o1.type = 'sawtooth'; o2.type = 'sawtooth'; o2.detune.value = 7;
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2300; lp.Q.value = .8;
      const body = ctx.createBiquadFilter(); body.type = 'peaking'; body.frequency.value = 1100; body.gain.value = 6; body.Q.value = 1.2;
      const g = ctx.createGain(); g.gain.value = 0;
      const vib = ctx.createOscillator(), vg = ctx.createGain(); vib.frequency.value = 5.6; vg.gain.value = 0;
      vib.connect(vg); vg.connect(o1.frequency); vg.connect(o2.frequency);
      o1.connect(mix); o2.connect(mix); mix.connect(body); body.connect(lp); lp.connect(g); g.connect(dry); g.connect(wet);
      o1.start(); o2.start(); vib.start();
      return { o1, o2, g, vg };
    };
    const init = () => {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain(); master.gain.value = 0;
      analyser = ctx.createAnalyser(); analyser.fftSize = 256; data = new Uint8Array(analyser.fftSize);
      dry = ctx.createGain(); dry.gain.value = .9;
      wet = ctx.createGain(); wet.gain.value = .28;
      const rv = reverb();
      dry.connect(master); wet.connect(rv); rv.connect(master);
      master.connect(analyser); analyser.connect(ctx.destination);
      notes = HZ.map(pluckBuffer);
      noise = noiseBuffer();
      vio = makeViolin();
      // un bourdon très discret sur ré
      const o = ctx.createOscillator(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
      o.type = 'triangle'; o.frequency.value = 73.42; fl.type = 'lowpass'; fl.frequency.value = 300; g.gain.value = .05;
      o.connect(fl); fl.connect(g); g.connect(dry); o.start();
    };
    // le mandole : chaque note pincée sur deux cordes accordées presque pareil
    const pluck = (i, t, vel = .4) => {
      const b = notes[Math.max(0, Math.min(notes.length - 1, i))];
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 4200;
      const g = ctx.createGain(); g.gain.setValueAtTime(vel, t); g.gain.exponentialRampToValueAtTime(.001, t + 1.2);
      lp.connect(g); g.connect(dry); g.connect(wet);
      [1, 1.0035].forEach((r, k) => { const s = ctx.createBufferSource(); s.buffer = b; s.playbackRate.value = r; s.connect(lp); s.start(t + k * .006); s.stop(t + 1.3); });
    };
    const bow = (i, t, len) => {
      const f = HZ[Math.max(0, Math.min(HZ.length - 1, i))] * 2;
      [vio.o1.frequency, vio.o2.frequency].forEach((p) => p.setTargetAtTime(f, t, .035)); // le glissé entre deux notes
      vio.g.gain.setTargetAtTime(.075, t, .04);
      vio.vg.gain.cancelScheduledValues(t);
      vio.vg.gain.setValueAtTime(0, t);
      if (len >= 2) vio.vg.gain.linearRampToValueAtTime(f * .012, t + len * EIGHTH * .8);
    };
    const breathe = (t) => { vio.g.gain.setTargetAtTime(.012, t, .05); };
    const drum = (type, t) => {
      if (type === 'D' || type === 'B') {
        const o = ctx.createOscillator(), g = ctx.createGain();
        const f0 = type === 'D' ? 160 : 95;
        o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f0 * .4, t + .18);
        g.gain.setValueAtTime(type === 'D' ? .7 : .45, t); g.gain.exponentialRampToValueAtTime(.001, t + (type === 'D' ? .4 : .55));
        o.connect(g); g.connect(dry); o.start(t); o.stop(t + .6);
      }
      const n = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      n.buffer = noise;
      f.type = 'bandpass'; f.frequency.value = type === 'T' ? 3800 : type === 'K' ? 2400 : 700; f.Q.value = 1.4;
      const v = type === 'T' ? .3 : type === 'K' ? .14 : .1;
      g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.001, t + (type === 'T' || type === 'K' ? .06 : .14));
      n.connect(f); f.connect(g); g.connect(dry); g.connect(wet); n.start(t); n.stop(t + .16);
    };
    // à chaque croche : la note suivante de la phrase, jouée ensemble par la kamenja et le mandole
    const melody = (t) => {
      if (pLeft > 0) {
        pLeft--;
        const [d] = phrase[pIdx - 1];
        if (Math.random() < .45) pluck(d, t, .2); // trémolo du mandole sur les notes tenues
        return;
      }
      if (pIdx >= phrase.length) {
        phrase = PHRASES[ORDER[pCount % ORDER.length]]; pIdx = 0; pCount++;
      }
      const [d, len] = phrase[pIdx++];
      pLeft = len - 1;
      bow(d, t, len);
      pluck(d, t, .42);
      if (Math.random() < .18) pluck(Math.min(HZ.length - 1, d + 1), t - .045, .16); // petite appoggiature
      if (pIdx >= phrase.length) breathe(t + len * EIGHTH * .85);
    };
    const schedule = () => {
      while (next < ctx.currentTime + .15) {
        const d = RHYTHM[step % 6];
        if (d) drum(d, next);
        else if (Math.random() < .35) drum('K', next);
        melody(next);
        next += EIGHTH; step++;
      }
    };
    const meter = () => {
      raf = requestAnimationFrame(meter);
      analyser.getByteTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) { const v = (data[i] - 128) / 128; sum += v * v; }
      const rms = Math.sqrt(sum / data.length);
      // la pulsation : l'attaque des notes (enveloppe rapide moins enveloppe lente), pas le volume brut
      fast += (rms - fast) * .5; slow += (rms - slow) * .04;
      level += (Math.max(0, Math.min(1, (fast - slow * .85) * 22)) - level) * .4;
      turn += .04 + level * .3;
      root.style.setProperty('--beat', level.toFixed(3));
      root.style.setProperty('--turn', turn.toFixed(2));
    };
    const ramp = (v, s = 1.2) => { if (!ctx) return; master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setTargetAtTime(v, ctx.currentTime, s / 3); };
    return {
      get on() { return playing; },
      start() {
        try {
          if (!ctx) init();
          if (ctx.state === 'suspended') ctx.resume();
          if (playing) return true;
          playing = true; next = ctx.currentTime + .1;
          timer = setInterval(schedule, 25);
          ramp(target);
          cancelAnimationFrame(raf); meter();
          root.classList.add('is-playing');
          return true;
        } catch (_) { return false; }
      },
      stop() {
        if (!playing) return;
        playing = false;
        ramp(0, .6);
        setTimeout(() => { if (!playing) { clearInterval(timer); cancelAnimationFrame(raf); root.style.setProperty('--beat', 0); } }, 700);
        root.classList.remove('is-playing');
      },
      // plus fort dans le patrimoine, en fond ailleurs
      level(v) { target = v; if (playing) ramp(v); },
    };
  })();
  const wantSound = () => store.get('aw-sound') === '1';
  const setSound = (on) => {
    store.set('aw-sound', on ? '1' : '0');
    if (on) Music.start(); else Music.stop();
    syncSound();
  };

  // le bouton du son, en bas à gauche, sur toutes les pages
  const snd = document.createElement('button');
  snd.type = 'button';
  snd.className = 'snd';
  snd.innerHTML = '<span class="eq" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span class="snd__t"></span>';
  const syncSound = () => {
    const on = Music.on;
    snd.setAttribute('aria-pressed', String(on));
    snd.setAttribute('aria-label', on ? 'Couper la musique' : 'Écouter la musique du patrimoine');
    $('.snd__t', snd).textContent = on ? 'Musique' : 'Musique coupée';
    const bb = $('.band__btn');
    if (bb) { bb.setAttribute('aria-pressed', String(on)); $('span', bb).textContent = on ? 'Couper la musique' : 'Écouter le patrimoine'; }
  };
  snd.addEventListener('click', () => setSound(!Music.on));
  document.body.appendChild(snd);
  syncSound();
  const bandBtn = $('.band__btn');
  if (bandBtn) bandBtn.addEventListener('click', () => setSound(!Music.on));
  // le navigateur n'autorise le son qu'après un geste : on reprend au premier clic ou à la première touche
  if (wantSound()) {
    const resume = () => { if (wantSound() && !Music.on) { Music.start(); syncSound(); } };
    ['pointerdown', 'keydown'].forEach((ev) => addEventListener(ev, resume, { once: true, capture: true }));
  }
  // la section patrimoine monte le volume quand elle est à l'écran
  const band = $('#patrimoine');
  if (band && 'IntersectionObserver' in window) {
    new IntersectionObserver((en) => { Music.level(en[0].isIntersecting ? .8 : .32); }, { threshold: .3 }).observe(band);
  }

  /* =========================================================
     La visite guidée : des étapes choisies par le visiteur
     ========================================================= */
  const STOPS = {
    debut: [{ u: 'index.html#atelier', t: "L'atelier", h: 'Qui nous sommes : une équipe, du dessin à la pose.' }],
    portes: [{ u: 'index.html#portes', t: 'Le cadran des portes', h: 'Faites tourner le cadran : pivot, entrée, intérieures.' }, { u: 'portes.html', t: 'Toutes nos portes', h: 'Tirez les cartes de côté pour voir chaque réalisation.' }],
    cuisines: [{ u: 'cuisines.html', t: 'Nos cuisines', h: 'Bois massif, placage ou MDF laqué : sept cuisines posées.' }],
    chambres: [{ u: 'chambres-dressings.html', t: 'Chambres et dressings', h: 'Lits, dressings éclairés, placards du sol au plafond.' }],
    agencement: [{ u: 'agencement.html', t: 'Agencement professionnel', h: 'Pharmacies, boutiques, hôtels : des lieux qui reçoivent.' }],
    claustras: [{ u: 'index.html#cnc', t: 'La lumière découpée', h: 'Faites défiler : le panneau se découpe sous vos yeux.' }, { u: 'claustras.html', t: 'Claustras et CNC', h: 'Lames, moucharabiehs, arabesques.' }],
    mobilier: [{ u: 'mobilier.html', t: 'Le mobilier', h: 'Tables, buffets, assises, et le jardin en bois exotique.' }],
    parquet: [{ u: 'parquet.html', t: 'Le parquet', h: 'Lames larges, point de Hongrie, finitions.' }],
    patrimoine: [{ u: 'index.html#patrimoine', t: 'Le patrimoine, en musique', h: 'Montez le son : un air hawzi accompagne la section.', sound: true }, { u: 'inspirations.html', t: 'Inspirations mauresques', h: 'Bois sculpté, arcs, faïence : tout cela se fabrique.' }],
    fin: [{ u: 'index.html#contact', t: 'Votre rendez-vous', h: 'Nous venons mesurer et vous conseiller, sans engagement.' }],
  };
  const ORDER = ['portes', 'cuisines', 'chambres', 'agencement', 'claustras', 'mobilier', 'parquet', 'patrimoine'];
  const buildTour = (keys) => [...STOPS.debut, ...ORDER.filter((k) => keys.includes(k)).flatMap((k) => STOPS[k]), ...STOPS.fin];
  const loadTour = () => { try { return JSON.parse(store.get('aw-tour') || 'null'); } catch (_) { return null; } };
  const saveTour = (t) => store.set('aw-tour', t ? JSON.stringify(t) : null);
  const here = (u) => {
    const [p] = u.split('#');
    const cur = location.pathname.split('/').pop() || 'index.html';
    return p === cur || (p === 'index.html' && cur === '');
  };
  const goTo = (stop) => {
    const [p, hash] = stop.u.split('#');
    if (here(stop.u)) {
      const el = hash && document.getElementById(hash);
      if (el) {
        el.scrollIntoView({ behavior: motion ? 'smooth' : 'auto', block: 'start' });
        history.replaceState(null, '', `#${hash}`);
      }
      if (stop.sound && !Music.on) setSound(true);
      return;
    }
    // une autre page : on passe par le rideau (assets/site.js intercepte les liens)
    const a = document.createElement('a');
    a.href = stop.u; a.hidden = true;
    document.body.appendChild(a); a.click(); a.remove();
  };
  let tourEl = null;
  const renderTour = () => {
    const t = loadTour();
    if (!t) { if (tourEl) tourEl.classList.remove('is-on'); return; }
    if (!tourEl) {
      tourEl = document.createElement('aside');
      tourEl.className = 'tour';
      tourEl.setAttribute('aria-label', 'Visite guidée');
      tourEl.innerHTML = `<p class="tour__k"></p><p class="tour__t"></p><p class="tour__h"></p>
        <div class="tour__nav"><button type="button" class="b-round" data-d="-1" aria-label="Étape précédente">${arrowL}</button><button type="button" class="b-round is-next" data-d="1" aria-label="Étape suivante">${arrowR}</button></div>
        <div class="tour__dots" aria-hidden="true"></div>
        <button type="button" class="tour__x" aria-label="Arrêter la visite guidée">×</button>`;
      document.body.appendChild(tourEl);
      $$('.tour__nav button', tourEl).forEach((b) => b.addEventListener('click', () => {
        const s = loadTour(); if (!s) return;
        s.i = Math.max(0, Math.min(s.stops.length - 1, s.i + Number(b.dataset.d)));
        saveTour(s); renderTour(); goTo(s.stops[s.i]);
      }));
      $('.tour__x', tourEl).addEventListener('click', () => { saveTour(null); renderTour(); });
    }
    const s = t.stops[t.i], last = t.i === t.stops.length - 1;
    $('.tour__k', tourEl).textContent = `Visite guidée · étape ${t.i + 1} sur ${t.stops.length}`;
    $('.tour__t', tourEl).textContent = s.t;
    $('.tour__h', tourEl).textContent = s.h;
    $('[data-d="-1"]', tourEl).disabled = t.i === 0;
    const nx = $('[data-d="1"]', tourEl);
    nx.disabled = last;
    nx.setAttribute('aria-label', last ? 'Fin de la visite' : `Étape suivante : ${t.stops[t.i + 1].t}`);
    $('.tour__dots', tourEl).innerHTML = t.stops.map((_, k) => `<i class="${k <= t.i ? 'is-done' : ''}"></i>`).join('');
    requestAnimationFrame(() => tourEl.classList.add('is-on'));
  };
  // en arrivant sur une page : si l'étape en cours est ici, on s'y rend
  const t0 = loadTour();
  if (t0) {
    const s = t0.stops[t0.i];
    if (s && here(s.u)) {
      const hash = s.u.split('#')[1];
      if (hash) setTimeout(() => { const el = document.getElementById(hash); if (el) el.scrollIntoView({ behavior: 'auto', block: 'start' }); }, 450);
    }
    renderTour();
  }

  /* =========================================================
     L'entrée : la porte s'ouvre sur le site
     ========================================================= */
  const entry = $('.entry');
  if (entry && root.classList.contains('intro-on')) {
    const video = $('video', entry), chips = $$('.entry__chips button', entry), plan = $('.entry__plan', entry);
    const go = $('.entry__go', entry), soundBtn = $('.entry__sound', entry);
    document.body.style.overflow = 'hidden';
    const picked = () => chips.filter((c) => c.getAttribute('aria-pressed') === 'true').map((c) => c.dataset.k);
    const updatePlan = () => {
      const k = picked();
      if (!k.length) { plan.textContent = 'Choisissez une ou plusieurs étapes, ou entrez librement.'; $('span', go).textContent = 'Ouvrir la porte'; return; }
      const n = buildTour(k).length;
      plan.textContent = `Votre visite : ${n} étapes, de l'atelier jusqu'à votre rendez-vous.`;
      $('span', go).textContent = 'Ouvrir la porte et commencer';
    };
    chips.forEach((c) => c.addEventListener('click', () => { c.setAttribute('aria-pressed', String(c.getAttribute('aria-pressed') !== 'true')); updatePlan(); }));
    soundBtn.addEventListener('click', () => soundBtn.setAttribute('aria-pressed', String(soundBtn.getAttribute('aria-pressed') !== 'true')));
    let done = false;
    const finish = () => {
      root.classList.remove('intro-on');
      document.body.style.overflow = '';
      entry.remove();
      store.set('aw-intro', '1');
      if (loadTour()) renderTour();
    };
    const open = (withTour) => {
      if (done) return;
      done = true;
      const keys = withTour ? picked() : [];
      saveTour(keys.length ? { stops: buildTour(keys), i: 0 } : null);
      const sound = soundBtn.getAttribute('aria-pressed') === 'true';
      store.set('aw-sound', sound ? '1' : '0');
      if (sound) { Music.start(); Music.level(.6); }
      syncSound();
      entry.classList.add('is-opening');
      let played = false;
      try { video.playbackRate = 1.5; const p = video.play(); if (p) p.then(() => { played = true; }).catch(() => {}); } catch (_) { /* rien */ }
      // la porte s'ouvre, puis on avance dans l'embrasure
      setTimeout(() => entry.classList.add('is-going'), played || video.readyState >= 2 ? 2200 : 900);
      setTimeout(() => { entry.classList.add('is-out'); if (window.awEnter) window.awEnter(); }, 3000);
      setTimeout(() => {
        finish();
        const t = loadTour();
        if (t) setTimeout(() => goTo(t.stops[0]), 400);
      }, 4100);
    };
    go.addEventListener('click', () => open(true));
    $('.entry__skip', entry).addEventListener('click', () => {
      done = true; saveTour(null);
      entry.classList.add('is-out');
      if (window.awEnter) window.awEnter();
      setTimeout(finish, 1100);
    });
    setTimeout(() => go.focus({ preventScroll: true }), 300);
  } else if (entry) entry.remove();
})();
