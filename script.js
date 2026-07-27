const menuBtn = document.querySelector('[data-menu-enabled]');
const drawer = document.querySelector('.drawer');
const closeBtn = document.querySelector('.drawer-close');
const dim = document.querySelector('.page-dim');

function setMenu(open) {
  if (!menuBtn || !drawer || !dim) return;

  menuBtn.setAttribute('aria-expanded', String(open));
  drawer.classList.toggle('open', open);
  drawer.classList.toggle('is-open', open);
  drawer.setAttribute('aria-hidden', String(!open));

  dim.classList.toggle('open', open);
  dim.setAttribute('aria-hidden', String(!open));

  document.body.classList.toggle('menu-open', open);
  document.body.style.overflow = open ? 'hidden' : '';
}

if (menuBtn) {
  menuBtn.addEventListener('click', () => {
    setMenu(menuBtn.getAttribute('aria-expanded') !== 'true');
  });
}

if (closeBtn) closeBtn.addEventListener('click', () => setMenu(false));
if (dim) dim.addEventListener('click', () => setMenu(false));

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') setMenu(false);
});
