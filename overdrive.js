/* music.patpadgett.com — overdrive.
   C  Jakarta at night: luminance-derived depth field on the cover; cursor/gyro parallax, heat
      shimmer, embers. WebGL, idle state only. Off under reduced motion or the motion toggle.
   A  Real transport: one <audio> plays 30-second previews. Reel spin, VU needles (analyser on
      the element), ▶/✓ marks, status line and the pinned mini-transport all derive from it.
   B  The sheet is the instrument: hover carriage, glyph strike on click, optional key clicks;
      a struck row previews that track (again to pause).
   Every layer degrades to the plain page. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cover = document.querySelector('.reel__cover');
  const img = cover && cover.querySelector('img');
  const stamp = document.getElementById('play-stamp');
  const audioEl = document.getElementById('preview');
  const sheet = document.querySelector('.sheet');
  const rows = [...document.querySelectorAll('.tracks li')];
  if (!cover || !img || !stamp || !sheet || !rows.length || !audioEl) return;

  /* ============================== C : depth cover ============================== */
  let C = null;
  function initDepth() {
    if (reduce) return;
    const cv = document.createElement('canvas'); cv.className = 'depth'; cv.setAttribute('aria-hidden', 'true');
    const gl = cv.getContext('webgl', { alpha: false, antialias: false, powerPreference: 'low-power' });
    if (!gl) return;
    const vs = `attribute vec2 p;varying vec2 v;uniform vec2 CR;void main(){v=(p*.5+.5-.5)*CR+.5;v.y=1.-v.y;gl_Position=vec4(p,0.,1.);}`;
    const fs = `precision highp float;varying vec2 v;uniform sampler2D img;uniform vec2 M;uniform float T;uniform float H;uniform vec2 E;
    float lum(vec3 c){return dot(c,vec3(.299,.587,.114));}
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    void main(){
      // depth: bright = near (fire, lit figures), dark = far. Blur the estimate with 4 taps so edges don't tear.
      vec2 px=vec2(1./512.);
      float d=0.; for(int i=-1;i<=1;i++)for(int j=-1;j<=1;j++) d+=lum(texture2D(img,v+vec2(float(i),float(j))*px*4.).rgb); d/=9.;
      d=smoothstep(.05,.75,d);
      vec2 par=(M-.5)*0.07*(d-.4);                 // near layers move with the cursor, far against it
      // heat shimmer: only where the image is hot (warm + bright), lower third strongest
      vec3 c0=texture2D(img,v).rgb; float heat=smoothstep(.2,.7,c0.r-c0.b)*smoothstep(.15,.5,lum(c0));
      vec2 shim=vec2(sin(v.y*70.+T*7.+v.x*9.)+.5*sin(v.y*130.-T*11.),cos(v.x*50.-T*5.))*.022*heat*H;
      vec3 c=texture2D(img,v+par+shim).rgb;
      // embers: soft points, only born from hot pixels, drifting up; more near the cursor
      vec2 cell=vec2(140.,140.); vec2 uvR=v+vec2(sin(v.y*9.+T*.8)*.006, T*.07);
      vec2 gi=floor(uvR*cell); vec2 gf=fract(uvR*cell)-.5; float r=hash(gi);
      float heatAtBirth=smoothstep(.2,.7,texture2D(img,vec2(v.x, v.y+fract(T*.07))).r-texture2D(img,vec2(v.x, v.y+fract(T*.07))).b);
      float near=smoothstep(.4,0.,length(v-vec2(M.x,E.y)))*E.x;
      float born=step(1.-(.006+.03*near), r)*max(heat*1.2, heatAtBirth*.6);
      float pt=smoothstep(.22,.0,length(gf+vec2(sin(r*40.+T*3.)*.15,0.)));
      c+=vec3(1.,.62,.2)*born*pt*(1.4+.8*sin(T*18.+r*50.));
      gl_FragColor=vec4(c,1.);
    }`;
    const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); return o; };
    const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return;
    gl.useProgram(pr);
    const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    const uCR = gl.getUniformLocation(pr, 'CR'), uM = gl.getUniformLocation(pr, 'M'), uT = gl.getUniformLocation(pr, 'T'), uH = gl.getUniformLocation(pr, 'H'), uE = gl.getUniformLocation(pr, 'E');
    const state = { mx: .5, my: .5, tx: .5, ty: .5, ex: 0, raf: 0, on: false, t0: performance.now() };
    function upload() { gl.bindTexture(gl.TEXTURE_2D, tex); try { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img); return true; } catch (e) { return false; } }
    function size() { const r = img.getBoundingClientRect(); const dpr = Math.min(devicePixelRatio || 1, 1.5); cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr); cv.style.height = r.height + 'px';
      // object-fit:cover crop of a square texture into the img box
      const ar = r.width / r.height; gl.uniform2f(uCR, ar >= 1 ? 1 : ar, ar >= 1 ? 1 / ar : 1); }
    function frame(now) {
      state.raf = 0; if (!state.on) return;
      state.mx += (state.tx - state.mx) * .08; state.my += (state.ty - state.my) * .08; state.ex *= .93;
      gl.viewport(0, 0, cv.width, cv.height);
      gl.uniform2f(uM, state.mx, state.my); gl.uniform1f(uT, (now - state.t0) / 1000); gl.uniform1f(uH, 1.); gl.uniform2f(uE, state.ex, state.my);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      state.raf = requestAnimationFrame(frame);
    }
    const start = () => { if (!state.on) { state.on = true; if (!state.raf) state.raf = requestAnimationFrame(frame); } };
    const stop = () => { state.on = false; if (state.raf) cancelAnimationFrame(state.raf); state.raf = 0; };
    cover.addEventListener('pointermove', e => { const r = cover.getBoundingClientRect(); state.tx = (e.clientX - r.left) / r.width; state.ty = (e.clientY - r.top) / r.height; state.ex = Math.min(1, state.ex + .35); }, { passive: true });
    cover.addEventListener('pointerleave', () => { state.tx = .5; state.ty = .5; }, { passive: true });
    if ('DeviceOrientationEvent' in window) addEventListener('deviceorientation', e => { if (e.gamma == null) return; state.tx = .5 + Math.max(-1, Math.min(1, e.gamma / 30)) * .5; state.ty = .5 + Math.max(-1, Math.min(1, (e.beta - 45) / 30)) * .5; }, { passive: true });
    new IntersectionObserver(([e]) => { if (e.isIntersecting && C.enabled) start(); else stop(); }).observe(cover);
    addEventListener('visibilitychange', () => { if (document.visibilityState !== 'visible') stop(); else if (C.enabled) start(); });
    cv.addEventListener('webglcontextlost', e => { e.preventDefault(); C.disable(); });
    const mount = () => { size(); if (!upload()) return; cover.appendChild(cv); if (document.documentElement.classList.contains('motion-off')) { C.enabled = false; return; } cover.classList.add('has-depth'); C.enabled = true; start(); };
    C = { enabled: false, cv, mount, enable() { if (!cover.contains(cv)) mount(); else { C.enabled = true; cover.classList.add('has-depth'); start(); } }, disable() { C.enabled = false; stop(); cover.classList.remove('has-depth'); } };
    let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { if (C.enabled) size(); }, 120); });
    (img.complete && img.naturalWidth ? Promise.resolve() : new Promise(r => img.addEventListener('load', r, { once: true }))).then(mount);
  }

  /* ============================== A : real transport ============================= */
  // One <audio> element plays 30-second previews (assets/audio/NN.mp3). Everything visual is
  // derived from it: reel spins while !paused, VU needles read a real analyser on the element,
  // the ▶ marker is the track that is actually loaded, ✓ marks tracks that have finished.
  const audio = document.getElementById('preview');
  const stampText = stamp.querySelector('.stamp__text');
  const transport = document.getElementById('transport');
  const tNow = transport && transport.querySelector('.transport__now');
  const tTime = transport && transport.querySelector('.transport__time');
  const titles = rows.map(li => li.querySelector('.tracks__t').textContent);
  const A = { idx: -1, raf: 0, ctx: null, an: null, data: null, vu: null, wired: false, done: new Set(), lastSec: -1 };
  const mini = document.getElementById('mini'), miniBtn = document.getElementById('mini-btn'), miniNow = document.getElementById('mini-now'), miniTime = document.getElementById('mini-time');
  const src = i => 'assets/audio/' + String(i + 1).padStart(2, '0') + '.mp3';
  const fmt = t => Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0');

  function buildVU() {
    const wrap = document.createElement('div'); wrap.className = 'vu'; wrap.setAttribute('aria-hidden', 'true');
    wrap.innerHTML = '<canvas class="vu__c" width="240" height="120"></canvas><canvas class="vu__c" width="240" height="120"></canvas><span class="vu__l tw">L</span><span class="vu__l tw">R</span>';
    sheet.querySelector('.sheet__player').insertAdjacentElement('beforebegin', wrap);
    return wrap;
  }
  function drawNeedle(c, lvl) {
    const x = c.getContext('2d'), W = c.width, H = c.height; x.clearRect(0, 0, W, H);
    x.save(); x.translate(W / 2, H - 10);
    x.strokeStyle = '#24407a'; x.lineWidth = 1.2; x.beginPath(); x.arc(0, 0, 88, Math.PI * 1.18, Math.PI * 1.82); x.stroke();
    x.strokeStyle = '#c8261e'; x.lineWidth = 3; x.beginPath(); x.arc(0, 0, 88, Math.PI * 1.7, Math.PI * 1.82); x.stroke();
    for (let i = 0; i <= 10; i++) { const a = Math.PI * (1.18 + .64 * i / 10); x.strokeStyle = i >= 8 ? '#c8261e' : '#24407a'; x.lineWidth = i % 5 ? 1 : 2; x.beginPath(); x.moveTo(Math.cos(a) * 80, Math.sin(a) * 80); x.lineTo(Math.cos(a) * 88, Math.sin(a) * 88); x.stroke(); }
    x.font = '10px "Special Elite", monospace'; x.fillStyle = '#4a463f'; x.textAlign = 'center'; x.fillText('VU', 0, -30);
    const a = Math.PI * (1.18 + .64 * Math.min(1, Math.max(0, lvl)));
    x.strokeStyle = '#171512'; x.lineWidth = 2; x.beginPath(); x.moveTo(0, 0); x.lineTo(Math.cos(a) * 84, Math.sin(a) * 84); x.stroke();
    x.fillStyle = '#171512'; x.beginPath(); x.arc(0, 0, 5, 0, Math.PI * 2); x.fill();
    x.restore();
  }
  function wireAnalyser() {
    if (A.wired) return; A.wired = true;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const node = ctx.createMediaElementSource(audio);
      const an = ctx.createAnalyser(); an.fftSize = 512; an.smoothingTimeConstant = .5;
      node.connect(an).connect(ctx.destination);
      A.ctx = ctx; A.an = an; A.data = new Uint8Array(an.fftSize);
    } catch (e) { /* no analyser: needles rest, audio still plays through the element */ }
  }
  let vuL = 0, vuR = 0;
  function frame() {
    A.raf = 0;
    if (audio.paused) { if (A.vu) { const cs = A.vu.querySelectorAll('canvas'); vuL *= .8; vuR *= .8; drawNeedle(cs[0], vuL); drawNeedle(cs[1], vuR); if (vuL > .01) A.raf = requestAnimationFrame(frame); } return; }
    let lvl = 0;
    if (A.an) { A.an.getByteTimeDomainData(A.data); let s = 0; for (let i = 0; i < A.data.length; i++) { const v = (A.data[i] - 128) / 128; s += v * v; } lvl = Math.min(1, Math.sqrt(s / A.data.length) * 3.2); }
    vuL += (lvl - vuL) * .25; vuR += ((lvl * .95) - vuR) * .22;
    if (!reduce && A.vu) { const cs = A.vu.querySelectorAll('canvas'); drawNeedle(cs[0], vuL); drawNeedle(cs[1], vuR); }
    const sec = Math.floor(audio.currentTime); if (sec !== A.lastSec) { A.lastSec = sec; const tt = fmt(audio.currentTime) + ' / 0:30'; if (tTime) tTime.textContent = tt; if (miniTime) miniTime.textContent = tt; }
    A.raf = requestAnimationFrame(frame);
  }
  function mark() {
    rows.forEach((li, k) => { li.classList.toggle('is-playing', k === A.idx); li.classList.toggle('is-paused', k === A.idx && audio.paused); li.classList.toggle('is-ticked', A.done.has(k) && k !== A.idx); li.setAttribute('aria-pressed', String(k === A.idx && !audio.paused)); });
  }
  function setStamp() {
    const playing = !audio.paused;
    stamp.setAttribute('aria-pressed', String(playing));
    stamp.setAttribute('aria-label', playing ? 'Pause preview' : (A.idx < 0 ? 'Play 30-second previews, from track 1' : 'Resume preview of ' + titles[A.idx]));
    stampText.innerHTML = playing ? 'PAUSE<br>MASTER' : 'PLAY<br>MASTER';
    cover.classList.toggle('is-rolling', playing && !reduce); document.body.classList.toggle('tape-rolling', playing);
    if (playing) { if (C) C.disable(); if (!A.vu && !reduce) A.vu = buildVU(); if (!A.raf) A.raf = requestAnimationFrame(frame); }
    else if (C && !reduce && !document.documentElement.classList.contains('motion-off')) C.enable();
    if (tNow) tNow.textContent = A.idx < 0 ? '30-second previews · press a track or the stamp' : (playing ? '▶ ' : '❚❚ ') + String(A.idx + 1).padStart(2, '0') + ' ' + titles[A.idx] + ' · preview';
    if (mini) { mini.classList.toggle('is-on', A.idx >= 0 && !A.dismissed); document.body.classList.toggle('mini-open', A.idx >= 0 && !A.dismissed); mini.classList.toggle('is-paused', !playing); if (miniNow && A.idx >= 0) miniNow.textContent = String(A.idx + 1).padStart(2, '0') + ' ' + titles[A.idx] + ' · preview'; if (miniBtn) { miniBtn.textContent = playing ? '❚❚' : '▶'; miniBtn.setAttribute('aria-label', playing ? 'Pause preview' : 'Resume preview'); } }
  }
  function load(i) {
    A.idx = i; audio.preload = 'auto'; audio.src = src(i); audio.load(); mark();
  }
  function play(i) {
    A.dismissed = false;
    if (i !== undefined && i !== A.idx) load(i);
    else if (A.idx < 0) load(0);
    wireAnalyser(); if (A.ctx && A.ctx.state === 'suspended') A.ctx.resume();
    const p = audio.play(); if (p && p.catch) p.catch(() => { setStamp(); if (tNow) tNow.textContent = 'Preview could not start — tap again, or use the Bandcamp player below.'; });
  }
  audio.addEventListener('play', () => { setStamp(); mark(); });
  audio.addEventListener('pause', () => { if (A.finished) { A.finished = false; return; } setStamp(); mark(); });
  audio.addEventListener('ended', () => { A.done.add(A.idx); if (A.idx + 1 < rows.length) play(A.idx + 1); else { A.finished = true; A.idx = -1; mark(); setStamp(); if (tNow) tNow.textContent = 'End of previews · full album on Bandcamp below'; if (tTime) tTime.textContent = ''; } });
  audio.addEventListener('timeupdate', () => { if (!audio.paused && audio.duration && audio.currentTime >= audio.duration - 0.05) { audio.pause(); audio.dispatchEvent(new Event('ended')); } });
  audio.addEventListener('error', () => { if (tNow) tNow.textContent = 'Preview ' + String(A.idx + 1).padStart(2, '0') + ' is unavailable — full album on Bandcamp below.'; });
  stamp.addEventListener('click', () => { if (audio.paused) play(); else audio.pause(); });
  if (miniBtn) miniBtn.addEventListener('click', () => { if (audio.paused) play(); else audio.pause(); });
  const miniX = document.getElementById('mini-x');
  if (miniX) miniX.addEventListener('click', () => { audio.pause(); A.dismissed = true; mini.classList.remove('is-on'); document.body.classList.remove('tape-rolling', 'mini-open'); stamp.focus(); });
  // handoff: opening the full Bandcamp player pauses the preview
  const bcT = document.getElementById('bc-toggle'); if (bcT) bcT.addEventListener('click', () => { if (!audio.paused) audio.pause(); }, true);
  const util = document.createElement('div'); util.className = 'util'; sheet.querySelector('.tracks').insertAdjacentElement('afterend', util);
  // motion toggle (persisted) — ambient motion off: tape, depth cover, reel spin
  const motionKey = 'lp-motion';
  const setMotion = on => { document.documentElement.classList.toggle('motion-off', !on); try { localStorage.setItem(motionKey, on ? 'on' : 'off'); } catch (e) {} if (C) { if (on && !reduce && audio.paused) C.enable(); else C.disable(); } const eff = on && !reduce; mtog.setAttribute('aria-pressed', String(eff)); mtog.textContent = 'MOTION: ' + (eff ? 'ON' : (reduce ? 'OFF (system)' : 'OFF')); mtog.setAttribute('aria-label', 'Ambient motion (tape, cover, reel): ' + (eff ? 'on' : 'off')); };
  const mtog = document.createElement('button'); mtog.type = 'button'; mtog.className = 'motion tw';
  util.appendChild(mtog);
  let motionOn = true; try { motionOn = localStorage.getItem(motionKey) !== 'off'; } catch (e) {}
  mtog.addEventListener('click', () => setMotion(document.documentElement.classList.contains('motion-off')));
  queueMicrotask(() => setMotion(motionOn));
  addEventListener('keydown', e => { if (e.key === ' ' && !e.target.closest('input,textarea,button,a,select,[role=button],iframe')) { e.preventDefault(); if (audio.paused) play(); else audio.pause(); } });
  const hub = document.createElement('div'); hub.className = 'reel__hub'; hub.setAttribute('aria-hidden', 'true');
  hub.innerHTML = '<span></span><span></span><span></span>'; cover.appendChild(hub);
  // mobile LISTEN stamp starts playing too (it's a link to #tracks; enhance in place)
  const goListen = document.querySelector('.go--listen'); if (goListen) goListen.addEventListener('click', () => { if (audio.paused) play(A.idx < 0 ? 0 : A.idx); });

  /* ============================== B : the sheet is the instrument ============== */
  const beep = { on: false, ctx: null };
  function click(ctx) { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'square'; o.frequency.value = 1800 + Math.random() * 300; g.gain.setValueAtTime(.05, ctx.currentTime); g.gain.exponentialRampToValueAtTime(.0005, ctx.currentTime + .045); o.connect(g).connect(ctx.destination); o.start(); o.stop(ctx.currentTime + .05); }
  const head = sheet.querySelector('.sheet__head');
  const tog = document.createElement('button'); tog.type = 'button'; tog.className = 'keys tw'; tog.setAttribute('aria-pressed', 'false'); tog.textContent = 'KEY CLICKS: OFF';
  tog.addEventListener('click', () => { beep.on = !beep.on; tog.setAttribute('aria-pressed', String(beep.on)); tog.textContent = 'KEY CLICKS: ' + (beep.on ? 'ON' : 'OFF'); if (beep.on && !beep.ctx) { try { beep.ctx = new (window.AudioContext || window.webkitAudioContext)(); click(beep.ctx); } catch (e) { beep.on = false; } } });
  util.insertBefore(tog, util.firstChild);
  const carriage = document.createElement('span'); carriage.className = 'carriage'; carriage.setAttribute('aria-hidden', 'true'); sheet.querySelector('.tracks').appendChild(carriage);
  rows.forEach((li, i) => {
    li.tabIndex = 0; li.setAttribute('role', 'button'); li.setAttribute('aria-pressed', 'false');
    li.setAttribute('aria-label', 'Preview track ' + (i + 1) + ', ' + titles[i] + ', 30 seconds');
    const t = li.querySelector('.tracks__t'); const text = t.textContent;
    t.innerHTML = text.split(' ').map(word => '<span class="w">' + [...word].map(ch => `<span class="g">${ch}</span>`).join('') + '</span>').join(' ');
    li.addEventListener('pointerenter', () => { if (reduce) return; const r = li.getBoundingClientRect(), pr = li.parentElement.getBoundingClientRect(); carriage.style.top = (r.top - pr.top) + 'px'; carriage.style.height = r.height + 'px'; carriage.classList.add('is-on'); });
    li.addEventListener('pointermove', e => { if (reduce) return; const pr = li.parentElement.getBoundingClientRect(); carriage.style.setProperty('--x', Math.max(30, e.clientX - pr.left) + 'px'); });
    li.addEventListener('pointerleave', () => carriage.classList.remove('is-on'));
    const strike = () => {
      const gs = t.querySelectorAll('.g'); gs.forEach(g => g.classList.remove('hit'));
      if (!reduce) gs.forEach((g, k) => setTimeout(() => { g.classList.add('hit'); if (beep.on && beep.ctx) click(beep.ctx); }, k * 38));
      if (A.idx === i && !audio.paused) audio.pause(); else play(i);
    };
    li.addEventListener('click', e => { if (e.target.closest('a')) return; strike(); });
    li.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); strike(); } });
  });

  initDepth();
})();
