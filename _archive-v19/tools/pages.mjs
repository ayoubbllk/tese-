// Génère les pages « savoir-faire » d'Act Wood à partir des données ci-dessous.
// node tools/pages.mjs   (réécrit les fichiers .html à la racine)
import { writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const NV = 'photos/nv/';
const OLD = 'photos/';

// taille réelle des photos (pour width/height, sans décalage au chargement)
const size = (src) => {
  try {
    const out = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', src]).toString().trim();
    const [w, h] = out.split(',').map(Number);
    return { w, h };
  } catch { return { w: 1200, h: 1500 }; }
};

const P = (dir, n, cap) => ({ src: `${NV}${dir}/${String(n).padStart(2, '0')}.jpg`, cap });
const O = (file, cap) => ({ src: `${OLD}${file}`, cap });

export const pages = [
  {
    slug: 'portes', menu: 'Portes', short: 'Entrée, pivot, intérieures',
    title: 'Portes en bois massif', h1: 'Des portes <em>qui ont du poids.</em>',
    desc: "Portes d'entrée rustiques, portes pivotantes blindées et portes intérieures en bois massif, dessinées, fabriquées et posées par Act Wood à Alger.",
    lead: "Une porte se touche tous les jours. Nous la dessinons pour votre seuil, la fabriquons en bois massif et la posons nous-mêmes, réglages compris.",
    filmOnce: true, hero: P('portes-pivot', 4), heroCap: 'Porte pivot entrouverte',
    statement: "La porte d'entrée est la première chose qu'on voit de chez vous, <em>et la dernière qu'on oublie.</em>",
    body: "Chambranles, moulures, vitrages, quincaillerie : tout se décide avec vous, à partir de vos cotes. Pour l'entrée, nous renforçons l'âme de la porte et l'équipons d'une serrure multipoints ou électronique.",
    makes: ["Portes d'entrée simples et doubles", 'Portes pivotantes, blindées', 'Portes intérieures et palières', 'Chambranles, frontons, semi-fixes'],
    groups: [
      { id: 'pivot', title: 'Portes <em>pivotantes</em>', text: "Lourdes et blindées, montées sur un pivot décalé : elles s'ouvrent d'une main. Lames de chêne, poignée bâton, serrure électronique en option.", photos: [P('portes-pivot', 1, 'Porte pivot en chêne, poignée bâton et serrure électronique'), P('portes-pivot', 4, 'Porte pivot entrouverte, lames horizontales'), P('portes-pivot', 2, 'Porte pivot en chêne brossé, chambranle large'), P('portes-pivot', 3, 'Porte pivot à lames, juste avant la fin du chantier')] },
      { id: 'entree', title: "Portes d'entrée <em>en bois massif</em>", text: "Panneaux moulurés, vitrages à petits bois, frontons : des portes au caractère rustique, faites pour durer des décennies.", photos: [P('portes-rustiques', 1, 'Porte double en acajou, panneaux moulurés'), P('portes-rustiques', 4, 'Porte double vitrée en chêne vieilli, encadrement de pierre'), P('portes-rustiques', 2, "Porte d'entrée à semi-fixe, bois verni"), P('portes-rustiques', 5, 'Porte à panneaux et fronton mouluré'), P('portes-rustiques', 3, 'Porte vitrée noire à petits bois, deux fixes latéraux')] },
      { id: 'interieures', title: 'Portes <em>intérieures</em>', text: "Pleines, vitrées ou décorées d'incrustations : des portes assorties à vos sols et à vos rangements, avec leurs chambranles.", photos: [P('portes-interieures', 1, 'Portes intérieures à incrustations graphiques'), O('825281865_122276104730174344_798134851784821914_n.jpg', 'Porte vitrée à petits bois, avec semi-fixe'), P('portes-interieures', 2, 'Portes intérieures en noyer, chambranles assortis'), P('portes-interieures', 3, 'Porte en chêne noueux, quincaillerie noire'), O('825281497_122276104688174344_2855393098319513181_n.jpg', 'Porte à trois panneaux moulurés, teinte noyer'), P('portes-interieures', 4, 'Porte intérieure en chêne, pendant la pose')] },
    ],
  },
  {
    slug: 'cuisines', menu: 'Cuisines', short: 'Bois massif, placage, MDF laqué',
    title: 'Cuisines sur mesure', h1: 'La cuisine, <em>à vos mesures.</em>',
    desc: 'Cuisines sur mesure en bois massif, placage ou MDF laqué : conception, fabrication et pose par Act Wood à Alger.',
    lead: "Bois massif, placage ou MDF laqué : nous partons de votre façon de cuisiner pour dessiner les rangements, les hauteurs et les finitions.",
    hero: P('cuisines', 6), heroCap: 'Cuisine en noyer, îlot sombre',
    statement: "Une cuisine réussie, c'est d'abord <em>un geste qui tombe juste.</em>",
    body: "Hauteur du plan de travail, profondeur des tiroirs, place du four : nous relevons tout sur place. Les caissons sont fabriqués à l'atelier, puis posés et réglés chez vous avec l'électroménager.",
    makes: ['Cuisines en L, en U, avec îlot', 'Façades bois massif, placage ou laquées', 'Colonnes four et réfrigérateur', 'Plans de travail et crédences'],
    groups: [
      { id: 'cuisines', title: 'Nos <em>cuisines</em>', text: "Du chêne clair au noyer, du vert sauge au blanc laqué : chaque cuisine est dessinée pour sa pièce.", photos: [P('cuisines', 6, 'Cuisine noyer, îlot en céramique sombre'), P('cuisines', 4, 'Cuisine vert sauge, plan de travail chêne'), P('cuisines', 2, 'Cuisine laquée blanche, poignées laiton'), P('cuisines', 3, 'Cuisine chêne et anthracite, bar à claire-voie'), P('cuisines', 7, 'Cuisine en merisier, colonnes four'), P('cuisines', 5, 'Cuisine béton et noyer, crédence en bois'), P('cuisines', 1, 'Cuisine en L, façades chêne à cadre')] },
    ],
  },
  {
    slug: 'chambres-dressings', menu: 'Chambres & dressings', short: 'Lits, dressings, placards',
    title: 'Chambres, dressings et placards', h1: 'Chaque chose <em>à sa place.</em>',
    desc: 'Chambres, lits, dressings et placards sur mesure en bois, fabriqués et posés par Act Wood à Alger.',
    lead: "Lits, têtes de lit, dressings, placards d'entrée : des rangements dessinés au centimètre près, du sol au plafond.",
    filmOnce: true, hero: P('dressings', 3), heroCap: 'Dressing éclairé',
    statement: "Un bon rangement ne se voit pas. <em>Il fait juste de la place.</em>",
    body: "Nous dessinons l'intérieur avec vous : penderie, tiroirs, étagères, éclairage. Les angles, les sous-pentes et les murs irréguliers sont notre quotidien.",
    makes: ['Lits et têtes de lit', 'Dressings ouverts ou fermés', "Placards, meubles d'entrée", 'Chambres d\'enfants'],
    groups: [
      { id: 'chambres', title: 'Chambres <em>et dressings</em>', text: "Lits en chêne massif, dressings éclairés, armoires coulissantes : la chambre entière, d'un même bois.", photos: [P('dressings', 3, 'Dressing éclairé, étagères et tiroirs'), P('dressings', 1, 'Chambre parentale, tête de lit capitonnée et coiffeuse'), P('dressings', 4, 'Dressing en U, noyer'), P('dressings', 2, 'Lit à tiroirs, tête de lit à tasseaux éclairés'), P('dressings', 7, 'Armoire coulissante en chêne, panneaux à cadre'), P('dressings', 8, 'Lit plateforme en chêne massif'), P('dressings', 5, 'Lits superposés en chêne, tiroirs'), P('dressings', 6, "Chambre d'enfants, lits blancs à tiroirs")] },
      { id: 'placards', title: 'Placards <em>et rangements</em>', text: "Placards toute hauteur, bureaux intégrés, meubles d'entrée : chaque niche a son usage.", photos: [P('placards', 1, 'Placard anthracite et niches en chêne'), P('placards', 2, 'Bureau et bibliothèque, blanc et chêne'), P('placards', 3, "Meuble d'entrée, banc et colonnes"), P('placards', 4, 'Bureau intégré et vaisselier vitré')] },
    ],
  },
  {
    slug: 'agencement', menu: 'Agencement pro', short: 'Magasins, pharmacies, hôtels',
    title: 'Agencement de magasins, pharmacies et hôtels', h1: "L'agencement <em>qui travaille.</em>",
    desc: "Agencement sur mesure de magasins, pharmacies, hôtels et bureaux : comptoirs, linéaires, habillages muraux. Act Wood, Alger.",
    lead: "Comptoirs, linéaires, habillages muraux, bibliothèques : des lieux qui reçoivent du public, agencés pour durer et pour être beaux.",
    hero: P('commerces', 5), heroCap: 'Officine, linéaires et comptoir',
    statement: "Un lieu qui reçoit doit être <em>beau le premier jour, et le millième.</em>",
    body: "Nous travaillons sur plan d'architecte ou à partir de vos besoins, dans les délais du chantier. Les ouvrages sont fabriqués à l'atelier et posés en série si besoin.",
    makes: ['Pharmacies et officines', 'Boutiques et showrooms', 'Hôtels : chambres, réceptions', 'Habillages muraux et niches'],
    groups: [
      { id: 'commerces', title: 'Magasins, pharmacies <em>et hôtels</em>', text: "Linéaires vitrés, comptoirs d'accueil, murs habillés de bois et de pierre.", photos: [P('commerces', 5, "Officine, linéaires et comptoir d'accueil"), P('commerces', 1, 'Pharmacie, comptoir et linéaires vitrés'), P('commerces', 2, 'Habillage mural en bois et pierre'), P('commerces', 3, 'Habillage mural en chêne, porte affleurante'), P('commerces', 4, 'Niches éclairées et cache-radiateur')] },
      { id: 'bibliotheques', title: 'Bibliothèques <em>et vaisseliers</em>', text: 'Des meubles intégrés aux murs, pour les bureaux comme pour la maison.', photos: [O('825281593_122276104166174344_6607890769787942150_n.jpg', 'Bibliothèque vitrée en chêne massif, éclairage intégré'), O('825281700_122276104016174344_1306448835613051549_n.jpg', 'Vaisselier en chêne et cache-radiateur à lames')] },
    ],
  },
  {
    slug: 'claustras', menu: 'Claustras & CNC', short: 'Séparations, moucharabiehs',
    title: 'Claustras et découpe CNC', h1: 'La lumière, <em>découpée.</em>',
    desc: 'Claustras et séparations en bois massif, panneaux ajourés et moucharabiehs découpés en CNC. Act Wood, Alger.',
    lead: "Séparer sans fermer : claustras à lames, panneaux ajourés, moucharabiehs. Le dessin est découpé à la machine, l'assemblage et la finition restent à la main.",
    hero: P('cnc', 4), heroCap: 'Panneau arabesque encadré',
    statement: "Un claustra laisse passer la lumière, <em>et garde l'intimité.</em>",
    body: "Motifs géométriques, arabesques, feuillages : nous dessinons le motif avec vous, ou partons d'un modèle traditionnel. La découpe numérique garantit une précision égale sur toute la surface.",
    makes: ['Claustras à lames', 'Séparations à étagères', 'Moucharabiehs et garde-corps', 'Panneaux décoratifs rétroéclairés'],
    groups: [
      { id: 'claustras', title: 'Claustras <em>en bois massif</em>', text: 'Lames verticales, montants et étagères : des séparations qui structurent la pièce.', photos: [P('claustras', 1, 'Claustra à lames, éclairage intégré'), P('claustras', 4, 'Claustra à montants et étagères de verre'), P('claustras', 2, 'Séparation ajourée à étagères'), O('825281726_122276104592174344_1763719221979172686_n.jpg', "Claustra d'entrée à lames et colonne de rangement"), P('claustras', 5, 'Claustra rétroéclairé')] },
      { id: 'cnc', title: 'Découpe <em>CNC</em>', text: 'Moucharabiehs, arabesques, motifs végétaux : la précision de la machine, la finition de la main.', photos: [P('cnc', 4, 'Panneau arabesque encadré'), P('cnc', 5, 'Claustra « feuillage » au-dessus du plan de travail'), P('cnc', 2, 'Garde-corps de mezzanine en moucharabieh'), P('cnc', 1, 'Panneau géométrique sur porte coulissante'), P('cnc', 3, 'Panneau ajouré « branches »')] },
    ],
  },
  {
    slug: 'mobilier', menu: 'Mobilier', short: 'Intérieur, jardin, bois exotique',
    title: 'Mobilier sur mesure', h1: 'Des meubles <em>qu\'on transmet.</em>',
    desc: "Mobilier sur mesure en bois massif : tables, buffets, commodes, canapés, et mobilier d'extérieur en bois exotique. Act Wood, Alger.",
    lead: "Tables, buffets, commodes, assises, et du mobilier de jardin en bois exotique : des pièces uniques, à vos dimensions.",
    hero: P('mobilier', 5), heroCap: 'Table ronde, piétement en étoile',
    statement: "Une table de famille se dessine <em>pour les vingt prochaines années.</em>",
    body: "Nous choisissons le bois avec vous, sur échantillon. Assemblages traditionnels, finitions à l'huile ou au vernis : chaque meuble est fait pour être utilisé, réparé, transmis.",
    makes: ['Tables et tables basses', 'Buffets, commodes, chevets', 'Canapés et fauteuils', 'Salons de jardin en bois exotique'],
    groups: [
      { id: 'interieur', title: 'Pour <em>l\'intérieur</em>', text: 'Du buffet en cannage à la grande table à piétement trapèze.', photos: [P('mobilier', 5, 'Table ronde, piétement en étoile'), P('mobilier', 1, 'Buffet en cannage, pieds compas'), P('mobilier', 7, 'Fauteuil à accoudoirs pleins'), P('mobilier', 3, 'Armoire gravée d\'une main de Fatma'), P('mobilier', 9, 'Grande table, piétement trapèze'), P('mobilier', 10, 'Canapé à structure en bois massif'), P('mobilier', 4, 'Vitrine à croisillons'), P('mobilier', 2, 'Table basse, plateau de verre'), O('825281629_122276103632174344_4257304306027447865_n.jpg', 'Meuble bas à façades coulissantes à claustra'), P('mobilier', 8, 'Meuble bas en placage veiné'), O('825281799_122276103584174344_119630999537333609_n.jpg', 'Commode à lames, quatre tiroirs'), P('mobilier', 6, 'Commode à huit tiroirs, bois brut'), O('825281784_122276103974174344_4740908879153623341_n.jpg', 'Chevets laqués vert, plateau bois')] },
      { id: 'exterieur', title: 'Jardin <em>et terrasse</em>', text: "En bois exotique, qui supporte le soleil et l'humidité : salons, tables, assises.", photos: [P('exterieur', 1, 'Salon de jardin en teck, coussins bleus'), P('exterieur', 4, 'Table à bord naturel et chaises assorties'), P('exterieur', 3, 'Salon et table basse en bois exotique'), P('exterieur', 2, "Salon d'angle en bois exotique, à l'atelier"), P('exterieur', 5, "Table et chaises à piétement croisé, à l'atelier")] },
    ],
  },
  {
    slug: 'parquet', menu: 'Parquet', short: 'Bois massif, point de Hongrie',
    title: 'Parquet en bois massif', h1: 'Le bois, <em>sous vos pas.</em>',
    desc: 'Pose de parquet en bois massif : lames larges, point de Hongrie, finitions vernies ou huilées. Act Wood, Alger.',
    lead: "Lames larges, point de Hongrie, teintes claires ou profondes : un sol en bois massif, posé et fini par la même équipe que vos portes.",
    hero: P('parquet', 2), heroCap: 'Parquet chêne à lames larges',
    statement: "Un parquet massif se ponce, se refait, <em>et vieillit avec la maison.</em>",
    body: "Nous préparons le support, posons les lames et réalisons les finitions. Les plinthes, les seuils et les portes peuvent être assortis au même bois.",
    makes: ['Parquet massif à lames', 'Point de Hongrie, bâtons rompus', 'Ponçage et vitrification', 'Plinthes et seuils assortis'],
    groups: [
      { id: 'parquet', title: 'Nos <em>sols</em>', text: 'Du chêne naturel à l\'acajou verni.', photos: [P('parquet', 2, 'Parquet chêne à lames larges'), P('parquet', 4, 'Parquet posé en point de Hongrie'), P('parquet', 3, 'Parquet acajou verni'), P('parquet', 1, 'Parquet massif teinte noyer'), P('parquet', 5, 'Lames de chêne prêtes à poser')] },
    ],
  },
  {
    slug: 'inspirations', menu: 'Inspirations mauresques', short: 'Bois sculpté, arcs, faïence',
    inspiration: true,
    title: 'Inspirations orientales et mauresques', h1: 'Inspirations <em>mauresques.</em>',
    desc: 'Inspirations orientales et mauresques : bois sculpté, arcs outrepassés, moucharabiehs. Des intérieurs que Act Wood peut fabriquer sur mesure.',
    lead: "Bois sculpté, arcs outrepassés, moucharabiehs, faïence : des images d'intention pour imaginer votre intérieur. Ce ne sont pas des réalisations, mais tout ce que vous y voyez, nous savons le fabriquer.",
    hero: P('mauresque', 3), heroCap: 'Mur-cheminée en bois sculpté',
    statement: "La Casbah, Tlemcen, l'Alhambra : <em>un héritage à vivre au présent.</em>",
    body: "Ces images servent de point de départ. Nous adaptons les motifs, les proportions et les essences à votre pièce, puis nous sculptons, découpons et assemblons à l'atelier.",
    makes: ['Façades et portes sculptées', 'Arcs et habillages muraux', 'Moucharabiehs et claustras', 'Cuisines et salons orientaux'],
    groups: [
      { id: 'inspirations', title: 'Images <em>d\'intention</em>', text: "Chaque image est une piste de travail : nous la redessinons pour votre intérieur.", photos: [P('mauresque', 3, 'Mur-cheminée en bois sculpté'), P('mauresque', 2, 'Colonne ajourée et éclairée'), P('mauresque', 6, 'Cuisine sculptée et zellige vert'), P('mauresque', 8, 'Séparation sculptée à étagères'), P('mauresque', 1, 'Meuble TV à arcs sculptés'), P('mauresque', 9, 'Cuisine aux portes en arc'), P('mauresque', 5, 'Boutique de parfums, boiseries et faïence'), P('mauresque', 7, 'Cuisine blanche, niche en arc'), P('mauresque', 4, 'Salon aux arcs et banquettes')] },
    ],
  },
];

const count = (pg) => pg.groups.reduce((n, g) => n + g.photos.length, 0);
const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
const strip = (s) => s.replace(/<[^>]+>/g, '');
const arrow = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M12.2 9H0V7h12.2L6.6 1.4 8 0l8 8-8 8-1.4-1.4z" fill="currentColor"/></svg>';

/* ---------- morceaux communs (repris à l'identique dans index.html) ---------- */
export const megaHTML = (base = '') => `<div class="mega" id="mega" hidden>
      <div class="mega__in">
        <div class="mega__intro">
          <p class="kicker">Savoir-faire</p>
          <p class="mega__title">Huit métiers, <em>un seul atelier.</em></p>
          <a class="mega__all" href="${base}#savoir-faire">Tout voir ${arrow}</a>
        </div>
        <ul class="mega__grid">
${pages.map((p) => `          <li><a href="${p.slug}.html"><span class="mega__img"><img src="${p.hero.src}" alt="" loading="lazy"></span><b>${p.menu}</b><i>${p.short}</i></a></li>`).join('\n')}
        </ul>
      </div>
    </div>`;

const header = (pg) => `<header class="hd is-solid hd--page" id="hd">
  <div class="hd__in">
    <a class="logo" href="index.html" aria-label="Act Wood, accueil">
      <svg viewBox="0 0 24 32" aria-hidden="true"><path d="M3.5 31V17A9 9 0 1 1 20.5 17V31" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>
      <span>Act Wood</span>
    </a>
    <nav class="hd__nav" aria-label="Navigation principale">
      <span class="hd__pill" aria-hidden="true"></span>
      <a href="index.html#atelier">L'atelier</a>
      <button type="button" class="hd__mega${pg.inspiration ? '' : ' is-current'}" aria-expanded="false" aria-controls="mega">Savoir-faire<svg viewBox="0 0 10 6" aria-hidden="true"><path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.5"/></svg></button>
      <a href="index.html#realisations">Réalisations</a>
      <a href="inspirations.html"${pg.inspiration ? ' aria-current="page" class="is-current"' : ''}>Inspirations</a>
    </nav>
    <a class="b-fill hd__cta" href="index.html#contact" data-hover="On en parle ?">Votre projet</a>
    <button class="hd__toggle" type="button" aria-expanded="false" aria-controls="hd-menu" aria-label="Ouvrir le menu"><i></i><i></i></button>
    <span class="hd__progress" aria-hidden="true"><i id="progress"></i></span>
    ${megaHTML('index.html')}
  </div>
  ${menuHTML('index.html')}
</header>`;

export const menuHTML = (base = '') => `<div class="hd__menu" id="hd-menu">
    <nav class="hd__menu-in" aria-label="Menu">
      <ol>
        <li><a href="${base}#atelier">L'atelier</a></li>
        <li><a href="${base}#savoir-faire">Savoir-faire</a></li>
        <li><a href="${base}#realisations">Réalisations</a></li>
        <li><a href="inspirations.html">Inspirations</a></li>
        <li><a href="${base}#contact">Contact</a></li>
      </ol>
      <ul class="hd__menu-sub">
${pages.filter((p) => !p.inspiration).map((p) => `        <li><a href="${p.slug}.html">${p.menu}</a></li>`).join('\n')}
      </ul>
      <a class="b-glow hd__menu-cta" href="${base}#contact"><span>Parler de votre projet</span></a>
      <p class="hd__menu-foot">Atelier à Alger · sur rendez-vous<br><a href="mailto:contact@actwood.dz">contact@actwood.dz</a></p>
    </nav>
  </div>`;

export const footerHTML = (base = '') => `<footer class="ft">
  <div class="wrap ft__in">
    <a class="ft__brand" href="${base || '#top'}">Act Wood</a>
    <ul class="ft__nav">
      <li><a href="${base}#atelier">L'atelier</a></li>
      <li><a href="${base}#savoir-faire">Savoir-faire</a></li>
      <li><a href="${base}#realisations">Réalisations</a></li>
      <li><a href="inspirations.html">Inspirations</a></li>
      <li><a href="${base}#contact">Contact</a></li>
    </ul>
    <ul class="ft__nav ft__nav--sf">
${pages.filter((p) => !p.inspiration).map((p) => `      <li><a href="${p.slug}.html">${p.menu}</a></li>`).join('\n')}
    </ul>
    <p class="ft__note">Menuiserie sur mesure,<br>du bois brut à la pose.<br>Atelier à Alger.</p>
    <p class="ft__small">© <span id="year">2026</span> Act Wood · <span lang="ar" class="ar">صحّة</span> · <span lang="ber-Tfng">ⵜⴰⵏⵎⵉⵔⵜ</span> · Merci</p>
  </div>
</footer>`;

export const curtainHTML = `<div class="curtain" aria-hidden="true"><svg viewBox="0 0 24 32"><path d="M3.5 31V17A9 9 0 1 1 20.5 17V31" fill="none" stroke="currentColor" stroke-width="1.4" pathLength="1"/></svg></div>`;

const viewer = `<dialog class="viewer" id="viewer" aria-label="Agrandissement">
  <button type="button" class="viewer__close" aria-label="Fermer">×</button>
  <button type="button" class="viewer__nav" data-dir="-1" aria-label="Précédent">←</button>
  <figure><img id="viewer-img" alt=""><figcaption id="viewer-cap"></figcaption></figure>
  <button type="button" class="viewer__nav" data-dir="1" aria-label="Suivant">→</button>
</dialog>`;

/* ---------- une photo de la galerie ---------- */
const item = (ph, k, insp) => {
  const { w, h } = size(ph.src);
  const shape = w / h > 1.15 ? 'is-land' : w / h < .85 ? 'is-port' : 'is-sq';
  return `<button type="button" class="g-item ${shape}" style="--k:${k % 4}">
          <span class="g-item__img"><img src="${ph.src}" width="${w}" height="${h}" loading="lazy" alt="${esc(ph.cap)}"></span>
          <span class="g-item__cap"><b>${ph.cap}</b>${insp ? '<i>Inspiration</i>' : ''}</span>
        </button>`;
};

const page = (pg, i) => {
  const next = pages[(i + 1) % pages.length];
  // film Higgsfield : on affiche d'abord sa première image, pour que le film démarre sans saut
  const film = existsSync(`media/page-${pg.slug}.mp4`);
  const heroSrc = film ? `media/page-${pg.slug}-debut.jpg` : pg.hero.src;
  const hs = size(heroSrc);
  const n = count(pg);
  // deux autres photos du métier, qui viennent encadrer la photo principale
  const sides = pg.groups.flatMap((g) => g.photos).filter((p) => p.src !== pg.hero.src).slice(0, 2);
  const label = pg.inspiration ? `${n} images d'intention` : `${n} réalisations`;
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${pg.title} — Act Wood, Alger</title>
<meta name="description" content="${esc(pg.desc)}">
<meta name="theme-color" content="#f4efe8">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%238b4f2a'/%3E%3Cpath d='M9 26V16a7 7 0 1 1 14 0v10' fill='none' stroke='%23f4efe8' stroke-width='2'/%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400..700;1,400..700&family=Instrument+Sans:wght@400..700&family=Amiri&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/style.css">
<link rel="stylesheet" href="assets/pages.css">
<script>document.documentElement.classList.add('js');if(!matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.classList.add('motion');try{if(sessionStorage.getItem('aw-tr'))document.documentElement.classList.add('tr-in')}catch(e){}</script>
</head>
<body class="sub">
${curtainHTML}
<a class="skip" href="#contenu">Aller au contenu</a>

${header(pg)}

<main id="contenu">

  <!-- ============ Ouverture : le titre, puis la photo sort de son arche et vient au centre, entourée de deux autres ============ -->
  <section class="ph" aria-labelledby="ph-title">
    <div class="ph__stage">
${sides.map((p, k) => `      <div class="ph__side ph__side--${k ? 'r' : 'l'}" aria-hidden="true"><img src="${p.src}" alt="" loading="lazy"></div>`).join('\n')}
      <div class="ph__win" style="--ratio:${(hs.w / hs.h).toFixed(4)}">
        <img src="${heroSrc}" width="${hs.w}" height="${hs.h}" alt="${esc(pg.heroCap)}" fetchpriority="high">${film ? `
        <video data-src="media/page-${pg.slug}.mp4" muted${pg.filmOnce ? '' : ' loop'} playsinline preload="none" aria-hidden="true" tabindex="-1"></video>` : ''}
      </div>
      <div class="wrap ph__head">
        <nav class="crumbs" aria-label="Fil d'Ariane"><a href="index.html">Accueil</a><span aria-hidden="true">/</span><a href="index.html#savoir-faire">Savoir-faire</a><span aria-hidden="true">/</span><span aria-current="page">${pg.menu}</span></nav>
        <h1 id="ph-title" class="ph__title" data-split>${pg.h1}</h1>
        <p class="ph__lead">${pg.lead}</p>
        <p class="ph__meta"><span>${label}</span><a href="#galerie">Voir les photos ${arrow}</a></p>
      </div>
      <p class="tag ph__tag">${pg.inspiration ? 'Inspiration' : 'Réalisation Act Wood'} · ${pg.heroCap}</p>
    </div>
  </section>

  <!-- ============ Le métier ============ -->
  <section class="pi ch" aria-label="Notre approche">
    <div class="wrap pi__in">
      <p class="pi__statement reveal">${pg.statement}</p>
      <div class="pi__side">
        <p class="txt reveal">${pg.body}</p>
        <p class="kicker reveal">Ce que nous fabriquons</p>
        <ul class="pi__list">
${pg.makes.map((m, k) => `          <li class="reveal" style="--d:${(k * .06).toFixed(2)}s">${m}</li>`).join('\n')}
        </ul>
      </div>
    </div>
  </section>

  <!-- ============ Les photos ============ -->
  <div id="galerie">
${pg.groups.map((g) => `  <section class="pg" id="${g.id}" aria-labelledby="${g.id}-t">
    <div class="wrap pg__head">
      <h2 id="${g.id}-t" class="h2 reveal">${g.title}</h2>
      <p class="txt reveal">${g.text}</p>
      <p class="pg__count reveal">${g.photos.length} photo${g.photos.length > 1 ? 's' : ''}</p>
    </div>
    <div class="wrap pg__grid">
        ${g.photos.map((ph, k) => item(ph, k, pg.inspiration)).join('\n        ')}
    </div>
  </section>`).join('\n')}
  </div>

  <!-- ============ Comment ça se passe ============ -->
  <section class="pp ch" aria-labelledby="pp-t">
    <div class="wrap">
      <p class="kicker reveal">Comment ça se passe</p>
      <h2 id="pp-t" class="h2 reveal">Trois rendez-vous, <em>une seule équipe.</em></h2>
      <ol class="pp__steps">
        <li class="reveal"><span class="pp__arch" aria-hidden="true"><svg viewBox="0 0 24 32"><path d="M3.5 31V17A9 9 0 1 1 20.5 17V31" pathLength="1"/></svg></span><b>La visite</b><p>Chez vous ou à l'atelier : relevés, envies, contraintes, budget.</p></li>
        <li class="reveal" style="--d:.08s"><span class="pp__arch" aria-hidden="true"><svg viewBox="0 0 24 32"><path d="M3.5 31V17A9 9 0 1 1 20.5 17V31" pathLength="1"/></svg></span><b>Le dessin</b><p>Plans, choix du bois et des finitions, validés avec vous avant la fabrication.</p></li>
        <li class="reveal" style="--d:.16s"><span class="pp__arch" aria-hidden="true"><svg viewBox="0 0 24 32"><path d="M3.5 31V17A9 9 0 1 1 20.5 17V31" pathLength="1"/></svg></span><b>L'atelier et la pose</b><p>Fabrication chez nous, pose par la même équipe, réglages compris.</p></li>
      </ol>
    </div>
  </section>

  <!-- ============ Métier suivant ============ -->
  <a class="pn" href="${next.slug}.html">
    <span class="wrap pn__in">
      <span class="pn__k">${next.inspiration ? 'À voir aussi' : 'Métier suivant'}</span>
      <span class="pn__name">${next.menu}</span>
      <span class="pn__short">${next.short} ${arrow}</span>
    </span>
    <span class="pn__img" aria-hidden="true"><img src="${next.hero.src}" alt="" loading="lazy"></span>
  </a>

  <!-- ============ Contact ============ -->
  <section class="pc" aria-label="Contact">
    <div class="wrap pc__in">
      <p class="pc__t reveal">Un projet ${pg.inspiration ? 'qui vous ressemble' : 'en tête'} ? <em>Parlons-en.</em></p>
      <a class="b-pill reveal" href="index.html#contact"><span>Décrire mon projet</span><i aria-hidden="true">${arrow.replace('aria-hidden="true"', 'preserveAspectRatio="none"')}</i></a>
    </div>
  </section>
</main>

${footerHTML('index.html')}

${viewer}

<script src="assets/site.js" defer></script>
</body>
</html>
`;
};

if (process.argv[1] && process.argv[1].endsWith('pages.mjs')) {
  pages.forEach((pg, i) => writeFileSync(`${pg.slug}.html`, page(pg, i)));
  // le menu, le méga-menu et le pied de page de l'accueil, pour les recoller dans index.html
  writeFileSync('tools/_partials.html', `<!-- MEGA -->\n${megaHTML('')}\n<!-- MENU -->\n${menuHTML('')}\n<!-- FOOTER -->\n${footerHTML('')}\n`);
  console.log(pages.map((p) => `${p.slug}.html (${count(p)} photos)`).join('\n'));
}
