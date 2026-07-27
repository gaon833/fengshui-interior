let activeStyle = 'all';
let activeSize = 'all';

function applyFilters() {
  document.querySelectorAll('.work-tile').forEach(tile => {
    const styleMatch = activeStyle === 'all' || tile.dataset.style === activeStyle;
    const sizeMatch = activeSize === 'all' || tile.dataset.size === activeSize;
    tile.classList.toggle('is-hidden', !(styleMatch && sizeMatch));
  });
}

function setActive(selector, clicked) {
  document.querySelectorAll(selector).forEach(button => button.classList.remove('active'));
  clicked.classList.add('active');
}

document.querySelectorAll('[data-style-filter]').forEach(button => {
  button.addEventListener('click', () => {
    activeStyle = button.dataset.styleFilter;
    setActive('[data-style-filter]', button);
    applyFilters();
  });
});

document.querySelectorAll('[data-size-filter]').forEach(button => {
  button.addEventListener('click', () => {
    activeSize = button.dataset.sizeFilter;
    setActive('[data-size-filter]', button);
    applyFilters();
  });
});
