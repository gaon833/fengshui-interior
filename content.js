async function loadJSON(path) {
  const response = await fetch(path, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Failed to load ${path}`);
  return response.json();
}

(async function loadSiteSettings() {
  try {
    const data = await loadJSON('/content/site.json');

    document.querySelectorAll('[data-site-name]').forEach(el => {
      el.textContent = data.site_name || '풍수 인테리어';
    });

    const hero = document.getElementById('heroImage');
    if (hero && data.hero_image) hero.src = data.hero_image;

    document.querySelectorAll('[data-blog-link]').forEach(link => {
      link.href = data.blog_url || 'https://kr.pinterest.com/';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    });

    document.querySelectorAll('[data-instagram-link]').forEach(link => {
      link.href = data.instagram_url || 'https://kr.pinterest.com/';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    });

    if (data.site_name) {
      document.title = document.title.replace('풍수 인테리어', data.site_name);
    }
  } catch (error) {
    console.warn(error);
  }
})();
