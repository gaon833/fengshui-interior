(() => {
  const referenceNav = document.querySelector('.fixed-page-nav');
  const drawerNav = document.querySelector('.drawer .side-nav');

  if (!referenceNav || !drawerNav) return;

  function alignDrawerMenu() {
    if (window.innerWidth < 901) {
      drawerNav.style.removeProperty('top');
      drawerNav.style.removeProperty('transform');
      return;
    }

    const refRect = referenceNav.getBoundingClientRect();
    const drawer = drawerNav.closest('.drawer');
    if (!drawer) return;

    const drawerRect = drawer.getBoundingClientRect();
    const targetTop = refRect.top - drawerRect.top;

    drawerNav.style.position = 'absolute';
    drawerNav.style.top = `${Math.round(targetTop)}px`;
    drawerNav.style.left = '';
    drawerNav.style.transform = 'none';
    drawerNav.style.marginTop = '0';
  }

  alignDrawerMenu();
  window.addEventListener('resize', alignDrawerMenu);

  const button = document.querySelector('.menu-button');
  if (button) {
    button.addEventListener('click', () => {
      requestAnimationFrame(alignDrawerMenu);
      setTimeout(alignDrawerMenu, 420);
    });
  }
})();
