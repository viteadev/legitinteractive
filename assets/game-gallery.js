(() => {
  const gallery = document.getElementById('gameGallery');
  if (!gallery) return;
  const slides = Array.from(gallery.querySelectorAll('.game-slide'));
  const dots = Array.from(document.querySelectorAll('.gallery-dot'));
  const count = document.getElementById('galleryCount');
  const previous = gallery.querySelector('.gallery-prev');
  const next = gallery.querySelector('.gallery-next');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let current = 0;
  let timer = 0;

  function showSlide(index) {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => {
      const active = slideIndex === current;
      slide.classList.toggle('is-active', active);
      slide.setAttribute('aria-hidden', String(!active));
    });
    dots.forEach((dot, dotIndex) => {
      const active = dotIndex === current;
      dot.classList.toggle('is-active', active);
      if (active) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });
    if (count) count.textContent = `${String(current + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
  }

  function scheduleNext() {
    window.clearTimeout(timer);
    if (reducedMotion || document.hidden || gallery.matches(':hover') || gallery.contains(document.activeElement)) return;
    timer = window.setTimeout(() => {
      showSlide(current + 1);
      scheduleNext();
    }, 5000 + Math.random() * 5000);
  }

  previous.addEventListener('click', () => { showSlide(current - 1); scheduleNext(); });
  next.addEventListener('click', () => { showSlide(current + 1); scheduleNext(); });
  dots.forEach((dot, index) => dot.addEventListener('click', () => { showSlide(index); scheduleNext(); }));
  gallery.addEventListener('mouseenter', () => window.clearTimeout(timer));
  gallery.addEventListener('mouseleave', scheduleNext);
  gallery.addEventListener('focusin', () => window.clearTimeout(timer));
  gallery.addEventListener('focusout', event => { if (!gallery.contains(event.relatedTarget)) scheduleNext(); });
  document.addEventListener('visibilitychange', scheduleNext);
  showSlide(0);
  scheduleNext();
})();
