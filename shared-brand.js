
(() => {
  /* 로고를 교체할 때 이 파일명 한 곳만 변경 */
  const LOGO_FILE = 'assets/logo/fengshui-interior-final.png';

  function prefix() {
    return location.pathname.includes('/work/') ? '../../' : '';
  }

  function applySharedLogo() {
    const src = prefix() + LOGO_FILE;
    document.querySelectorAll('[data-shared-brand-image]').forEach(img => {
      img.src = src;
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applySharedLogo);
  } else {
    applySharedLogo();
  }
})();
