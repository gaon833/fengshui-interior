const menuBtn = document.querySelector('.menu-button');
const drawer = document.querySelector('.drawer');
const closeBtn = document.querySelector('.drawer-close');
const dim = document.querySelector('.page-dim');

function setMenu(open) {
  if (!menuBtn || !drawer || !dim) return;

  menuBtn.classList.toggle('active', open);
  menuBtn.setAttribute('aria-expanded', String(open));

  drawer.classList.toggle('open', open);
  drawer.setAttribute('aria-hidden', String(!open));

  dim.classList.toggle('open', open);
  dim.setAttribute('aria-hidden', String(!open));

  document.body.style.overflow = open ? 'hidden' : '';
}

if (menuBtn) {
  menuBtn.addEventListener('click', () => {
    setMenu(!drawer.classList.contains('open'));
  });
}

if (closeBtn) {
  closeBtn.addEventListener('click', () => setMenu(false));
}

if (dim) {
  dim.addEventListener('click', () => setMenu(false));
}

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') setMenu(false);
});
