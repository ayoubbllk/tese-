// Insère dans index.html les sections de l'accueil construites à partir des données des pages.
// node tools/home.mjs   (remplace ce qui se trouve entre les commentaires <!-- @nom --> et <!-- /@nom -->)
import { readFileSync, writeFileSync } from 'node:fs';
import { pages } from './pages.mjs';

const arrow = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M12.2 9H0V7h12.2L6.6 1.4 8 0l8 8-8 8-1.4-1.4z" fill="currentColor"/></svg>';
const arch = '<svg viewBox="0 0 24 32" aria-hidden="true"><path d="M3.5 31V17A9 9 0 1 1 20.5 17V31" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';
const count = (pg) => pg.groups.reduce((n, g) => n + g.photos.length, 0);

// les portes du cadran : photo, titre sur deux lignes (|), matières
const doors = [
  ['photos/nv/portes-pivot/01.jpg', 'Porte pivot|en chêne', 'Chêne massif · serrure électronique'],
  ['photos/nv/portes-pivot/04.jpg', 'Pivot|entrouverte', 'Lames horizontales · pivot décalé'],
  ['photos/nv/portes-pivot/02.jpg', 'Pivot|chêne brossé', 'Chambranle large · poignée bâton'],
  ['photos/nv/portes-pivot/03.jpg', 'Pivot|à lames', 'Placage chêne · pose en cours'],
  ['photos/nv/portes-rustiques/01.jpg', 'Double porte|en acajou', 'Panneaux moulurés · bois massif'],
  ['photos/nv/portes-rustiques/04.jpg', 'Double porte|vitrée', 'Chêne vieilli · encadrement de pierre'],
  ['photos/nv/portes-rustiques/02.jpg', 'Entrée|à semi-fixe', 'Bois verni · panneaux moulurés'],
  ['photos/nv/portes-rustiques/05.jpg', 'Porte|à fronton', 'Moulures · bois massif'],
  ['photos/nv/portes-rustiques/03.jpg', 'Porte vitrée|noire', 'Petits bois · deux fixes latéraux'],
  ['photos/nv/portes-interieures/01.jpg', 'Portes|graphiques', 'Incrustations · portes intérieures'],
  ['photos/825281865_122276104730174344_798134851784821914_n.jpg', 'Porte vitrée|à petits bois', 'Semi-fixe · porte intérieure'],
  ['photos/nv/portes-interieures/02.jpg', 'Portes|en noyer', 'Chambranles assortis · intérieur'],
];

