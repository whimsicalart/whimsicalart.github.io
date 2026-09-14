(function () {
  'use strict';

  var shots = Array.prototype.slice.call(document.querySelectorAll('.shot'));
  if (!shots.length) return;

  var strips = Array.prototype.slice.call(document.querySelectorAll('.shot-strip'));

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
      if (now - lastDragAt < 350) return;
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

  var stripControllers = [];

  var SCROLL_SPEED = 0.8;
  var lastDragAt = 0;
  var reducedMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  strips.forEach(function (strip) {
    var paused = false;
    var drag = null;
    var rafId = 0;
    var resumeTimer = 0;

    function step() {
      rafId = 0;
      if (document.hidden) return;
      var half = strip.scrollWidth / 2;
      if (!paused) {
        strip.scrollLeft += SCROLL_SPEED;
        if (strip.scrollLeft >= half) strip.scrollLeft -= half;
      }
      rafId = requestAnimationFrame(step);
    }

    function pause() {
      paused = true;
      window.clearTimeout(resumeTimer);
    }

    function resume() {
      paused = false;
    }

    function resumeLater(ms) {
      window.clearTimeout(resumeTimer);
      if (lightbox.hidden && !drag) {
        resumeTimer = window.setTimeout(resume, ms);
      }
    }

    stripControllers.push({ pause: pause, resume: resume });

    strip.addEventListener('mouseenter', pause);
    strip.addEventListener('mouseleave', resume);

    strip.addEventListener('touchstart', pause, { passive: true });
    strip.addEventListener('touchend', function () {
      resumeLater(1200);
    }, { passive: true });
    strip.addEventListener('touchcancel', function () {
      resumeLater(1200);
    }, { passive: true });

    if (window.PointerEvent) {
      strip.addEventListener('pointerdown', function (e) {
        if (e.pointerType !== 'mouse') return;
        drag = { id: e.pointerId, x: e.clientX, left: strip.scrollLeft, moved: false };
        strip.setPointerCapture(e.pointerId);
        strip.classList.add('dragging');
        pause();
      });
      strip.addEventListener('pointermove', function (e) {
        if (!drag || e.pointerId !== drag.id) return;
        var dx = e.clientX - drag.x;
        if (Math.abs(dx) > 6) drag.moved = true;
        strip.scrollLeft = drag.left - dx;
      });
      function endDrag(e) {
        if (!drag || e.pointerId !== drag.id) return;
        if (drag.moved) lastDragAt = Date.now();
        drag = null;
        strip.classList.remove('dragging');
        if (strip.hasPointerCapture && strip.hasPointerCapture(e.pointerId)) {
          strip.releasePointerCapture(e.pointerId);
        }
        resume();
      }
      strip.addEventListener('pointerup', endDrag);
      strip.addEventListener('pointercancel', endDrag);
    }

    if (!reducedMotion) {
      rafId = requestAnimationFrame(step);
    }
  });

  function setPaused(paused) {
    stripControllers.forEach(function (c) {
      if (paused) c.pause();
      else c.resume();
    });
  }

  function fullSourceFor(image) {
    var src = image.getAttribute('src') || '';
    if (!src) return src;
    return src.replace(/^screenshots\/(?:phone|tablet)\//, 'screenshots/large/')
              .replace(/\.png$/i, '.jpg');
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
})();