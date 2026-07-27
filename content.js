
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
    if (data.site_name) document.title = document.title.replace('풍수 인테리어', data.site_name);
  } catch (error) {
    console.warn(error);
  }
})();