const sx = `
  <!-- ============ Savoir-faire — l'index des huit métiers, la photo suit le pointeur ============ -->
  <section class="sx" id="savoir-faire" aria-labelledby="sx-title">
    <div class="wrap sx__head">
      <div>
        <p class="kicker reveal">Savoir-faire</p>
        <h2 id="sx-title" class="h2" data-split>Huit métiers, <em>un seul atelier.</em></h2>
      </div>
      <p class="txt reveal">De la porte d'entrée au parquet, de la cuisine au claustra : tout est dessiné, fabriqué et posé par la même équipe. Choisissez un métier pour voir nos réalisations.</p>
    </div>
    <ol class="wrap sx__list">
${pages.map((p, i) => `      <li><a class="sx__row" href="${p.slug}.html"><span class="sx__thumb" aria-hidden="true"><img src="${p.hero.src}" alt="" loading="lazy"></span><span class="sx__n">${String(i + 1).padStart(2, '0')}</span><span class="sx__name">${p.menu}</span><span class="sx__short">${p.short}</span><span class="sx__count">${count(p)} ${p.inspiration ? 'images' : 'photos'}</span><span class="sx__go" aria-hidden="true">${arrow}</span></a></li>`).join('\n')}
    </ol>
    <div class="sx__float" aria-hidden="true">
${pages.map((p) => `      <img src="${p.hero.src}" alt="" loading="lazy">`).join('\n')}
    </div>
  </section>

  <!-- la bande des métiers, qui accélère avec le défilement -->
  <div class="mq" aria-hidden="true">
    <div class="mq__row"><div class="mq__track">${pages.filter((p) => !p.inspiration).map((p) => `<span>${p.menu}</span>${arch}`).join('')}</div></div>
    <div class="mq__row mq__row--rev"><div class="mq__track">${['Dessiné avec vous', 'Fabriqué à Alger', 'Posé par nous', 'Bois massif', 'Sur mesure'].map((t) => `<span>${t}</span>${arch}`).join('')}</div></div>
  </div>

  <!-- ============ Les portes — un cadran (d'après le composant Framer « Volvelle ») ============ -->
  <section class="vv" id="portes" aria-labelledby="vv-title">
    <div class="vv__amb" aria-hidden="true"></div>
    <svg class="vv__rims" aria-hidden="true"></svg>
    <div class="vv__text">
      <p class="kicker">Portes · pivot, entrée, intérieures</p>
      <h2 id="vv-title" class="vv__title">${doors[0][1].replace('|', '<br>')}</h2>
      <p class="vv__mat">${doors[0][2]}</p>
      <p class="txt vv__lead">Pivot décalé, âme blindée, bois massif : des portes lourdes qui s'ouvrent d'une main. Faites tourner le cadran, ou laissez-le avancer seul.</p>
      <a class="vv__more" href="portes.html">Toutes nos portes ${arrow}</a>
    </div>
    <div class="vv__photo" aria-hidden="true"><div class="vv__pours"><div class="vv__pour"><img src="${doors[0][0]}" alt="" loading="lazy"></div></div></div>
    <div class="vv__side">
      <p class="vv__n" aria-live="polite"><b>01</b><span>/ ${String(doors.length).padStart(2, '0')}</span></p>
      <div class="vv__btns">
        <button type="button" class="b-round" data-dir="-1" aria-label="Porte précédente"><svg viewBox="0 0 18 12" aria-hidden="true"><path d="M18 6H2M7 1L2 6l5 5" fill="none" stroke="currentColor" stroke-width="1.6"/></svg></button>
        <button type="button" class="b-round" data-dir="1" aria-label="Porte suivante"><svg viewBox="0 0 18 12" aria-hidden="true"><path d="M0 6h16M11 1l5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.6"/></svg></button>
      </div>
      <p class="vv__timer" aria-hidden="true"><i></i></p>
    </div>
    <div class="vv__dial" tabindex="0" role="group" aria-roledescription="carrousel" aria-label="Nos portes. Flèches gauche et droite pour tourner le cadran.">
      <svg class="vv__ring" aria-hidden="true"></svg>
      <span class="vv__notch" aria-hidden="true"></span>
${doors.map(([src, t, m], i) => `      <button type="button" class="vv__card" data-title="${t}" data-mat="${m}" aria-label="${t.replace('|', ' ')}"><img src="${src}" alt="" loading="lazy" draggable="false"><span>${String(i + 1).padStart(2, '0')}</span></button>`).join('\n')}
    </div>
  </section>
`;

const hzPhotos = [[3, 'Mur-cheminée en bois sculpté', .98, 66], [2, 'Colonne ajourée et éclairée', .67, 70], [6, 'Cuisine sculptée et zellige vert', 1.5, 52], [8, 'Séparation sculptée à étagères', 1.05, 64], [5, 'Boutique de parfums, boiseries et faïence', 1.4, 58], [1, 'Meuble TV à arcs sculptés', .6, 70], [9, 'Cuisine aux portes en arc', 1, 60]];
const hz = `
  <!-- ============ Inspirations mauresques — la galerie avance de côté ============ -->
  <section class="hz" id="inspirations" aria-labelledby="hz-title">
    <div class="hz__stage">
      <div class="hz__track">
        <div class="hz__intro">
          <p class="kicker">Inspirations</p>
          <h2 id="hz-title" class="h2" data-split>Le bois sculpté, <em>à la mauresque.</em></h2>
          <p class="txt">Arcs outrepassés, moucharabiehs, façades ciselées : des pistes pour imaginer votre intérieur. Tout ce que vous voyez ici, nous savons le fabriquer.</p>
          <a class="b-pill" href="inspirations.html"><span>Voir les inspirations</span><i aria-hidden="true">${arrow.replace('aria-hidden="true"', 'preserveAspectRatio="none"')}</i></a>
          <p class="hz__note">Images d'intention, pas des réalisations Nejera.</p>
        </div>
${hzPhotos.map(([n, cap, r, h]) => `        <a class="hz__card" href="inspirations.html" style="--r:${r};--h:${h}vh"><span class="hz__img"><img src="photos/nv/mauresque/${String(n).padStart(2, '0')}.jpg" alt="${cap}" loading="lazy"></span><span class="hz__cap"><b>${cap}</b><i>Inspiration</i></span></a>`).join('\n')}
        <a class="hz__end" href="inspirations.html">Toutes les inspirations<span>Ouvrir la page ${arrow}</span></a>
      </div>
      <div class="hz__bar" aria-hidden="true"><i></i></div>
    </div>
  </section>
`;

