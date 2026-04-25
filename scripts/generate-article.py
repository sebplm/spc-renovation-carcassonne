#!/usr/bin/env python3
"""
SPC RENOVATION — Blog Auto Publisher
Génère et publie automatiquement 1 article de blog par jour.

Usage :
  python scripts/generate-article.py            # génère + commit + push
  python scripts/generate-article.py --dry-run  # génère seulement (pas de git push)
"""

import anthropic
import json
import logging
import os
import re
import subprocess
import sys
import xml.etree.ElementTree as ET
from datetime import datetime
from pathlib import Path

# ─── CHEMINS ────────────────────────────────────────────────────────────────

REPO_ROOT    = Path(__file__).parent.parent
ARTICLES_DIR = REPO_ROOT / "articles"
BLOG_HTML    = REPO_ROOT / "blog.html"
SITEMAP      = REPO_ROOT / "sitemap.xml"
LOG_DIR      = Path(__file__).parent / "logs"

# ─── LOGGING ────────────────────────────────────────────────────────────────

LOG_DIR.mkdir(exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(LOG_DIR / f"{datetime.now().strftime('%Y-%m-%d')}.log"),
        logging.StreamHandler(sys.stdout),
    ],
)
log = logging.getLogger(__name__)

# ─── IMAGES PAR CATÉGORIE (Unsplash) ────────────────────────────────────────

IMAGES = {
    "plomberie":   "https://images.unsplash.com/photo-1585771724684-38269d6639fd",
    "carrelage":   "https://images.unsplash.com/photo-1558618666-fcd25c85cd64",
    "electricite": "https://images.unsplash.com/photo-1621905251189-08b45d6a269e",
    "chantiers":   "https://images.unsplash.com/photo-1504307651254-35680f356dfd",
    "peinture":    "https://images.unsplash.com/photo-1562259949-e8e7689d7828",
    "conseils":    "https://images.unsplash.com/photo-1484154218962-a197022b5858",
}

def img(cat: str, w: int = 1200) -> str:
    return f"{IMAGES.get(cat, IMAGES['conseils'])}?w={w}&q=80"

# ─── PLANNING ÉDITORIAL ──────────────────────────────────────────────────────
# Rotation sur 7 jours, 1 thème par jour

TOPICS = [
    {
        "theme": "un conseil pratique de plomberie — choisir parmi : réparation fuite, "
                 "remplacement chauffe-eau, débouchage canalisation, entretien robinetterie, "
                 "économies d'eau, ou tuyauterie ancienne maison",
        "category": "plomberie",
        "label": "Plomberie",
    },
    {
        "theme": "un projet de rénovation complète à Carcassonne ou dans l'Aude — "
                 "transformation avant/après, rénovation appartement, rénovation maison de village, "
                 "ou création d'espace de vie",
        "category": "chantiers",
        "label": "Nos chantiers",
    },
    {
        "theme": "un guide pratique sur le carrelage — choix de format, tendances 2026, "
                 "carrelage extérieur, carrelage salle de bain, entretien, ou prix",
        "category": "carrelage",
        "label": "Carrelage",
    },
    {
        "theme": "un conseil électricité pour les maisons à Carcassonne — "
                 "mise aux normes, tableau électrique, sécurité, économies d'énergie, "
                 "ou réglementation NF C 15-100",
        "category": "electricite",
        "label": "Électricité",
    },
    {
        "theme": "un retour d'expérience ou chantier réalisé dans l'Aude — "
                 "rénovation salle de bain, cuisine, terrasse, toiture, isolation, "
                 "ou aménagement combles",
        "category": "chantiers",
        "label": "Nos chantiers",
    },
    {
        "theme": "un article peinture ou plâtrerie — choisir ses couleurs, préparation des murs, "
                 "peinture extérieure, enduit décoratif, ou tendances déco intérieure",
        "category": "peinture",
        "label": "Peinture & Plâtrerie",
    },
    {
        "theme": "le dépannage urgent à Carcassonne — réflexes en cas d'urgence, "
                 "maintenance préventive, préparer sa maison pour l'hiver, ou "
                 "entretien annuel plomberie/électricité",
        "category": "conseils",
        "label": "Conseils pratiques",
    },
]

# ─── ARTICLES SIMILAIRES (liens fixes vers articles existants) ───────────────

