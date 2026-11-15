/* Nejera wa Tasmim El Khacheb — la visite : l'entrée par la porte, la visite guidée d'étape en étape,
   et la musique du patrimoine (oud et darbouka joués en direct, sans fichier audio). */
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
     La musique : un oud (cordes pincées, synthèse Karplus-Strong) en maqâm hijaz sur ré,
     une darbouka au rythme maqsûm, un bourdon grave. Tout est calculé dans le navigateur.
     ========================================================= */
  const Music = (() => {
    let ctx = null, master, dry, wet, analyser, data, timer = 0, next = 0, step = 0, playing = false, notes = [], deg = 4;
    let level = 0, turn = 0, raf = 0, target = .45, fast = 0, slow = 0;
    const BPM = 96, EIGHTH = 60 / BPM / 2;
    // hijaz sur ré : ré mi♭ fa♯ sol la si♭ do ré…
    const HZ = [146.83, 155.56, 185.0, 196.0, 220.0, 233.08, 261.63, 293.66, 311.13, 369.99, 392.0, 440.0];
    const RHYTHM = ['D', 'T', 0, 'T', 'D', 0, 'T', 0];
    const pluckBuffer = (f) => {
      const sr = ctx.sampleRate, N = Math.round(sr / f), L = Math.floor(sr * 1.8);
      const buf = ctx.createBuffer(1, L, sr), y = buf.getChannelData(0);
      for (let i = 0; i < N; i++) y[i] = Math.random() * 2 - 1;
      for (let i = 1; i < N; i++) y[i] = (y[i] + y[i - 1]) * .5; // attaque un peu adoucie, comme une plume
      y[N] = y[0] * .997;
      for (let i = N + 1; i < L; i++) y[i] = .4985 * (y[i - N] + y[i - N - 1]);
      return buf;
    };
    const noiseBuffer = () => {
      const b = ctx.createBuffer(1, ctx.sampleRate * .4, ctx.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      return b;
    };
    const reverb = () => {
      const sr = ctx.sampleRate, L = sr * 2.6, ir = ctx.createBuffer(2, L, sr);
      for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < L; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / L, 3.2); }
      const cv = ctx.createConvolver(); cv.buffer = ir; return cv;
    };
    let noise;
    const init = () => {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain(); master.gain.value = 0;
      analyser = ctx.createAnalyser(); analyser.fftSize = 256; data = new Uint8Array(analyser.fftSize);
      dry = ctx.createGain(); dry.gain.value = .9;
      wet = ctx.createGain(); wet.gain.value = .32;
      const rv = reverb();
      dry.connect(master); wet.connect(rv); rv.connect(master);
      master.connect(analyser); analyser.connect(ctx.destination);
      notes = HZ.map(pluckBuffer);
      noise = noiseBuffer();
      // le bourdon : ré et la graves, filtrés, qui respirent lentement
      [73.42, 110].forEach((f, k) => {
        const o = ctx.createOscillator(), fl = ctx.createBiquadFilter(), g = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain();
        o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = k ? 4 : -3;
        fl.type = 'lowpass'; fl.frequency.value = 380; fl.Q.value = .6;
        g.gain.value = .035;
        lfo.frequency.value = .07 + k * .03; lg.gain.value = 140; lfo.connect(lg); lg.connect(fl.frequency);
        o.connect(fl); fl.connect(g); g.connect(dry); g.connect(wet);
        o.start(); lfo.start();
      });
    };
    const pluck = (i, t, vel = .5) => {
      const s = ctx.createBufferSource(); s.buffer = notes[Math.max(0, Math.min(notes.length - 1, i))];
      const body = ctx.createBiquadFilter(); body.type = 'peaking'; body.frequency.value = 320; body.gain.value = 5; body.Q.value = 1;
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600;
      const g = ctx.createGain(); g.gain.setValueAtTime(vel, t); g.gain.exponentialRampToValueAtTime(.001, t + 1.7);
      s.connect(body); body.connect(lp); lp.connect(g); g.connect(dry); g.connect(wet);
      s.start(t); s.stop(t + 1.8);
    };
    const drum = (type, t) => {
      if (type === 'D') { // doum : le grave, au centre de la peau
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(58, t + .2);
        g.gain.setValueAtTime(.75, t); g.gain.exponentialRampToValueAtTime(.001, t + .45);
        o.connect(g); g.connect(dry); o.start(t); o.stop(t + .5);
      }
      const n = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      n.buffer = noise;
      f.type = 'bandpass'; f.frequency.value = type === 'D' ? 900 : type === 'T' ? 3600 : 2200; f.Q.value = 1.4;
      const v = type === 'D' ? .12 : type === 'T' ? .32 : .16;
      g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.001, t + (type === 'D' ? .12 : .07));
      n.connect(f); f.connect(g); g.connect(dry); g.connect(wet); n.start(t); n.stop(t + .15);
    };
    // la mélodie : une marche dans le maqâm, qui revient sur ré à chaque fin de phrase
    const melody = (t, s) => {
      const bar = Math.floor(s / 8) % 4, pos = s % 8;
      if (bar === 3 && pos >= 4) { if (pos === 4) pluck(bar % 2 ? 0 : 7, t, .55); return; }
      if (Math.random() < (pos % 2 ? .38 : .62)) {
        const leap = Math.random() < .2 ? (Math.random() < .5 ? -2 : 2) : (Math.random() < .5 ? -1 : 1);
        deg = Math.max(0, Math.min(HZ.length - 1, deg + leap));
        if (Math.random() < .12) { for (let k = 0; k < 3; k++) pluck(deg, t + k * EIGHTH / 3, .3); } // trémolo
        else pluck(deg, t, pos === 0 ? .55 : .38);
      }
    };
    const schedule = () => {
      while (next < ctx.currentTime + .15) {
        const d = RHYTHM[step % 8];
        if (d) drum(d, next);
        else if (Math.random() < .3) drum('K', next);
        melody(next, step);
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
    patrimoine: [{ u: 'index.html#patrimoine', t: 'Le patrimoine, en musique', h: 'Montez le son : oud et darbouka accompagnent la section.', sound: true }, { u: 'inspirations.html', t: 'Inspirations mauresques', h: 'Bois sculpté, arcs, faïence : tout cela se fabrique.' }],
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
