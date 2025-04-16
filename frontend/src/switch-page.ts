// import jwt_decode from 'jwt-decode';
import { showLoginModal } from './login';
import { jwtDecode } from 'jwt-decode';

const content = document.getElementById('content') as HTMLElement;
const navLinks = document.querySelectorAll('nav a');
console.log('Initialisation du système de navigation');
console.log('Liens de navigation trouvés :', navLinks);
const cache: Map<string, string> = new Map();

const isAuthenticated = (): boolean => {
  const token = localStorage.getItem('authToken');

  if (!token) {
    console.log('Token non trouvé');
    return false;
  }
  try {
    const decodedToken = jwtDecode(token);

    if (decodedToken.exp && decodedToken.exp * 1000 < Date.now()) {
      console.log('Token expiré');
      return false; // Token expiré
    }
    console.log('Token OK');
    return true;
  } catch (error) {
    console.error('Erreur de décodage du token :', error);
    console.log('Token invalide');
    return false; // Token invalide
  }
};

// Get page from URL
const getPageName = (): string => {
  const path = window.location.pathname.split('/').pop();
  const page = path?.replace('.html', '') || 'home';
  return page;
};

const fetch404 = async () => {
  try {
    const res = await fetch('src/views/404.html');
    if (!res.ok) throw new Error('Page 404 non trouvée');
    const html = await res.text();
    content.innerHTML = html;
    cache.set('404', html);
  } catch (err) {
    console.error('Erreur de chargement de la page 404 :', err);
    content.innerHTML = '<h1>Erreur 404 - Page non trouvée</h1>';
  }
};

// Fetch page content
const fetchPage = async (page: string): Promise<void> => {
  console.log('Chargement de la page :', page);
  if (cache.has(page)) {
    content.innerHTML = cache.get(page)!;
    return;
  }

  try {
    const res = await fetch(`src/views/${page}.html`);
    if (!res.ok) throw new Error('Page non trouvée');
    const html = await res.text();
    content.innerHTML = html;
    cache.set(page, html);
  } catch (err) {
    console.error('Erreur de chargement :', err);
    await fetch404();
  }
};

const pageRequiresAuth = (page: string): boolean => {
  const authPages = ['profile', 'edit-profile'];
  return authPages.includes(page);
};

// Switch page + update URL
const switchPage = (page: string) => {
  if (pageRequiresAuth(page) && !isAuthenticated()) {
    console.log("Page protégée, redirection vers la page de d'accueil");
    history.pushState(null, '', '/');
    void fetchPage('home');
    showLoginModal();
    return;
  }
  if (page == 'home') {
    history.pushState(null, '', '/');
    console.log('home = pas de hash');
  } else {
    console.log('hash = ', page);

    history.pushState(null, '', `${page}`);
  }
  void fetchPage(page);
};

// Change page after a reload
const loadCurrentPage = () => {
  const page = getPageName();
  void fetchPage(page);
};

// Pre-fetch all the pages
const prefetchAllPages = () => {
  navLinks.forEach((link) => {
    const page = (link as HTMLAnchorElement).dataset.page;
    if (page) {
      fetch(`src/views/${page}.html`)
        .then((res) => res.text())
        .then((html) => cache.set(page, html))
        .catch(() => console.warn(`Échec du prefetch pour ${page}`));
    }
  });
};

// Charger la page actuelle
loadCurrentPage();
prefetchAllPages();

console.log('Attacher un événement aux liens');

document.querySelectorAll('[data-page]').forEach((el) => {
  el.addEventListener('click', (e) => {
    e.preventDefault();
    const page = (el as HTMLElement).getAttribute('data-page');
    if (page) {
      switchPage(page);
    }
  });
});

// Add event listener after a page change
const attachPageLinks = () => {
  document.querySelectorAll('[data-page]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const page = (el as HTMLElement).getAttribute('data-page');
      if (page) {
        switchPage(page);
      }
    });
  });
};

window.addEventListener('popstate', () => {
  console.log('Handling back/forward navigation');
  loadCurrentPage();
});

export { switchPage, loadCurrentPage, isAuthenticated, fetchPage, fetch404 };
