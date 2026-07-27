let allProjects = [];
let activeStyle = 'all';
let activeSize = 'all';

function normalizedStyle(item) {
  return item.style || 'Modern';
}

function normalizedSize(item) {
  if (item.sizeGroup) return String(item.sizeGroup);
  const area = String(item.area || '');
  const match = area.match(/(20|30|40|50|60)/);
  if (match) return match[1];
  return item.category === 'Commercial' || item.category === 'Office' ? 'C' : '30';
}

function renderProjects() {
  const grid = document.getElementById('projectGrid');
  grid.innerHTML = '';

  allProjects
    .filter(item => activeStyle === 'all' || normalizedStyle(item) === activeStyle)
    .filter(item => activeSize === 'all' || normalizedSize(item) === activeSize)
    .forEach(item => {
      const link = document.createElement('a');
      link.className = 'project-card';
      link.href = item.slug ? `work/${item.slug}/` : '#';
      link.innerHTML = `
        <div class="project-image">
          <img src="${item.image || item.cover || 'assets/hero.jpg'}" alt="${item.title || 'project'}">
        </div>
        <div class="project-meta">
          <div>
            <strong>${item.title || ''}</strong>
            <span>${item.category || ''}${item.area ? ` · ${item.area}` : ''}</span>
          </div>
          <time>${item.year || ''}</time>
        </div>`;
      grid.appendChild(link);
    });
}

function activateButtons(selector, clicked) {
  document.querySelectorAll(selector).forEach(button => button.classList.remove('active'));
  clicked.classList.add('active');
}

document.querySelectorAll('[data-style-filter]').forEach(button => {
  button.addEventListener('click', () => {
    activeStyle = button.dataset.styleFilter;
    activateButtons('[data-style-filter]', button);
    renderProjects();
  });
});

document.querySelectorAll('[data-size-filter]').forEach(button => {
  button.addEventListener('click', () => {
    activeSize = button.dataset.sizeFilter;
    activateButtons('[data-size-filter]', button);
    renderProjects();
  });
});

loadJSON('/content/projects.json')
  .then(data => {
    allProjects = data.projects || [];
    renderProjects();
  })
  .catch(error => {
    console.warn(error);
    allProjects = [];
    renderProjects();
  });
