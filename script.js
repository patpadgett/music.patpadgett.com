/* music.patpadgett.com — small behaviours, no dependencies */
(function () {
  'use strict';

  // stagger index for the track-sheet ink-in
  document.querySelectorAll('.tracks li').forEach(function (li, i) {
    li.style.setProperty('--i', i);
  });

  // PLAY MASTER stamp: reveal the Bandcamp player, load iframe lazily
  var stamp = document.getElementById('play-stamp');
  var player = document.getElementById('bc-player');
  if (stamp && player) {
    var frame = player.querySelector('iframe');
    stamp.addEventListener('click', function () {
      var open = stamp.getAttribute('aria-expanded') === 'true';
      if (!open) {
        if (frame && !frame.src) frame.src = frame.getAttribute('data-src');
        player.hidden = false;
        stamp.setAttribute('aria-expanded', 'true');
        stamp.querySelector('.stamp__text').innerHTML = 'HIDE<br>PLAYER';
        player.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else {
        player.hidden = true;
        stamp.setAttribute('aria-expanded', 'false');
        stamp.querySelector('.stamp__text').innerHTML = 'PLAY<br>MASTER';
      }
    });
  }

  // clicking a track row opens the player (Bandcamp embed handles track selection itself)
  document.querySelectorAll('.tracks li').forEach(function (li) {
    li.addEventListener('click', function () {
      if (stamp && stamp.getAttribute('aria-expanded') !== 'true') stamp.click();
      document.querySelectorAll('.tracks li').forEach(function (x) { x.classList.remove('is-playing'); });
      li.classList.add('is-playing');
    });
  });

  // nav: mark the section in view
  var links = [].slice.call(document.querySelectorAll('.spine__nav a'));
  if ('IntersectionObserver' in window && links.length) {
    var map = {};
    links.forEach(function (a) { var el = document.querySelector(a.getAttribute('href')); if (el) map[el.id] = a; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { links.forEach(function (a) { a.classList.remove('is-active'); }); map[en.target.id].classList.add('is-active'); }
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    Object.keys(map).forEach(function (id) { io.observe(document.getElementById(id)); });
  }

  // booking form: client validation + graceful POST; falls back to mailto if endpoint is not wired yet
  var form = document.querySelector('.booking');
  if (form) {
    var status = form.querySelector('.booking__status');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      status.classList.remove('is-error');
      if (!form.checkValidity()) {
        status.textContent = 'Name, email and a note about the project are needed.';
        status.classList.add('is-error');
        var bad = form.querySelector(':invalid');
        if (bad) bad.focus();
        return;
      }
      var data = new FormData(form);
      status.textContent = 'Sending…';
      fetch(form.action, { method: 'POST', body: data })
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r; })
        .then(function () {
          status.textContent = 'Got it. I will write back to ' + data.get('email') + '.';
          form.reset();
        })
        .catch(function () {
          // endpoint not live yet: hand off to email with the fields prefilled
          var body = 'Name: ' + data.get('name') + '\nEmail: ' + data.get('email') + '\nType: ' + data.get('type') + '\n\n' + data.get('message');
          status.textContent = 'Opening your mail app instead…';
          window.location.href = 'mailto:pat@patpadgett.com?subject=' + encodeURIComponent('Booking: ' + data.get('type')) + '&body=' + encodeURIComponent(body);
        });
    });
  }
})();
