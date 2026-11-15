/* Nejera wa Tasmim El Khacheb — prise de rendez-vous en cinq étapes :
   ouvrages, mesures, essences (avec conseil), créneau, coordonnées. La fiche projet se remplit à côté,
   avec ce que nous apporterons et ce que nous évaluerons sur place. Envoi par e-mail ou WhatsApp. */
(() => {
  const form = document.getElementById('rdv');
  if (!form) return;
  const $ = (s, c = form) => c.querySelector(s);
  const $$ = (s, c = form) => [...c.querySelectorAll(s)];
  const sheet = document.querySelector('.rdv__sheet');
  const steps = $$('.rdv__step'), tabs = $$('.rdv__steps button');
  const next = $('.rdv__next'), back = $('.rdv__back'), err = $('.rdv__err'), done = $('.rdv__done');
  const advice = $('.rdv__advice'), woods = $$('.wood');
  // numéro WhatsApp de l'atelier (format international, sans +)
  const WHATSAPP = '213778577790';
  const MAIL = 'Abel95b@yahoo.fr';
  let cur = 0, reached = 0;

  const vals = (name) => $$(`[name="${name}"]:checked`).map((i) => i.value);
  const val = (name) => { const el = $(`[name="${name}"]`); if (!el) return ''; if (el.type === 'radio') return vals(name)[0] || ''; return el.value.trim(); };

  // le conseil : quelles essences pour quels ouvrages
  const RULES = [
    { o: ["Porte d'entrée"], w: ['iroko', 'chene', 'acajou'], why: "pour une porte d'entrée, un bois qui supporte le soleil et l'humidité" },
    { o: ['Porte pivot'], w: ['chene', 'noyer'], why: 'pour une porte pivot, du chêne ou du noyer sur une âme stable' },
    { o: ['Portes intérieures'], w: ['chene', 'noyer', 'mdf'], why: 'pour les portes intérieures, chêne, noyer ou MDF laqué selon le style' },
    { o: ['Cuisine'], w: ['chene', 'noyer', 'mdf'], why: 'pour une cuisine, des façades en chêne, en noyer ou en MDF laqué, faciles à entretenir' },
    { o: ['Dressing ou placard', 'Chambre'], w: ['mdf', 'chene', 'hetre'], why: 'pour les rangements et les chambres, MDF laqué, chêne ou hêtre' },
    { o: ['Agencement de commerce'], w: ['chene', 'mdf'], why: 'pour un lieu qui reçoit du public, des surfaces robustes en chêne ou en MDF laqué' },
    { o: ['Claustra ou CNC'], w: ['mdf', 'chene', 'noyer'], why: 'pour une découpe fine, du MDF ; pour des lames, du chêne ou du noyer massif' },
    { o: ['Mobilier'], w: ['chene', 'noyer', 'frene'], why: 'pour le mobilier, chêne, noyer ou frêne, qui vieillissent bien' },
    { o: ['Mobilier de jardin'], w: ['teck', 'iroko'], why: "pour l'extérieur, du teck ou de l'iroko, imputrescibles" },
    { o: ['Parquet'], w: ['chene', 'acajou'], why: 'pour un parquet, du chêne ou de l\'acajou, durs et stables' },
    { o: ['Décor mauresque'], w: ['noyer', 'acajou'], why: 'pour la sculpture, du noyer ou de l\'acajou, au grain fin' },
  ];
  const NAME = { chene: 'chêne', noyer: 'noyer', frene: 'frêne', hetre: 'hêtre', acajou: 'acajou', iroko: 'iroko', teck: 'teck', mdf: 'MDF laqué' };
  const advise = () => {
    const ouv = vals('ouvrages'), usage = val('usage');
    const hit = RULES.filter((r) => r.o.some((o) => ouv.includes(o)));
    const set = new Set(hit.flatMap((r) => r.w));
    if (usage !== 'Intérieur') { set.add('iroko'); set.add('teck'); }
    woods.forEach((w) => w.classList.toggle('is-advised', set.has(w.dataset.w)));
    if (!hit.length) {
      advice.innerHTML = usage === 'Intérieur'
        ? 'Choisissez vos ouvrages à l\'étape 1 : nous vous indiquerons les essences adaptées.'
        : '<b>Notre conseil :</b> pour l\'extérieur, de l\'iroko ou du teck, qui résistent à l\'humidité.';
      return [...set];
    }
    advice.innerHTML = `<b>Notre conseil :</b> ${hit.slice(0, 3).map((r) => r.why).join(' ; ')}.${usage !== 'Intérieur' ? ' À l\'extérieur, privilégiez l\'iroko ou le teck.' : ''}`;
    return [...set];
  };

  // la fiche projet, et ce que l'on prévoit pour la visite
  const fill = () => {
    const ouv = vals('ouvrages'), ess = vals('essences'), adv = advise();
    const f = (k) => sheet.querySelector(`[data-f="${k}"]`);
    f('ouvrages').textContent = ouv.join(', ');
    f('lieu').textContent = [val('lieu'), val('usage') && val('usage').toLowerCase()].filter(Boolean).join(' · ');
    const nb = val('nombre'), piece = val('piece'), cotes = val('cotes');
    f('mesures').textContent = [val('mesures'), nb && nb !== '1' ? `${nb} ouvrages` : '', piece, cotes].filter(Boolean).join(' · ');
    f('essences').textContent = ess.length ? `${ess.join(', ')} · finition : ${val('finition').toLowerCase()}` : adv.length ? `À conseiller (piste : ${adv.slice(0, 3).map((w) => NAME[w]).join(', ')})` : '';
    const date = val('date');
    const dTxt = date ? new Date(`${date}T12:00`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) : '';
    f('rdv').textContent = cur >= 3 || date || val('commune') ? [val('lieu_rdv'), val('commune'), dTxt, val('creneau')].filter(Boolean).join(' · ') : '';
    const woodsTo = ess.length ? ess : adv.slice(0, 3).map((w) => NAME[w]);
    const apport = [
      'Un télémètre laser et un relevé dessiné sur place',
      woodsTo.length ? `Des échantillons : ${woodsTo.join(', ')}` : 'Des échantillons de nos essences',
      'Le nuancier des teintes, huiles, vernis et laques',
      'Des photos de réalisations proches de votre projet',
    ];
    const ev = new Set(['Les aplombs, les niveaux et l\'état des murs', "L'accès pour la livraison et la pose"]);
    if (ouv.some((o) => /Porte/.test(o))) { ev.add('Le sens d\'ouverture, la quincaillerie, la serrure'); ev.add('Le seuil et le chambranle existants'); }
    if (ouv.includes('Porte pivot')) ev.add('Le poids du vantail et l\'ancrage du pivot au sol');
    if (ouv.includes('Cuisine')) { ev.add('Les arrivées d\'eau, d\'électricité et l\'évacuation de la hotte'); ev.add('La place de l\'électroménager'); }
    if (ouv.some((o) => /Dressing|Chambre/.test(o))) ev.add('Les angles, sous-pentes et hauteurs sous plafond');
    if (ouv.includes('Parquet')) ev.add('La planéité et l\'humidité du support');
    if (ouv.includes('Agencement de commerce')) ev.add('Le flux du public et les contraintes du bâtiment');
    if (ouv.includes('Claustra ou CNC') || ouv.includes('Décor mauresque')) ev.add('La lumière, et le dessin du motif avec vous');
    if (val('usage') !== 'Intérieur') ev.add('L\'exposition au soleil et à la pluie');
    f('apport').innerHTML = apport.map((t) => `<li>${t}</li>`).join('');
    f('eval').innerHTML = [...ev].map((t) => `<li>${t}</li>`).join('');
  };

  const show = (i) => {
    cur = i; reached = Math.max(reached, i);
    steps.forEach((s, k) => s.classList.toggle('is-on', k === i));
    tabs.forEach((t, k) => { t.classList.toggle('is-on', k === i); t.classList.toggle('is-done', k < i); t.setAttribute('aria-current', k === i ? 'step' : 'false'); });
    back.hidden = i === 0;
    $('span', next).textContent = i === steps.length - 1 ? 'Demander le rendez-vous' : 'Continuer';
    err.textContent = '';
    fill();
  };
  const check = (i) => {
    if (i === 0 && !vals('ouvrages').length) return 'Choisissez au moins un ouvrage.';
    if (i === 4) {
      let bad = null;
      ['nom', 'tel'].forEach((n) => { const el = $(`[name="${n}"]`); const ko = !el.value.trim(); el.setAttribute('aria-invalid', String(ko)); if (ko && !bad) bad = el; });
      if (bad) { bad.focus(); return 'Indiquez votre nom et votre téléphone pour que nous puissions vous rappeler.'; }
    }
    return '';
  };
  const message = () => {
    const L = (k) => sheet.querySelector(`[data-f="${k}"]`).textContent;
    const lines = [
      `Demande de rendez-vous — prise de mesure et conseil`,
      '',
      `Nom : ${val('nom')}`,
      `Téléphone : ${val('tel')}`,
      val('mail') ? `E-mail : ${val('mail')}` : '',
      '',
      `Ouvrages : ${L('ouvrages')}`,
      `Lieu : ${L('lieu')}`,
      `Mesures : ${L('mesures')}`,
      `Essences : ${L('essences')}`,
      `Rendez-vous : ${L('rdv')}`,
      val('message') ? `\nMessage : ${val('message')}` : '',
    ];
    return lines.filter((l, k) => l || lines[k - 1]).join('\n');
  };

  // date : pas avant demain
  const dIn = $('[name="date"]');
  if (dIn) { const t = new Date(Date.now() + 864e5); dIn.min = t.toISOString().slice(0, 10); }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const m = check(cur);
    if (m) { err.textContent = m; return; }
    if (cur < steps.length - 1) { show(cur + 1); form.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
    const body = message();
    const subject = `Rendez-vous — ${vals('ouvrages').join(', ')} — ${val('nom')}`;
    done.innerHTML = `Merci ! Votre messagerie s'ouvre avec la demande prête à envoyer. Vous préférez WhatsApp ? <a href="https://wa.me/${WHATSAPP}?text=${encodeURIComponent(body)}" target="_blank" rel="noopener">Envoyer par WhatsApp</a>.`;
    window.location.href = `mailto:${MAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
  back.addEventListener('click', () => show(Math.max(0, cur - 1)));
  tabs.forEach((t, k) => t.addEventListener('click', () => {
    if (k > cur) { const m = check(cur); if (m) { err.textContent = m; return; } }
    if (k <= reached + 1) show(k);
  }));
  form.addEventListener('input', (e) => { if (e.target.getAttribute('aria-invalid') === 'true' && e.target.value.trim()) e.target.setAttribute('aria-invalid', 'false'); fill(); });
  form.addEventListener('change', fill);
  show(0);
})();
