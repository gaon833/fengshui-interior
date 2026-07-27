
let allProjects = [];

function renderProjects(filter = 'all') {
  const grid = document.getElementById('projectGrid');
  grid.innerHTML = '';
  allProjects
    .filter(item => filter === 'all' || item.category === filter)
    .forEach(item => {
      const article = document.createElement('article');
      article.className = 'project-card';
      article.innerHTML = `
        <img src="${item.image}" alt="${item.title}">
        <div class="project-meta">
          <div><strong>${item.title}</strong><span>${item.category}</span></div>
          <time>${item.year || ''}</time>
        </div>`;
      grid.appendChild(article);
    });
}

loadJSON('/content/projects.json').then(data => {
  allProjects = data.projects || [];
  renderProjects();
});

document.querySelectorAll('[data-filter]').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('active'));
    button.classList.add('active');
    renderProjects(button.dataset.filter);
  });
});
