(function () {
  'use strict';

  var shots = Array.prototype.slice.call(document.querySelectorAll('.shot'));
  if (!shots.length) return;

  var lightbox = document.querySelector('.lightbox');
  var img = document.getElementById('lightbox-img');
  var caption = document.getElementById('lightbox-caption');
  var closeBtn = document.querySelector('.lightbox-close');
  var prevBtn = document.querySelector('.lightbox-prev');
  var nextBtn = document.querySelector('.lightbox-next');
  var lastFocused = null;
  var current = -1;

  shots.forEach(function (shot, index) {
    shot.tabIndex = 0;
    shot.setAttribute('role', 'button');
    shot.setAttribute('aria-label', 'View screenshot');

    function open() {
      show(index);
    }

    shot.addEventListener('click', open);
    shot.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        show(index);
      }
    });
  });

  function show(index) {
    current = (index + shots.length) % shots.length;
    var shot = shots[current];
    var image = shot.querySelector('img');
    img.src = image.src;
    img.alt = image.alt;
    caption.textContent = image.alt;
    lastFocused = document.activeElement;
    lightbox.hidden = false;
    document.body.classList.add('scroll-lock');
    closeBtn.focus();
  }

  function hide() {
    lightbox.hidden = true;
    document.body.classList.remove('scroll-lock');
    img.src = '';
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  function step(direction) {
    show(current + direction);
  }

  closeBtn.addEventListener('click', hide);
  prevBtn.addEventListener('click', function () { step(-1); });
  nextBtn.addEventListener('click', function () { step(1); });

  lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox) hide();
  });

  document.addEventListener('keydown', function (e) {
    if (lightbox.hidden) return;
    if (e.key === 'Escape') hide();
    if (e.key === 'ArrowLeft') step(-1);
    if (e.key === 'ArrowRight') step(1);
  });
})();