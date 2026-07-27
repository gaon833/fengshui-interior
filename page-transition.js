(() => {
  const body = document.body;

  requestAnimationFrame(() => {
    body.classList.add('page-ready');
  });

  document.querySelectorAll('.page-transition-link').forEach(link => {
    link.addEventListener('click', event => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) return;

      const href = link.getAttribute('href');
      if (!href) return;

      event.preventDefault();
      body.classList.add('page-leaving');

      window.setTimeout(() => {
        window.location.href = href;
      }, 180);
    });
  });
})();