RELATED = [
    {
        "url":   "/articles/preparation-salle-de-bain-carcassonne",
        "img":   "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=400&q=75",
        "alt":   "Rénovation salle de bain Carcassonne",
        "cat":   "conseils",
        "label": "Conseils pratiques",
        "title": "7 conseils pour préparer votre rénovation de salle de bain à Carcassonne",
    },
    {
        "url":   "/articles/fuite-eau-urgence-carcassonne",
        "img":   "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&q=75",
        "alt":   "Fuite eau urgence Carcassonne",
        "cat":   "conseils",
        "label": "Plomberie",
        "title": "Fuite d'eau à Carcassonne : les bons réflexes en urgence",
    },
    {
        "url":   "/articles/tendances-carrelage-2025-carcassonne",
        "img":   "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=75",
        "alt":   "Tendances carrelage Carcassonne",
        "cat":   "carrelage",
        "label": "Carrelage",
        "title": "Tendances carrelage 2025 à Carcassonne : motifs, couleurs et formats",
    },
]

# ─── HELPERS ────────────────────────────────────────────────────────────────

def get_topic() -> dict:
    return TOPICS[datetime.now().timetuple().tm_yday % len(TOPICS)]


def slugify(text: str) -> str:
    accents = {
        'é':'e','è':'e','ê':'e','ë':'e','à':'a','â':'a','î':'i','ï':'i',
        'ô':'o','ù':'u','û':'u','ü':'u','ç':'c','ñ':'n','æ':'ae','œ':'oe',
    }
    t = text.lower()
    for k, v in accents.items():
        t = t.replace(k, v)
    t = re.sub(r"[^a-z0-9\s-]", "", t)
    t = re.sub(r"[\s_]+", "-", t)
    t = re.sub(r"-+", "-", t)
    return t.strip("-")[:80]


MONTHS_FR = [
    "janvier","février","mars","avril","mai","juin",
    "juillet","août","septembre","octobre","novembre","décembre",
]


def date_display(dt: datetime) -> str:
    """Retourne '25 avril 2026 à 09h14'"""
    return f"{dt.day} {MONTHS_FR[dt.month - 1]} {dt.year} à {dt.strftime('%Hh%M')}"


# ─── GÉNÉRATION CLAUDE API ───────────────────────────────────────────────────

def generate(topic: dict) -> dict:
    log.info(f"Appel Claude API — thème : {topic['label']}")
    client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
    year = datetime.now().year

    prompt = f"""Tu es un expert en rénovation et rédaction SEO pour une entreprise artisanale française.

Génère un article de blog complet pour SPC RENOVATION, artisan multi-services à Carcassonne.

SUJET : {topic['theme']}

ENTREPRISE :
- SPC RENOVATION — artisan multi-services à Carcassonne
- Services : plomberie, carrelage, électricité, plâtrerie, peinture, dépannage urgent
- Zone : Carcassonne et Aude (11) — Trèbes, Pennautier, Castelnaudary, Limoux, Alzonne
- Téléphone : 06 32 49 72 40 — 15 ans d'expérience — artisan local
- Année : {year}

CONSIGNES :
- Angle SPÉCIFIQUE et ORIGINAL (pas un article générique, quelque chose de concret)
- Titre H1 accrocheur + optimisé SEO avec "Carcassonne" ou "Aude"
- 1 000–1 500 mots au total
- Ton professionnel mais chaleureux, paragraphes courts (3-4 lignes max)
- Mots-clés locaux intégrés naturellement (artisan carcassonne, rénovation carcassonne, Aude 11)
- Références locales concrètes (Cité médiévale, Bastide, villages de l'Aude, climat méditerranéen)
- 4 à 5 sections H2 + conclusion
- Conseils pratiques exploitables par le lecteur

RETOURNE UNIQUEMENT un objet JSON valide (sans markdown ni backticks) :
{{
  "title": "Titre H1 SEO avec Carcassonne ou Aude (60-70 caractères)",
  "meta_description": "150-160 caractères : mot-clé + bénéfice + localisation",
  "og_description": "120-140 caractères pour Open Graph",
  "keywords": "mot-clé 1, mot-clé 2, mot-clé 3, mot-clé 4, mot-clé 5",
  "slug": "url-slug-minuscules-sans-accents-avec-tirets",
  "reading_time": 6,
  "intro": "<p>Paragraphe accrocheur.</p><p>Contexte / problème.</p><p>Ce que l'article apporte.</p>",
  "sections": [
    {{"id": "id-kebab-case", "h2": "Titre section", "content": "<p>HTML...</p>"}},
    {{"id": "id-kebab-case", "h2": "Titre section", "content": "<p>HTML avec <ul><li>...</li></ul></p>"}},
    {{"id": "id-kebab-case", "h2": "Titre section", "content": "<p>HTML...</p>"}},
    {{"id": "id-kebab-case", "h2": "Titre section", "content": "<p>HTML...</p>"}}
  ],
  "conclusion": "<p>Synthèse des points clés.</p><p>Invitation à contacter SPC RENOVATION.</p>",
  "cta_title": "Titre CTA adapté au sujet de l'article",
  "cta_body": "Phrase d'accroche avec bénéfice + mention du 06 32 49 72 40",
  "tags": ["Tag 1 Carcassonne", "Tag 2", "Tag 3", "Tag 4"],
  "card_excerpt": "Extrait accrocheur 150-200 caractères pour la carte du blog"
}}"""

    for attempt in range(2):
        try:
            resp = client.messages.create(
                model="claude-sonnet-4-6",
                max_tokens=4096,
                messages=[{"role": "user", "content": prompt}],
            )
            raw = resp.content[0].text.strip()
            raw = re.sub(r"^```(?:json)?\s*\n?", "", raw)
            raw = re.sub(r"\n?```\s*$", "", raw)
            data = json.loads(raw)
            log.info(f"Article généré : {data['title']}")
            return data
        except (json.JSONDecodeError, KeyError) as exc:
            log.warning(f"Tentative {attempt + 1}/2 — réponse invalide : {exc}")
            if attempt == 1:
                raise RuntimeError("Claude n'a pas retourné un JSON valide après 2 tentatives") from exc


