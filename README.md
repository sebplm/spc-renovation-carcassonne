# SPC RENOVATION — Site Web Professionnel

Site web complet pour **SPC RENOVATION**, artisan multi-services à Carcassonne (11).

## Lancer le site

Ouvrir `index.html` directement dans un navigateur, ou utiliser un serveur local :

```bash
# Python 3
python3 -m http.server 8080
# puis ouvrir http://localhost:8080

# Node.js (npx)
npx serve .
```

## Structure des fichiers

```
site-artisan-carcassonne/
├── index.html          # Page principale complète
├── css/
│   └── style.css       # Tous les styles (responsive, animations)
├── js/
│   └── script.js       # Navigation, lightbox, formulaire, scroll
└── images/             # Photos des réalisations (JPG, PNG)
```

## Fonctionnalités

- Navigation sticky avec menu hamburger mobile
- Hero plein écran avec photo de fond
- 8 sections complètes (accueil, présentation, services, galerie, pourquoi nous, zone, contact, footer)
- Galerie photo avec lightbox (navigation clavier + swipe tactile)
- Formulaire de contact avec validation côté client
- Bouton téléphone fixe en bas sur mobile
- Bouton retour en haut
- Animations au scroll (Intersection Observer)
- 100% responsive (mobile, tablette, desktop)
- SEO optimisé (meta tags, JSON-LD LocalBusiness)

## Mise en production

1. **Formulaire** : remplacer la simulation JS par Formspree (`action="https://formspree.io/f/XXXX"`) ou Netlify Forms
2. **SIRET / Assureur** : compléter dans le footer (`[Numéro SIRET]`, `[Assureur]`)
3. **Réseaux sociaux** : remplacer `href="#"` par les vraies URLs Facebook / Instagram
4. **Domaine** : déployer sur `spc-renovation-carcassonne.fr`

## Contact entreprise

- Téléphone : **06 32 49 72 40**
- Localisation : 11000 Carcassonne, Aude
