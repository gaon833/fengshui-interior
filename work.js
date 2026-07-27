let activeSize = 'all';

function applyFilters() {
  document.querySelectorAll('.work-tile').forEach(tile => {
    const sizeMatch = activeSize === 'all' || tile.dataset.size === activeSize;
    tile.classList.toggle('is-hidden', !sizeMatch);
  });
}

function setActive(selector, clicked) {
  document.querySelectorAll(selector).forEach(button => button.classList.remove('active'));
  clicked.classList.add('active');
}

document.querySelectorAll('[data-size-filter]').forEach(button => {
  button.addEventListener('click', () => {
    activeSize = button.dataset.sizeFilter;
    setActive('[data-size-filter]', button);
    applyFilters();
  });
});
