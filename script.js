/* music.patpadgett.com — page behaviours, no dependencies. Preview transport lives in overdrive.js. */
(function () {
  'use strict';

  // stagger index for the track-sheet ink-in
  document.querySelectorAll('.tracks li').forEach(function (li, i) {
    li.style.setProperty('--i', i);
  });

  // Full-album disclosure: reveal the Bandcamp player, load iframe lazily
  var bcToggle = document.getElementById('bc-toggle');
  var player = document.getElementById('bc-player');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (bcToggle && player) {
    bcToggle.addEventListener('click', function () {
      var open = bcToggle.getAttribute('aria-expanded') === 'true';
      if (!open) {
        var f = player.querySelector('iframe'); if (f && !f.src) f.src = f.getAttribute('data-src');
        player.hidden = false; bcToggle.setAttribute('aria-expanded', 'true'); bcToggle.textContent = 'Full album ▴ (hide player)';
        if (player.getBoundingClientRect().bottom > innerHeight) player.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'end' });
      } else { player.hidden = true; bcToggle.setAttribute('aria-expanded', 'false'); bcToggle.textContent = 'Full album ▾ (embedded player)'; }
    });
  }

  // nav: mark the section in view
  var links = [].slice.call(document.querySelectorAll('.spine__nav a'));
  if ('IntersectionObserver' in window && links.length) {
    var map = {};
    links.forEach(function (a) { var h = a.getAttribute('href'); if (!h || h.charAt(0) !== '#') return; var el = document.querySelector(h); if (el) map[el.id] = a; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { links.forEach(function (a) { a.classList.remove('is-active'); }); map[en.target.id].classList.add('is-active'); }
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    Object.keys(map).forEach(function (id) { io.observe(document.getElementById(id)); });
  }

  // booking form: client validation + graceful POST; falls back to mailto if endpoint is not wired yet
  document.querySelectorAll('.stamp').forEach(function (st) {
    st.addEventListener('pointerdown', function () {
      st.style.setProperty('--rot', ((Math.random() * 10) - 9).toFixed(1) + 'deg');
      st.classList.remove('is-pressed'); void st.offsetWidth; st.classList.add('is-pressed');
    });
    st.addEventListener('animationend', function () { st.classList.remove('is-pressed'); });
  });
  var leader = document.querySelector('.leader');
  if (leader) leader.addEventListener('click', function () {
    var cover = document.querySelector('.reel__cover');
    if (cover) { cover.classList.add('is-rewinding'); setTimeout(function () { cover.classList.remove('is-rewinding'); }, 1400); }
    window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    var first = document.querySelector('.reel');
    if (first) { first.setAttribute('tabindex', '-1'); first.focus({ preventScroll: true }); }
  });
  var form = document.querySelector('.booking');
  if (form) {
    var status = form.querySelector('.booking__status');
    var received = form.querySelector('.received');
    // draft: survive an interruption within the session; cleared on success
    var DKEY = 'lp-booking-draft';
    try {
      var saved = JSON.parse(sessionStorage.getItem(DKEY) || 'null');
      if (saved) { ['name', 'email', 'message'].forEach(function (k) { var el = form.elements[k]; if (el && saved[k]) el.value = saved[k]; }); if (saved.type) { var rb = form.querySelector('input[name=type][value="' + saved.type + '"]'); if (rb) rb.checked = true; } }
    } catch (e) {}
    form.addEventListener('input', function () {
      try { var fd = new FormData(form); sessionStorage.setItem(DKEY, JSON.stringify({ name: fd.get('name'), email: fd.get('email'), message: fd.get('message'), type: fd.get('type') })); } catch (e) {}
    });
    function markReceived() {
      if (!received) return;
      var d = new Date(); received.querySelector('.received__d').textContent = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace('Sept','Sep').toUpperCase();
      try { sessionStorage.removeItem(DKEY); } catch (e) {}
      received.hidden = false; form.classList.add('is-sent');
      form.querySelectorAll('input,textarea').forEach(function (el) { el.disabled = true; });
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      status.classList.remove('is-error');
      if (form.dataset.busy === '1') return;
      var msgs = { 'f-name': 'Your name, so I know who to write back to.', 'f-email': 'A working email address — that is where the reply goes.', 'f-msg': 'A line or two about the project.' };
      var firstBad = null, n = 0;
      ['f-name', 'f-email', 'f-msg'].forEach(function (id) {
        var el = document.getElementById(id), err = document.getElementById(id + '-err'); if (!el || !err) return;
        if (el.value && !el.value.trim()) el.value = '';
        var bad = !el.checkValidity();
        el.setAttribute('aria-invalid', bad ? 'true' : 'false'); err.hidden = !bad; err.textContent = bad ? (el.validity.typeMismatch ? 'That does not look like an email address.' : msgs[id]) : '';
        if (bad) { n++; if (!firstBad) firstBad = el; }
      });
      if (firstBad) {
        status.textContent = n === 1 ? 'One field needs attention.' : n + ' fields need attention.';
        status.classList.add('is-error'); firstBad.focus(); return;
      }
      form.dataset.busy = '1'; var btn = form.querySelector('.stamp--submit'); if (btn) btn.disabled = true;
      var data = new FormData(form);
      status.textContent = 'Sending…';
      fetch(form.action, { method: 'POST', body: data })
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r; })
        .then(function () {
          status.textContent = '';
          var done = form.querySelector('.booking__done'); if (done) { done.hidden = false; done.textContent = 'Got it. I will write back to ' + data.get('email') + ' within two days.'; done.setAttribute('tabindex', '-1'); done.focus(); }
          markReceived();
        })
        .catch(function () {
          // endpoint not live yet: hand off to email with the fields prefilled
          var body = 'Name: ' + data.get('name') + '\nEmail: ' + data.get('email') + '\nType: ' + data.get('type') + '\n\n' + data.get('message');
          form.dataset.busy = ''; if (btn) btn.disabled = false;
          var mail = 'mailto:pat@patpadgett.com?subject=' + encodeURIComponent('Booking: ' + data.get('type')) + '&body=' + encodeURIComponent(body);
          status.classList.add('is-error');
          status.innerHTML = 'Could not send — nothing was lost. <button type="submit" class="linkish">Try again</button> or <a href="' + mail + '">send it by email</a>.';
        });
    });
  }
})();
