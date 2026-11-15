// Insère dans index.html les sections de l'accueil construites à partir des données des pages.
// node tools/home.mjs   (remplace ce qui se trouve entre les commentaires <!-- @nom --> et <!-- /@nom -->)
import { readFileSync, writeFileSync } from 'node:fs';
import { pages } from './pages.mjs';

const arrow = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M12.2 9H0V7h12.2L6.6 1.4 8 0l8 8-8 8-1.4-1.4z" fill="currentColor"/></svg>';
const arch = '<svg viewBox="0 0 24 32" aria-hidden="true"><path d="M3.5 31V17A9 9 0 1 1 20.5 17V31" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';
const count = (pg) => pg.groups.reduce((n, g) => n + g.photos.length, 0);

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

  <!-- ============ La porte pivot — les photos tournent sur leur axe ============ -->
  <section class="pv" id="pivot" aria-labelledby="pv-title">
    <div class="pv__stage">
      <div class="pv__text">
        <p class="kicker">Portes pivotantes</p>
        <h2 id="pv-title" class="h2">Une porte lourde <em>qui s'ouvre d'une main.</em></h2>
        <p class="txt">Le pivot, décalé du bord, porte tout le poids du vantail. La porte peut être large, blindée, habillée de chêne massif : elle tourne sans effort, sans gond apparent.</p>
        <ul class="pv__specs"><li>Chêne massif</li><li>Âme blindée</li><li>Serrure électronique</li><li>Sur mesure</li></ul>
        <p class="pv__cap" aria-live="polite"><span class="pv__n">01 / 04</span><span class="pv__capt">Porte pivot en chêne, poignée bâton</span></p>
        <a class="pv__more" href="portes.html">Toutes nos portes ${arrow}</a>
      </div>
      <div class="pv__scene">
        <div class="pv__frame">
          <div class="pv__opening">
            <figure class="pv__leaf"><img src="photos/nv/portes-pivot/01.jpg" width="1024" height="1280" loading="lazy" alt="Porte pivot en chêne, poignée bâton"></figure>
            <figure class="pv__leaf"><img src="photos/nv/portes-pivot/02.jpg" width="768" height="1024" loading="lazy" alt="Porte pivot en chêne brossé, chambranle large"></figure>
            <figure class="pv__leaf"><img src="photos/nv/portes-rustiques/01.jpg" width="960" height="1280" loading="lazy" alt="Porte double en acajou, panneaux moulurés"></figure>
            <figure class="pv__leaf"><img src="photos/nv/portes-pivot/04.jpg" width="1024" height="1280" loading="lazy" alt="Porte pivot entrouverte, lames horizontales"></figure>
          </div>
          <span class="pv__axis" aria-hidden="true"></span>
        </div>
      </div>
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
          <p class="hz__note">Images d'intention, pas des réalisations Act Wood.</p>
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