// motif de moucharabieh : une étoile à huit branches par carreau, qui grandit avec le défilement
const cx = `
  <!-- ============ Claustras & CNC — le panneau se découpe, la photo apparaît ============ -->
  <section class="cx" id="cnc" aria-labelledby="cx-title">
    <div class="cx__stage">
      <div class="cx__panel">
        <svg class="cx__svg" viewBox="0 0 800 1000" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Panneau arabesque en bois découpé, encadré de bois massif">
          <defs>
            <pattern id="cx-p" width="80" height="80" patternUnits="userSpaceOnUse">
              <g id="cx-star" transform="translate(40 40) scale(.42) translate(-40 -40)">
                <rect x="16" y="16" width="48" height="48" fill="#fff"/>
                <rect x="16" y="16" width="48" height="48" fill="#fff" transform="rotate(45 40 40)"/>
              </g>
            </pattern>
            <mask id="cx-m" maskUnits="userSpaceOnUse" x="0" y="0" width="800" height="1000"><rect width="800" height="1000" fill="url(#cx-p)"/></mask>
          </defs>
          <image href="photos/nv/cnc/04.jpg" width="800" height="1000" preserveAspectRatio="xMidYMid slice" mask="url(#cx-m)"/>
        </svg>
        <p class="tag">Réalisation · panneau arabesque</p>
      </div>
      <div class="cx__text">
        <p class="kicker">Claustras &amp; CNC</p>
        <h2 id="cx-title" class="h2">La lumière, <em>découpée.</em></h2>
        <p class="txt">Moucharabiehs, arabesques, motifs géométriques : la machine découpe le dessin au dixième de millimètre, la main assemble et finit. Pour séparer une pièce sans la fermer.</p>
        <div class="cx__minis" aria-hidden="true"><img src="photos/nv/cnc/05.jpg" alt="" loading="lazy"><img src="photos/nv/claustras/01.jpg" alt="" loading="lazy"><img src="photos/nv/cnc/02.jpg" alt="" loading="lazy"></div>
        <a class="b-pill" href="claustras.html"><span>Claustras et CNC</span><i aria-hidden="true">${arrow.replace('aria-hidden="true"', 'preserveAspectRatio="none"')}</i></a>
      </div>
    </div>
  </section>
`;

let h = readFileSync('index.html', 'utf8');
const put = (name, html, after) => {
  const re = new RegExp(`\\n  <!-- @${name} -->[\\s\\S]*?<!-- /@${name} -->\\n`);
  const block = `\n  <!-- @${name} -->${html}  <!-- /@${name} -->\n`;
  if (re.test(h)) h = h.replace(re, block);
  else { const i = h.indexOf(after); if (i < 0) throw new Error(`repère introuvable : ${name}`); h = h.slice(0, i) + block + h.slice(i); }
};
put('savoir-faire', sx, '\n  <!-- ============ Méthode');
put('inspirations', hz, '\n  <!-- ============ Réalisations');
put('cnc', cx, '\n  <!-- ============ Pour qui');
writeFileSync('index.html', h);
console.log('accueil mis à jour');
