/**
 * Navigation — Header + mobile menu + smooth scroll
 */
export class Navigation {
  constructor() {
    this.header = document.getElementById('header');
    this.menuBtn = document.getElementById('menu-toggle');
    this.mobileMenu = document.getElementById('mobile-menu');
    this.isOpen = false;

    this.init();
  }

  init() {
    // Mobile menu toggle
    this.menuBtn.addEventListener('click', () => this.toggle());

    // Close on link click
    const mobileLinks = this.mobileMenu.querySelectorAll('.mobile-menu__link');
    mobileLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = link.getAttribute('href');
        this.close();
        setTimeout(() => {
          const el = document.querySelector(target);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 400);
      });
    });

    // Desktop nav smooth scroll
    const navLinks = this.header.querySelectorAll('.header__nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = link.getAttribute('href');
        const el = document.querySelector(target);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      });
    });

    // Logo scroll to top
    const logo = this.header.querySelector('.header__logo');
    logo.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  toggle() {
    this.isOpen ? this.close() : this.open();
  }

  open() {
    this.isOpen = true;
    this.menuBtn.classList.add('active');
    this.menuBtn.setAttribute('aria-expanded', 'true');
    this.mobileMenu.classList.add('open');
    this.mobileMenu.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  close() {
    this.isOpen = false;
    this.menuBtn.classList.remove('active');
    this.menuBtn.setAttribute('aria-expanded', 'false');
    this.mobileMenu.classList.remove('open');
    this.mobileMenu.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
}
