
(() => {
  function readSettings() {
    try {
      return JSON.parse(localStorage.getItem('fengshuiSiteContent') || '{}');
    } catch {
      return {};
    }
  }

  function applyChannelLinks() {
    const settings = readSettings();
    document.querySelectorAll('[data-blog-link]').forEach(link => {
      link.href = settings.blogUrl || '#';
    });
    document.querySelectorAll('[data-instagram-link]').forEach(link => {
      link.href = settings.instagramUrl || '#';
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyChannelLinks);
  } else {
    applyChannelLinks();
  }
})();