# ─── CONSTRUCTION HTML ───────────────────────────────────────────────────────

def build_html(data: dict, topic: dict, date_iso: str, now: datetime) -> str:
    slug       = data.get("slug") or slugify(data["title"])
    canon_slug = f"{date_iso}-{slug}"
    hero_img   = img(topic["category"])
    d          = datetime.strptime(date_iso, "%Y-%m-%d")
    date_str   = date_display(now)

    # Sommaire
    toc = "".join(
        f'<li><a href="#{s["id"]}">{s["h2"]}</a></li>\n                    '
        for s in data["sections"]
    ) + '<li><a href="#conclusion">Conclusion</a></li>'

    # Sections
    secs = ""
    for s in data["sections"]:
        secs += f"""
            <section id="{s['id']}">
                <h2>{s['h2']}</h2>
                {s['content']}
            </section>
"""

    # Tags
    tags = " ".join(
        f'<a href="/blog" class="article-tag">{t}</a>'
        for t in data.get("tags", [])
    )

    # Articles similaires
    sim = ""
    for a in RELATED:
        sim += f"""
            <a href="{a['url']}" class="similaire-card">
                <div class="similaire-card-img"><img src="{a['img']}" alt="{a['alt']}" loading="lazy"></div>
                <div class="similaire-card-body">
                    <span class="article-category-tag {a['cat']}">{a['label']}</span>
                    <h4>{a['title']}</h4>
                    <span class="similaire-card-read">Lire l'article <i class="fa-solid fa-arrow-right"></i></span>
                </div>
            </a>"""

    schema = json.dumps({
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": data["title"],
        "author": {"@type": "Organization", "name": "SPC RENOVATION CARCASSONNE"},
        "publisher": {"@type": "Organization", "name": "SPC RENOVATION",
                      "url": "https://spc-renovation-carcassonne.fr"},
        "datePublished": date_iso,
        "dateModified": date_iso,
        "image": hero_img,
        "description": data["meta_description"],
    }, ensure_ascii=False)

    return f"""<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{data['title']} | SPC RENOVATION Carcassonne</title>
    <meta name="description" content="{data['meta_description']}">
    <meta name="keywords" content="{data.get('keywords', '')}">
    <meta name="robots" content="index, follow">
    <meta name="author" content="SPC RENOVATION">
    <meta property="og:title" content="{data['title']}">
    <meta property="og:description" content="{data.get('og_description', data['meta_description'])}">
    <meta property="og:type" content="article">
    <meta property="og:url" content="https://spc-renovation-carcassonne.fr/articles/{canon_slug}">
    <meta property="og:image" content="{hero_img}">
    <link rel="canonical" href="https://spc-renovation-carcassonne.fr/articles/{canon_slug}">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&family=Open+Sans:wght@400;500;600&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <link rel="stylesheet" href="../css/style.css">
    <link rel="stylesheet" href="../css/article.css">
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='15' fill='%232563eb'/><text y='.9em' font-size='60' x='50%' text-anchor='middle' dominant-baseline='middle' dy='.05em'>🔧</text></svg>">
    <script type="application/ld+json">{schema}</script>
</head>
<body class="article-page">

<header id="navbar" class="scrolled">
    <nav class="nav-container">
        <a href="/" class="nav-logo"><span class="logo-spc">SPC</span><span class="logo-renovation">RENOVATION</span></a>
        <ul class="nav-links" id="navLinks">
            <li><a href="/#accueil" class="nav-link">Accueil</a></li>
            <li><a href="/#services" class="nav-link">Services</a></li>
            <li><a href="/#realisations" class="nav-link">Réalisations</a></li>
            <li><a href="/blog" class="nav-link nav-link--blog"><i class="fa-solid fa-pen-to-square"></i> Blog</a></li>
            <li><a href="/#contact" class="nav-link">Contact</a></li>
            <li><a href="tel:0632497240" class="nav-phone"><i class="fa-solid fa-phone"></i> 06 32 49 72 40</a></li>
        </ul>
        <button class="hamburger" id="hamburger" aria-label="Menu" aria-expanded="false">
            <span></span><span></span><span></span>
        </button>
    </nav>
</header>

<div class="article-hero">
    <img src="{hero_img}" alt="{data['title']}">
    <div class="article-hero-overlay"></div>
    <div class="article-hero-content">
        <div class="container">
            <div class="article-breadcrumb">
                <a href="/"><i class="fa-solid fa-house"></i> Accueil</a>
                <i class="fa-solid fa-chevron-right"></i>
                <a href="/blog">Blog</a>
                <i class="fa-solid fa-chevron-right"></i>
                <span>{topic['label']}</span>
            </div>
            <span class="article-category-hero article-category-tag {topic['category']}">{topic['label']}</span>
            <h1>{data['title']}</h1>
            <div class="article-hero-meta">
                <span><i class="fa-solid fa-user"></i> SPC RENOVATION CARCASSONNE</span>
                <span><i class="fa-regular fa-calendar"></i> {date_str}</span>
                <span><i class="fa-regular fa-clock"></i> {data.get('reading_time', 5)} min de lecture</span>
                <span><i class="fa-solid fa-location-dot"></i> Carcassonne, Aude (11)</span>
            </div>
        </div>
    </div>
</div>

<div class="article-layout container">

    <aside>
        <nav class="sommaire">
            <p class="sommaire-title"><i class="fa-solid fa-list"></i> Sommaire</p>
            <ol>
                {toc}
            </ol>
        </nav>
    </aside>

    <article class="article-body">

        <div class="article-intro">
            {data['intro']}
        </div>
{secs}
        <section id="conclusion">
            <h2>Conclusion</h2>
            {data['conclusion']}
        </section>

        <div class="article-cta-box">
            <h3>{data.get('cta_title', "Besoin d'un artisan à Carcassonne ?")}</h3>
            <p>{data.get('cta_body', "SPC RENOVATION intervient pour tous vos travaux dans l'Aude. Devis gratuit sous 24h.")}</p>
            <div class="article-cta-btns">
                <a href="tel:0632497240" class="btn btn-secondary btn-lg"><i class="fa-solid fa-phone"></i> 06 32 49 72 40</a>
                <a href="/#contact" class="btn btn-primary btn-lg"><i class="fa-solid fa-clipboard-check"></i> Devis gratuit</a>
            </div>
        </div>

        <div class="article-tags">
            <span>Tags :</span>
            {tags}
        </div>

        <div class="article-author-block">
            <div class="author-photo"><img src="../images/spc-renovation-company.svg" alt="SPC RENOVATION Carcassonne" onerror="this.parentElement.innerHTML='<i class=\\'fa-solid fa-building\\'></i>'"></div>
            <div class="author-info">
                <strong>SPC RENOVATION CARCASSONNE</strong>
                <span>Artisan multi-services à Carcassonne depuis 15 ans. Plomberie, carrelage, électricité, plâtrerie, peinture et dépannage urgent dans tout l'Aude (11).</span>
            </div>
        </div>

    </article>

</div>

<section class="articles-similaires">
    <div class="container">
        <div class="section-header">
            <span class="section-badge">Continuer la lecture</span>
            <h2 class="section-title">Articles <em>similaires</em></h2>
        </div>
        <div class="similaires-grid">
            {sim}
        </div>
    </div>
</section>

<footer id="footer">
    <div class="footer-main">
        <div class="container">
            <div class="footer-grid">
                <div class="footer-col footer-brand">
                    <div class="footer-logo"><span class="logo-spc">SPC</span><span class="logo-renovation">RENOVATION</span></div>
                    <p class="footer-tagline">Conseil · Création · Personnalisation · Rénovation</p>
                    <p class="footer-desc">Artisan multi-services à Carcassonne — Plomberie, carrelage, électricité, plâtrerie, peinture. Aude (11).</p>
                </div>
                <div class="footer-col"><h4>Nos services</h4><ul class="footer-links">
                    <li><a href="/#services"><i class="fa-solid fa-chevron-right"></i> Plomberie</a></li>
                    <li><a href="/#services"><i class="fa-solid fa-chevron-right"></i> Carrelage</a></li>
                    <li><a href="/#services"><i class="fa-solid fa-chevron-right"></i> Électricité</a></li>
                    <li><a href="/#services"><i class="fa-solid fa-chevron-right"></i> Plâtrerie</a></li>
                    <li><a href="/#services"><i class="fa-solid fa-chevron-right"></i> Peinture</a></li>
                    <li class="footer-links-separator"></li>
                    <li><a href="/blog"><i class="fa-solid fa-pen-to-square footer-blog-icon"></i> Nos articles</a></li>
                </ul></div>
                <div class="footer-col"><h4>Horaires</h4><ul class="footer-hours">
                    <li><span>Lun – Ven</span><span>8h00 – 18h00</span></li>
                    <li><span>Samedi</span><span>9h00 – 12h00</span></li>
                    <li><span>Dimanche</span><span class="closed">Urgences uniquement</span></li>
                </ul></div>
                <div class="footer-col"><h4>Contact</h4><ul class="footer-contact-list">
                    <li><i class="fa-solid fa-phone"></i><a href="tel:0632497240">06 32 49 72 40</a></li>
                    <li><i class="fa-solid fa-location-dot"></i><span>11000 Carcassonne — Aude</span></li>
                </ul><a href="/#contact" class="btn btn-secondary btn-sm footer-devis-btn"><i class="fa-solid fa-clipboard-check"></i> Devis gratuit</a></div>
            </div>
        </div>
    </div>
    <div class="footer-bottom">
        <div class="container">
            <p>&copy; {d.year} SPC RENOVATION — Tous droits réservés &nbsp;|&nbsp; <a href="/mentions-legales">Mentions légales</a> &nbsp;|&nbsp; <a href="/#contact">Contact</a></p>
            <p>SPC RENOVATION — Carcassonne (11) — TVA non applicable art. 293B CGI</p>
        </div>
    </div>
</footer>

<button id="backToTop" class="back-to-top" aria-label="Retour en haut"><i class="fa-solid fa-chevron-up"></i></button>
<a href="tel:0632497240" class="mobile-phone-btn"><i class="fa-solid fa-phone"></i><span>Appeler maintenant</span></a>
<script src="../js/script.js"></script>
<script>fetch("https://site-artisan-carcassonne.vercel.app/api/track",{{method:"POST"}}).catch(()=>{{}});</script>
</body>
</html>"""


