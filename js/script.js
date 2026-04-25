/* ===== SPC RENOVATION — script.js ===== */

/* ---- Navigation sticky ---- */
const navbar    = document.getElementById('navbar');
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('navLinks');

window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
    backToTop.classList.toggle('visible', window.scrollY > 400);
}, { passive: true });

/* ---- Hamburger menu ---- */
hamburger.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    hamburger.classList.toggle('active', open);
    hamburger.setAttribute('aria-expanded', open);
});

navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        hamburger.classList.remove('active');
        hamburger.setAttribute('aria-expanded', false);
    });
});

document.addEventListener('click', e => {
    if (!navbar.contains(e.target)) {
        navLinks.classList.remove('open');
        hamburger.classList.remove('active');
        hamburger.setAttribute('aria-expanded', false);
    }
});

/* ---- Active nav link on scroll ---- */
const sections   = document.querySelectorAll('section[id]');
const navAnchorLinks = document.querySelectorAll('.nav-link');

const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            navAnchorLinks.forEach(a => {
                a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id);
            });
        }
    });
}, { threshold: .35 });

sections.forEach(s => sectionObserver.observe(s));

/* ---- Smooth scroll for all anchor links ---- */
document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
        const target = document.querySelector(a.getAttribute('href'));
        if (!target) return;
        e.preventDefault();
        const offset = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 72;
        window.scrollTo({ top: target.offsetTop - offset, behavior: 'smooth' });
    });
});

/* ---- Reveal on scroll (IntersectionObserver) ---- */
const revealObserver = new IntersectionObserver(entries => {
    entries.forEach((entry, i) => {
        if (!entry.isIntersecting) return;
        setTimeout(() => entry.target.classList.add('visible'), i * 80);
        revealObserver.unobserve(entry.target);
    });
}, { threshold: .1, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

/* ---- Lightbox ---- */
const lightbox  = document.getElementById('lightbox');
const lbImg     = document.getElementById('lbImg');
const lbCaption = document.getElementById('lbCaption');
const lbCounter = document.getElementById('lbCounter');
const lbClose   = document.getElementById('lbClose');
const lbPrev    = document.getElementById('lbPrev');
const lbNext    = document.getElementById('lbNext');

const galleryItems = Array.from(document.querySelectorAll('.gallery-item'));
let currentIndex = 0;

function openLightbox(index) {
    currentIndex = index;
    const item = galleryItems[currentIndex];
    lbImg.src = item.dataset.src;
    lbImg.alt = item.querySelector('img').alt;
    lbCaption.textContent = item.dataset.caption || '';
    lbCounter.textContent = (currentIndex + 1) + ' / ' + galleryItems.length;
    lightbox.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    lbImg.focus?.();
}

function closeLightbox() {
    lightbox.style.display = 'none';
    lbImg.src = '';
    document.body.style.overflow = '';
}

function showPrev() {
    currentIndex = (currentIndex - 1 + galleryItems.length) % galleryItems.length;
    openLightbox(currentIndex);
}

function showNext() {
    currentIndex = (currentIndex + 1) % galleryItems.length;
    openLightbox(currentIndex);
}

galleryItems.forEach((item, i) => {
    item.addEventListener('click', () => openLightbox(i));
    item.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(i); } });
    item.setAttribute('tabindex', '0');
    item.setAttribute('role', 'button');
});

lbClose.addEventListener('click', closeLightbox);
lbPrev.addEventListener('click', e => { e.stopPropagation(); showPrev(); });
lbNext.addEventListener('click', e => { e.stopPropagation(); showNext(); });

lightbox.addEventListener('click', e => {
    if (e.target === lightbox) closeLightbox();
});

document.addEventListener('keydown', e => {
    if (lightbox.style.display === 'none') return;
    if (e.key === 'Escape')     closeLightbox();
    if (e.key === 'ArrowLeft')  showPrev();
    if (e.key === 'ArrowRight') showNext();
});

/* Touch swipe on lightbox */
let touchStartX = 0;
lightbox.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].clientX; }, { passive: true });
lightbox.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 50) dx < 0 ? showNext() : showPrev();
});

/* ---- Hide gallery items whose image fails to load ---- */
document.querySelectorAll('.gallery-item img').forEach(img => {
    img.addEventListener('error', () => { img.closest('.gallery-item').style.display = 'none'; });
});

/* ---- Back to top ---- */
const backToTop = document.getElementById('backToTop');
backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

/* ---- Contact form validation ---- */
const form        = document.getElementById('contactForm');
const formSuccess = document.getElementById('formSuccess');

