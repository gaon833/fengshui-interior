(() => {
  const button = document.querySelector('.menu-button-enabled');
  const drawer = document.querySelector('.drawer');
  const close = document.querySelector('.drawer-close');
  const dim = document.querySelector('.page-dim');
  if (!button || !drawer) return;

  const useDim = button.dataset.menuDim === 'true';

  function setMenu(open) {
    button.setAttribute('aria-expanded', String(open));
    drawer.classList.toggle('open', open);
    drawer.classList.toggle('is-open', open);
    drawer.setAttribute('aria-hidden', String(!open));
    document.body.classList.toggle('menu-open', open);
    document.body.classList.toggle('menu-open-no-dim', open && !useDim);
    document.body.style.overflow = open ? 'hidden' : '';

    if (dim) {
      dim.classList.toggle('open', open && useDim);
      dim.setAttribute('aria-hidden', String(!(open && useDim)));
      dim.style.pointerEvents = open && useDim ? 'auto' : 'none';
    }
  }

  button.addEventListener('click', () => {
    setMenu(button.getAttribute('aria-expanded') !== 'true');
  });
  if (close) close.addEventListener('click', () => setMenu(false));
  if (dim) dim.addEventListener('click', () => { if (useDim) setMenu(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
})();