# ─── MISE À JOUR blog.html ────────────────────────────────────────────────────

def update_blog(data: dict, topic: dict, date_iso: str, now: datetime) -> None:
    slug       = data.get("slug") or slugify(data["title"])
    canon_slug = f"{date_iso}-{slug}"
    thumb      = img(topic["category"], w=400)
    d_str      = date_display(now)

    card = f"""
            <!-- Article auto - {date_iso} -->
            <article class="blog-card reveal" data-category="{topic['category']}">
                <a href="/articles/{canon_slug}" class="blog-card-img-link">
                <div class="blog-card-img">
                    <img src="{thumb}" alt="{data['title']}" loading="lazy" style="width:100%;height:100%;object-fit:cover;">
                    <span class="article-category-tag {topic['category']}">{topic['label']}</span>
                </div>
                </a>
                <div class="blog-card-body">
                    <div class="article-meta-sm">
                        <span><i class="fa-regular fa-calendar"></i> {d_str}</span>
                        <span><i class="fa-regular fa-clock"></i> {data.get('reading_time', 5)} min de lecture</span>
                    </div>
                    <h3>{data['title']}</h3>
                    <p>{data['card_excerpt']}</p>
                    <a href="/articles/{canon_slug}" class="blog-read-more">Lire l'article <i class="fa-solid fa-arrow-right"></i></a>
                </div>
            </article>"""

    marker  = '<div class="blog-grid" id="blogGrid">'
    content = BLOG_HTML.read_text(encoding="utf-8")
    if marker not in content:
        raise ValueError(f"Marqueur introuvable dans blog.html : {marker!r}")

    BLOG_HTML.write_text(content.replace(marker, marker + card, 1), encoding="utf-8")
    log.info("blog.html mis à jour")


