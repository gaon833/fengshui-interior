
(() => {
  const SOURCE_SELECTORS = [
    '.fixed-page-nav',
    '.side-nav:not(.drawer .side-nav)'
  ];

  const TARGET_SELECTORS = [
    '.drawer > nav.side-nav',
    '.drawer nav.side-nav',
    '.drawer .side-nav'
  ];

  const LINK_PROPERTIES = [
    'font-family',
    'font-size',
    'font-style',
    'font-weight',
    'font-stretch',
    'font-variant',
    'line-height',
    'letter-spacing',
    'word-spacing',
    'text-transform',
    'text-decoration',
    'text-rendering',
    '-webkit-font-smoothing',
    'color',
    'opacity',
    'height',
    'min-height',
    'max-height',
    'padding-top',
    'padding-right',
    'padding-bottom',
    'padding-left',
    'margin-top',
    'margin-right',
    'margin-bottom',
    'margin-left',
    'display',
    'align-items',
    'justify-content',
    'box-sizing'
  ];

  const NAV_PROPERTIES = [
    'display',
    'flex-direction',
    'align-items',
    'justify-content',
    'row-gap',
    'column-gap',
    'gap',
    'padding-top',
    'padding-right',
    'padding-bottom',
    'padding-left',
    'margin-top',
    'margin-right',
    'margin-bottom',
    'margin-left',
    'box-sizing'
  ];

  const DIVIDER_PROPERTIES = [
    'display',
    'width',
    'height',
    'min-width',
    'max-width',
    'border-top-width',
    'border-top-style',
    'border-top-color',
    'background-color',
    'opacity',
    'margin-top',
    'margin-right',
    'margin-bottom',
    'margin-left',
    'padding-top',
    'padding-right',
    'padding-bottom',
    'padding-left',
    'box-sizing'
  ];

  function firstVisible(selectors) {
    for (const selector of selectors) {
      const nodes = Array.from(document.querySelectorAll(selector));
      const visible = nodes.find(node => {
        const rect = node.getBoundingClientRect();
        const style = getComputedStyle(node);
        return rect.width > 0 && rect.height > 0 && style.display !== 'none';
      });
      if (visible) return visible;
    }
    return null;
  }

  function copyComputed(source, target, properties) {
    if (!source || !target) return;
    const computed = getComputedStyle(source);
    properties.forEach(property => {
      const value = computed.getPropertyValue(property);
      if (value) target.style.setProperty(property, value, 'important');
    });
  }

  function elementList(nav, selector) {
    return Array.from(nav.querySelectorAll(selector));
  }

  function syncMenuStyles() {
    if (window.innerWidth < 901) return;

    const sourceNav = firstVisible(SOURCE_SELECTORS);
    const targetNav = firstVisible(TARGET_SELECTORS);
    if (!sourceNav || !targetNav || sourceNav === targetNav) return;

    // 메뉴 컨테이너의 계산된 레이아웃값 복사
    copyComputed(sourceNav, targetNav, NAV_PROPERTIES);

    const sourceLinks = elementList(sourceNav, ':scope > a');
    const targetLinks = elementList(targetNav, ':scope > a');

    sourceLinks.forEach((sourceLink, index) => {
      const targetLink = targetLinks[index];
      if (!targetLink) return;
      copyComputed(sourceLink, targetLink, LINK_PROPERTIES);

      // active 상태 여부와 무관하게 동일한 기본 톤 유지
      const sourceColor = getComputedStyle(sourceLink).color;
      targetLink.style.setProperty('color', sourceColor, 'important');
    });

    const sourceDivider = sourceNav.querySelector(':scope > .menu-divider, :scope > hr');
    const targetDivider = targetNav.querySelector(':scope > .menu-divider, :scope > hr');
    copyComputed(sourceDivider, targetDivider, DIVIDER_PROPERTIES);

    // 첫 PROJECT 글자의 실제 화면 좌표를 정확히 일치
    const sourceFirst = sourceLinks[0];
    const targetFirst = targetLinks[0];
    if (sourceFirst && targetFirst) {
      const sourceRect = sourceFirst.getBoundingClientRect();
      const targetRect = targetFirst.getBoundingClientRect();
      const currentTop = parseFloat(getComputedStyle(targetNav).top);
      const deltaY = sourceRect.top - targetRect.top;

      targetNav.style.setProperty('position', 'absolute', 'important');

      if (Number.isFinite(currentTop)) {
        targetNav.style.setProperty('top', `${currentTop + deltaY}px`, 'important');
      } else {
        const drawer = targetNav.closest('.drawer');
        const drawerTop = drawer ? drawer.getBoundingClientRect().top : 0;
        targetNav.style.setProperty('top', `${sourceRect.top - drawerTop}px`, 'important');
      }

      targetNav.style.setProperty('transform', 'none', 'important');
    }
  }

  function scheduleSync() {
    requestAnimationFrame(() => {
      syncMenuStyles();
      requestAnimationFrame(syncMenuStyles);
    });
    setTimeout(syncMenuStyles, 80);
    setTimeout(syncMenuStyles, 250);
    setTimeout(syncMenuStyles, 500);
  }

  document.addEventListener('DOMContentLoaded', scheduleSync);
  window.addEventListener('load', scheduleSync);
  window.addEventListener('resize', scheduleSync);

  document.addEventListener('click', event => {
    if (event.target.closest('.menu-button, .fixed-page-menu-button, .detail-menu-button, .drawer-close')) {
      scheduleSync();
    }
  });

  const observer = new MutationObserver(() => scheduleSync());
  observer.observe(document.documentElement, {
    attributes: true,
    subtree: true,
    attributeFilter: ['class', 'style', 'aria-hidden']
  });
})();