const validators = {
    nom:       v => v.trim().length >= 2  ? '' : 'Veuillez saisir votre nom.',
    prenom:    v => v.trim().length >= 2  ? '' : 'Veuillez saisir votre prénom.',
    telephone: v => /^(\+33|0)[0-9]{9}$/.test(v.replace(/\s/g,'')) ? '' : 'Numéro de téléphone invalide.',
    email:     v => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : 'Adresse email invalide.',
    travaux:   v => v ? '' : 'Veuillez sélectionner un type de travaux.',
    message:   v => v.trim().length >= 10 ? '' : 'Décrivez votre projet en quelques mots (10 caractères minimum).',
    rgpd:      (_, el) => el.checked ? '' : 'Vous devez accepter les conditions.',
};

function validateField(name) {
    const el  = form.elements[name];
    const err = document.getElementById('err-' + name);
    if (!el || !err) return true;
    const msg = validators[name] ? validators[name](el.value, el) : '';
    err.textContent = msg;
    el.classList.toggle('error', !!msg);
    return !msg;
}

Object.keys(validators).forEach(name => {
    const el = form.elements[name];
    if (el) el.addEventListener('blur', () => validateField(name));
    if (el) el.addEventListener('input', () => { if (el.classList.contains('error')) validateField(name); });
});

/* ----------------------------------------------------------------
   FORMSPREE — remplacez VOTRE_ID par l'identifiant Formspree
   Ex : https://formspree.io/f/xyzabcde  →  VOTRE_ID = xyzabcde
   Laissez VOTRE_ID tel quel pour garder la simulation locale.
---------------------------------------------------------------- */
const FORMSPREE_ID = 'xeevnbvj';

form.addEventListener('submit', async e => {
    e.preventDefault();
    const valid = Object.keys(validators).map(validateField).every(Boolean);
    if (!valid) {
        const firstErr = form.querySelector('.error');
        if (firstErr) firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }

    const submitBtn = form.querySelector('[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Envoi en cours…';

    if (FORMSPREE_ID === 'VOTRE_ID') {
        /* Mode simulation locale (pas encore configuré) */
        await new Promise(r => setTimeout(r, 800));
        showSuccess();
        return;
    }

    try {
        const formData = new FormData(form);
        const payload = {
            nom:       form.querySelector('[name="nom"]')?.value       || '',
            prenom:    form.querySelector('[name="prenom"]')?.value    || '',
            telephone: form.querySelector('[name="telephone"]')?.value || '',
            email:     form.querySelector('[name="email"]')?.value     || '',
            service:   form.querySelector('[name="travaux"]')?.value   || '',
            message:   form.querySelector('[name="message"]')?.value   || '',
        };

        const [formspreeRes] = await Promise.all([
            fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
                method: 'POST', body: formData, headers: { 'Accept': 'application/json' }
            }),
            fetch('https://site-artisan-carcassonne.vercel.app/api/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }).then(r => { if (!r.ok) console.error('[SPC] save error', r.status); })
              .catch(e => console.error('[SPC] save network error', e))
        ]);

        if (formspreeRes.ok) {
            showSuccess();
        } else {
            throw new Error('Erreur serveur');
        }
    } catch {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        alert('Une erreur est survenue. Veuillez nous appeler directement au 06 42 60 76 31.');
    }

    function showSuccess() {
        form.style.display = 'none';
        formSuccess.style.display = 'block';
        formSuccess.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
});

/* ---- Hide mobile phone btn when contact section is visible ---- */
const contactSection  = document.getElementById('contact');
const mobilPhoneBtn   = document.querySelector('.mobile-phone-btn');

if (contactSection && mobilPhoneBtn) {
    const contactObserver = new IntersectionObserver(entries => {
        mobilPhoneBtn.style.display = entries[0].isIntersecting ? 'none' : '';
    }, { threshold: .1 });
    contactObserver.observe(contactSection);
}

/* ---- Team photo placeholder ---- */
const teamImg         = document.getElementById('teamImg');
const teamPlaceholder = document.getElementById('teamPlaceholder');
if (teamImg && teamPlaceholder) {
    const showPlaceholder = () => { teamImg.style.display = 'none'; teamPlaceholder.style.display = 'flex'; };
    const hidePlaceholder = () => { teamPlaceholder.style.display = 'none'; };
    if (teamImg.complete) {
        teamImg.naturalWidth ? hidePlaceholder() : showPlaceholder();
    } else {
        teamPlaceholder.style.display = 'flex';
        teamImg.addEventListener('load',  hidePlaceholder);
        teamImg.addEventListener('error', showPlaceholder);
    }
}

/* ---- Nav link active style ---- */
const style = document.createElement('style');
style.textContent = `
.nav-link.active { color: var(--secondary) !important; }
#navbar.scrolled .nav-link.active { color: var(--primary) !important; }
`;
document.head.appendChild(style);