# ─── MISE À JOUR SITEMAP ─────────────────────────────────────────────────────

NS = "http://www.sitemaps.org/schemas/sitemap/0.9"


def update_sitemap(canon_slug: str, date_iso: str) -> None:
    ET.register_namespace("", NS)
    tree = ET.parse(SITEMAP)
    root = tree.getroot()

    new_loc = f"https://spc-renovation-carcassonne.fr/articles/{canon_slug}"

    # Évite les doublons
    existing = {u.find(f"{{{NS}}}loc").text for u in root.findall(f"{{{NS}}}url")}
    if new_loc in existing:
        log.info("Sitemap : URL déjà présente, pas de doublon")
        return

    # Met à jour le lastmod de /blog
    for url_el in root.findall(f"{{{NS}}}url"):
        loc_el = url_el.find(f"{{{NS}}}loc")
        if loc_el is not None and loc_el.text == "https://spc-renovation-carcassonne.fr/blog":
            lm = url_el.find(f"{{{NS}}}lastmod")
            if lm is not None:
                lm.text = date_iso

    # Ajoute le nouvel article
    url_el = ET.SubElement(root, f"{{{NS}}}url")
    ET.SubElement(url_el, f"{{{NS}}}loc").text        = new_loc
    ET.SubElement(url_el, f"{{{NS}}}lastmod").text    = date_iso
    ET.SubElement(url_el, f"{{{NS}}}changefreq").text = "monthly"
    ET.SubElement(url_el, f"{{{NS}}}priority").text   = "0.8"

    ET.indent(tree, space="  ")
    tree.write(SITEMAP, encoding="unicode", xml_declaration=True)
    log.info(f"sitemap.xml mis à jour — {new_loc}")


