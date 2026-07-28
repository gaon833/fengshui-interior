
(() => {
  const MENU_ITEMS = [
    { key: 'project', label: 'PROJECT', href: 'project.html' },
    { key: 'service', label: 'SERVICE', href: 'service.html' },
    { key: 'studio', label: 'STUDIO', href: 'studio.html' },
    { key: 'reservation', label: 'RESERVATION', href: 'reservation.html' }
  ];

  const CHANNEL_ITEMS = [
    { label: 'BLOG', settingKey: 'blogUrl', fallback: '#' },
    { label: 'INSTAGRAM', settingKey: 'instagramUrl', fallback: '#' }
  ];

  function basePrefix() {
    return location.pathname.includes('/work/') ? '../../' : '';
  }

  function currentKey() {
    const file = location.pathname.split('/').pop() || 'index.html';
    if (file === 'project.html' || location.pathname.includes('/work/')) return 'project';
    if (file === 'service.html') return 'service';
    if (file === 'studio.html' || file === 'about.html') return 'studio';
    if (file === 'reservation.html' || file === 'contact.html') return 'reservation';
    return '';
  }

  function readSettings() {
    try {
      return JSON.parse(localStorage.getItem('fengshuiSiteContent') || '{}');
    } catch {
      return {};
    }
  }

  function createMenuMarkup() {
    const prefix = basePrefix();
    const active = currentKey();
    const settings = readSettings();

    const primary = MENU_ITEMS.map(item => {
      const activeClass = item.key === active ? ' active' : '';
      return `<a class="site-menu-link${activeClass}" href="${prefix}${item.href}">${item.label}</a>`;
    }).join('');

    const channels = CHANNEL_ITEMS.map(item => {
      const href = settings[item.settingKey] || item.fallback;
      return `<a class="site-menu-link site-menu-channel" href="${href}" target="_blank" rel="noopener">${item.label}</a>`;
    }).join('');

    return `${primary}<span class="site-menu-divider" aria-hidden="true"></span>${channels}`;
  }

  function renderMenus() {
    const markup = createMenuMarkup();
    document.querySelectorAll('[data-shared-menu]').forEach(nav => {
      nav.classList.add('site-menu');
      nav.innerHTML = markup;
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderMenus);
  } else {
    renderMenus();
  }
})();
