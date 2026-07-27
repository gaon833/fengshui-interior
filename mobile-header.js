(() => {
  const mobileQuery = window.matchMedia('(max-width: 760px)');
  const logoSelectors = [
    '.detail-logo',
    '.site-logo',
    '.fixed-page-logo',
    '.brand',
    '.logo',
    'header a[href*="index"]'
  ];
  const menuSelectors = [
    '.detail-menu-button',
    '.fixed-page-menu-button',
    '.menu-button'
  ];

  const logos = Array.from(document.querySelectorAll(logoSelectors.join(',')));
  const buttons = Array.from(document.querySelectorAll(menuSelectors.join(',')));

  // 같은 요소가 여러 선택자로 잡혀도 한 번만 처리
  const controls = Array.from(new Set([...logos, ...buttons]));

  if (!controls.length) return;

  let ticking = false;

  function updateControls() {
    const isMobile = mobileQuery.matches;
    const menuOpen = document.body.classList.contains('menu-open');
    const shouldHide = isMobile && window.scrollY > 50 && !menuOpen;

    controls.forEach(element => {
      element.classList.toggle('mobile-scroll-hidden', shouldHide);
    });

    ticking = false;
  }

  function requestUpdate() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(updateControls);
  }

  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate);
  mobileQuery.addEventListener?.('change', requestUpdate);

  // 메뉴 열림/닫힘 뒤 상태 즉시 재계산
  document.addEventListener('click', () => {
    window.setTimeout(requestUpdate, 0);
    window.setTimeout(requestUpdate, 400);
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      window.setTimeout(requestUpdate, 0);
    }
  });

  updateControls();
})();
