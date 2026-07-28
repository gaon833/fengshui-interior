(() => {
  let activeSize = 'all';

  const columns = Array.from(document.querySelectorAll('.portfolio-column'));
  const leftColumn = columns[0];
  const rightColumn = columns[1];
  const tiles = Array.from(document.querySelectorAll('.work-tile'));

  if (!leftColumn || !rightColumn || !tiles.length) return;

  const originalLayout = tiles.map(tile => ({
    tile,
    parent: tile.parentElement
  }));

  function restoreOriginalLayout() {
    originalLayout
      .filter(item => item.parent === leftColumn)
      .forEach(item => leftColumn.appendChild(item.tile));

    originalLayout
      .filter(item => item.parent === rightColumn)
      .forEach(item => rightColumn.appendChild(item.tile));
  }

  function arrangeFilteredTiles(matches) {
    const isMobile = window.matchMedia('(max-width: 600px)').matches;

    if (isMobile) {
      matches.forEach(tile => leftColumn.appendChild(tile));
      return;
    }

    // 필터 화면은 첫 이미지가 왼쪽에서 시작하고,
    // 왼쪽 → 오른쪽 → 왼쪽 → 오른쪽 순서로 채움
    matches.forEach((tile, index) => {
      const targetColumn = index % 2 === 0 ? leftColumn : rightColumn;
      targetColumn.appendChild(tile);
    });
  }

  function applyFilters() {
    if (activeSize === 'all') {
      restoreOriginalLayout();
      tiles.forEach(tile => tile.classList.remove('is-hidden'));
      return;
    }

    const matches = tiles.filter(tile => tile.dataset.size === activeSize);

    tiles.forEach(tile => {
      tile.classList.toggle('is-hidden', tile.dataset.size !== activeSize);
    });

    arrangeFilteredTiles(matches);
  }

  document.querySelectorAll('[data-size-filter]').forEach(button => {
    button.addEventListener('click', () => {
      activeSize = button.dataset.sizeFilter;

      document.querySelectorAll('[data-size-filter]').forEach(item => {
        item.classList.remove('active');
        item.setAttribute('aria-pressed', 'false');
      });

      button.classList.add('active');
      button.setAttribute('aria-pressed', 'true');
      applyFilters();
    });
  });

  let resizeTimer;
  window.addEventListener('resize', () => {
    if (activeSize === 'all') return;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(applyFilters, 120);
  });
})();
