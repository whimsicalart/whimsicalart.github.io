(function () {
  'use strict';

  var shots = Array.prototype.slice.call(document.querySelectorAll('.shot'));
  if (!shots.length) return;

  var tracks = Array.prototype.slice.call(document.querySelectorAll('.shot-track'));

  var lightbox = document.querySelector('.lightbox');
  var img = document.getElementById('lightbox-img');
  var caption = document.getElementById('lightbox-caption');
  var closeBtn = document.querySelector('.lightbox-close');
  var prevBtn = document.querySelector('.lightbox-prev');
  var nextBtn = document.querySelector('.lightbox-next');
  var lastFocused = null;
  var current = -1;
  var fallbackSrc = '';
  var justOpened = 0;
  var lastOpenAt = 0;

  shots.forEach(function (shot, index) {
    shot.tabIndex = 0;
    shot.setAttribute('role', 'button');
    shot.setAttribute('aria-label', 'View screenshot');

    function open() {
      var now = Date.now();
      if (now - lastOpenAt < 250) return;
      lastOpenAt = now;
      show(index);
    }

    shot.addEventListener('click', open);
    if (window.PointerEvent) {
      shot.addEventListener('pointerup', function (e) {
        if (e.pointerType === 'touch') open();
      });
    }
    shot.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        show(index);
      }
    });
  });

  function setPaused(paused) {
    tracks.forEach(function (track) {
      track.classList.toggle('paused', paused);
    });
  }

  function fullSourceFor(image) {
    var src = image.getAttribute('src') || '';
    if (!src) return src;
    return src.replace(/^screenshots\/(?:phone|tablet)\//, 'screenshots/full/')
              .replace(/\.(png|jpe?g)$/i, '.webp');
  }

  function show(index) {
    current = (index + shots.length) % shots.length;
    var shot = shots[current];
    var image = shot.querySelector('img');
    var full = shot.getAttribute('data-full') || fullSourceFor(image);
    fallbackSrc = image.src;
    img.onerror = function () {
      img.onerror = null;
      img.src = fallbackSrc;
    };
    img.src = full;
    img.alt = image.alt;
    caption.textContent = image.alt;
    justOpened = Date.now();
    lastFocused = document.activeElement;
    lightbox.hidden = false;
    document.body.classList.add('scroll-lock');
    setPaused(true);
    closeBtn.focus();
  }

  function hide() {
    lightbox.hidden = true;
    document.body.classList.remove('scroll-lock');
    img.src = '';
    setPaused(false);
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  function step(direction) {
    show(current + direction);
  }

  closeBtn.addEventListener('click', hide);
  prevBtn.addEventListener('click', function () { step(-1); });
  nextBtn.addEventListener('click', function () { step(1); });

  var swipeX = 0;
  var swipeY = 0;
  var lastSwipeAt = 0;
  lightbox.addEventListener('touchstart', function (e) {
    var t = e.changedTouches[0];
    swipeX = t.clientX;
    swipeY = t.clientY;
  }, { passive: true });
  lightbox.addEventListener('touchend', function (e) {
    if (lightbox.hidden) return;
    var t = e.changedTouches[0];
    var dx = t.clientX - swipeX;
    var dy = t.clientY - swipeY;
    if (Math.abs(dx) < 50) return;
    if (Math.abs(dx) < Math.abs(dy) * 1.5) return;
    e.preventDefault();
    lastSwipeAt = Date.now();
    step(dx < 0 ? 1 : -1);
  }, { passive: false });

  lightbox.addEventListener('click', function (e) {
    if (e.target !== lightbox) return;
    var now = Date.now();
    if (now - justOpened < 350) return;
    if (now - lastSwipeAt < 400) return;
    hide();
  });

  document.addEventListener('keydown', function (e) {
    if (lightbox.hidden) return;
    if (e.key === 'Escape') hide();
    if (e.key === 'ArrowLeft') step(-1);
    if (e.key === 'ArrowRight') step(1);
  });

  document.addEventListener('touchstart', function () {
    if (lightbox.hidden) setPaused(true);
  }, { passive: true });
  document.addEventListener('touchend', function () {
    window.setTimeout(function () {
      if (lightbox.hidden) setPaused(false);
    }, 1200);
  }, { passive: true });
})();