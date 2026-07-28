
(() => {
  const ITEMS = [
    { key: 'project', label: 'PROJECT', href: 'project.html' },
    { key: 'service', label: 'SERVICE', href: 'service.html' },
    { key: 'studio', label: 'STUDIO', href: 'studio.html' },
    { key: 'reservation', label: 'RESERVATION', href: 'reservation.html' }
  ];

  function prefix() {
    return location.pathname.includes('/work/') ? '../../' : '';
  }

  function activeKey() {
    const file = location.pathname.split('/').pop() || 'index.html';
    if (location.pathname.includes('/work/') || file === 'project.html') return 'project';
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

  function markup() {
    const p = prefix();
    const active = activeKey();
    const settings = readSettings();

    const main = ITEMS.map(item => {
      const activeClass = item.key === active ? ' is-active' : '';
      return `<a class="shared-navigation__link${activeClass}" href="${p}${item.href}">${item.label}</a>`;
    }).join('');

    const blog = settings.blogUrl || '#';
    const instagram = settings.instagramUrl || '#';

    return `${main}
      <span class="shared-navigation__divider" aria-hidden="true"></span>
      <a class="shared-navigation__link is-channel" href="${blog}" target="_blank" rel="noopener">BLOG</a>
      <a class="shared-navigation__link is-channel" href="${instagram}" target="_blank" rel="noopener">INSTAGRAM</a>`;
  }

  function render() {
    const html = markup();
    document.querySelectorAll('[data-shared-navigation]').forEach(nav => {
      nav.className = 'shared-navigation';
      nav.innerHTML = html;
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();
