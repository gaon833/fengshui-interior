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


/* ===== V18: 메뉴 상태 동기화 ===== */
(() => {
  const buttons = document.querySelectorAll('.menu-button');
  const drawer = document.querySelector('.drawer');

  function sync(open) {
    buttons.forEach(btn => btn.setAttribute('aria-expanded', open ? 'true' : 'false'));
    document.body.classList.toggle('menu-open', open);
    if (drawer) drawer.classList.toggle('is-open', open);
  }

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const next = btn.getAttribute('aria-expanded') !== 'true';
      window.setTimeout(() => sync(next), 0);
    });
  });

  document.querySelectorAll('.drawer-close, .page-dim').forEach(el => {
    el.addEventListener('click', () => window.setTimeout(() => sync(false), 0));
  });
})();
