(() => {
  let activeSize = 'all';

  const columns = Array.from(document.querySelectorAll('.portfolio-column'));
  const leftColumn = columns[0];
  const rightColumn = columns[1];
  const tiles = Array.from(document.querySelectorAll('.work-tile'));

  if (!leftColumn || !rightColumn || !tiles.length) return;

  // ALL 화면으로 돌아갈 때 원래 좌·우 배치를 정확히 복원하기 위한 위치 저장
  const originalLayout = tiles.map((tile, index) => ({
    tile,
    parent: tile.parentElement,
    index
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
      // 모바일은 한 줄이므로 선택된 이미지를 오른쪽 열에 순서대로 모아 바로 표시
      matches.forEach(tile => rightColumn.appendChild(tile));
      return;
    }

    // PC/태블릿: 첫 이미지가 항상 오른쪽부터 시작하고 이후 오른쪽 → 왼쪽 순서로 배치
    matches.forEach((tile, index) => {
      const targetColumn = index % 2 === 0 ? rightColumn : leftColumn;
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

    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(applyFilters, 120);
  });
})();
