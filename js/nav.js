/* ═══════════════════════════════════════════════════════════════
   Nav — floating sticky nav with mobile toggle + scroll reveal
   ═══════════════════════════════════════════════════════════════ */
(function () {
  const nav = document.querySelector('.nav');
  const toggle = document.querySelector('.nav-toggle');
  const overlay = document.querySelector('.nav-mobile-overlay');
  const body = document.body;

  // Mobile toggle
  if (toggle && overlay) {
    toggle.addEventListener('click', () => {
      const open = overlay.classList.toggle('active');
      body.style.overflow = open ? 'hidden' : '';
      toggle.setAttribute('aria-expanded', open);
    });
    // Close on link click
    overlay.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        overlay.classList.remove('active');
        body.style.overflow = '';
        toggle.setAttribute('aria-expanded', false);
      });
    });
  }

  // Scroll-driven nav background opacity
  let ticking = false;
  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        if (nav) {
          nav.style.background = scrollY > 50
            ? 'rgba(31,31,31,0.95)'
            : 'rgba(31,31,31,0.85)';
        }
        ticking = false;
      });
      ticking = true;
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  // Intersection Observer for scroll animations
  const animEls = document.querySelectorAll('.anim-fade-up');
  if (animEls.length && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    animEls.forEach(el => observer.observe(el));
  }

  // Active nav link
  const currentPath = window.location.pathname.replace(/\/index\.html$/, '/').replace(/\.html$/, '');
  document.querySelectorAll('.nav-link, .nav-dropdown-item').forEach(link => {
    const href = link.getAttribute('href');
    if (href) {
      const linkPath = href.replace(/\/index\.html$/, '/').replace(/\.html$/, '');
      if (currentPath === linkPath || (linkPath !== '/' && currentPath.startsWith(linkPath))) {
        link.classList.add('active');
      }
    }
  });
})();
