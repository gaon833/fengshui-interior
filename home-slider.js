(() => {
  const slides = Array.from(document.querySelectorAll('.home-slide'));
  if (slides.length < 2) return;

  let index = 0;
  const intervalMs = 5000;

  window.setInterval(() => {
    slides[index].classList.remove('is-active');
    index = (index + 1) % slides.length;
    slides[index].classList.add('is-active');
  }, intervalMs);
})();