# ─── GIT COMMIT + PUSH ───────────────────────────────────────────────────────

def git_push(article_file: str, title: str) -> None:
    date = datetime.now().strftime("%Y-%m-%d")
    cmds = [
        ["git", "config", "user.name",  "SPC Blog Bot"],
        ["git", "config", "user.email", "bot@spc-renovation.fr"],
        ["git", "add", f"articles/{article_file}", "blog.html", "sitemap.xml"],
        ["git", "commit", "-m", f"Article auto [{date}] : {title}"],
        ["git", "push"],
    ]
    for cmd in cmds:
        r = subprocess.run(cmd, cwd=REPO_ROOT, capture_output=True, text=True)
        if r.returncode != 0:
            raise RuntimeError(f"Échec git : {' '.join(cmd)}\n{r.stderr}")
        log.info(f"✓ {' '.join(cmd[:3])}")


# ─── MAIN ────────────────────────────────────────────────────────────────────

def main() -> None:
    dry_run = "--dry-run" in sys.argv
    log.info("═══ SPC Blog Auto Publisher ═══")

    if not os.environ.get("ANTHROPIC_API_KEY"):
        log.error("Variable ANTHROPIC_API_KEY manquante")
        sys.exit(1)

    now   = datetime.now()
    today = now.strftime("%Y-%m-%d")
    topic = get_topic()
    log.info(f"Thème : {topic['label']} ({today})")

    data         = generate(topic)
    slug         = data.get("slug") or slugify(data["title"])
    canon_slug   = f"{today}-{slug}"
    filename     = f"{canon_slug}.html"
    article_path = ARTICLES_DIR / filename

    html = build_html(data, topic, today, now)
    article_path.write_text(html, encoding="utf-8")
    log.info(f"Article créé : articles/{filename}")

    update_blog(data, topic, today, now)
    update_sitemap(canon_slug, today)

    if dry_run:
        log.info("[DRY RUN] git push ignoré — article généré localement")
    else:
        git_push(filename, data["title"])

    log.info(f"✅ Succès — URL : https://spc-renovation-carcassonne.fr/articles/{canon_slug}")


if __name__ == "__main__":
    main()
