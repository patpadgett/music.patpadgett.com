/* music.patpadgett.com — overdrive.
   C  Jakarta at night: the cover gets a luminance-derived depth field; cursor/gyro parallax,
      heat shimmer over the fires, ember sparks under the cursor. WebGL, idle state only.
   A  The reel rolls: PLAY MASTER spins the cover as a reel with hub + flange, two VU needles
      breathe from a synthetic tape-hiss source (Web Audio, silent — analyser only), the
      playing row gets a grease-pencil tick that walks the sheet on each track's real duration.
   B  The sheet is the instrument: hover slides a carriage; click strikes the title glyph by
      glyph; optional beep (opt-in toggle, off by default); a struck row opens the player.
   Every layer degrades to the existing page. Reduced motion: A/C off, B keeps the tick only. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cover = document.querySelector('.reel__cover');
  const img = cover && cover.querySelector('img');
  const stamp = document.getElementById('play-stamp');
  const sheet = document.querySelector('.sheet');
  const rows = [...document.querySelectorAll('.tracks li')];
  if (!cover || !img || !stamp || !sheet || !rows.length) return;

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
    const mount = () => { size(); if (!upload()) return; cover.appendChild(cv); cover.classList.add('has-depth'); C.enabled = true; start(); };
    C = { enabled: false, cv, mount, enable() { if (!cover.contains(cv)) mount(); else { C.enabled = true; cover.classList.add('has-depth'); start(); } }, disable() { C.enabled = false; stop(); cover.classList.remove('has-depth'); } };
    let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { if (C.enabled) size(); }, 120); });
    (img.complete && img.naturalWidth ? Promise.resolve() : new Promise(r => img.addEventListener('load', r, { once: true }))).then(mount);
  }

  /* ============================== A : the reel rolls =========================== */
  const A = { on: false, raf: 0, ctx: null, an: null, data: null, vu: null, idx: 0, tick: 0, trackTimer: 0 };
  const durations = rows.map(li => { const m = (li.querySelector('.tracks__d') || {}).textContent || '0:00'; const [mm, ss] = m.split(':').map(Number); return (mm * 60 + ss) || 180; });
  function buildVU() {
    const wrap = document.createElement('div'); wrap.className = 'vu'; wrap.setAttribute('aria-hidden', 'true');
    wrap.innerHTML = '<canvas class="vu__c" width="240" height="120"></canvas><canvas class="vu__c" width="240" height="120"></canvas><span class="vu__l tw">L</span><span class="vu__l tw">R</span>';
    sheet.querySelector('.sheet__player').insertAdjacentElement('beforebegin', wrap);
    return wrap;
  }
  function drawNeedle(c, lvl, t) {
    const x = c.getContext('2d'), W = c.width, H = c.height; x.clearRect(0, 0, W, H);
    x.save(); x.translate(W / 2, H - 10);
    // scale arc, ticks, red zone
    x.strokeStyle = '#24407a'; x.lineWidth = 1.2; x.beginPath(); x.arc(0, 0, 88, Math.PI * 1.18, Math.PI * 1.82); x.stroke();
    x.strokeStyle = '#c8261e'; x.lineWidth = 3; x.beginPath(); x.arc(0, 0, 88, Math.PI * 1.7, Math.PI * 1.82); x.stroke();
    for (let i = 0; i <= 10; i++) { const a = Math.PI * (1.18 + .64 * i / 10); x.strokeStyle = i >= 8 ? '#c8261e' : '#24407a'; x.lineWidth = i % 5 ? 1 : 2; x.beginPath(); x.moveTo(Math.cos(a) * 80, Math.sin(a) * 80); x.lineTo(Math.cos(a) * 88, Math.sin(a) * 88); x.stroke(); }
    x.font = '10px "Special Elite", monospace'; x.fillStyle = '#4a463f'; x.textAlign = 'center'; x.fillText('VU', 0, -30);
    // needle with a little overshoot ballistics handled by caller
    const a = Math.PI * (1.18 + .64 * Math.min(1, Math.max(0, lvl)));
    x.strokeStyle = '#171512'; x.lineWidth = 2; x.beginPath(); x.moveTo(0, 0); x.lineTo(Math.cos(a) * 84, Math.sin(a) * 84); x.stroke();
    x.fillStyle = '#171512'; x.beginPath(); x.arc(0, 0, 5, 0, Math.PI * 2); x.fill();
    x.restore();
  }
  function startAudio() {
    if (A.ctx) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      // tape hiss + a slow "programme" envelope so the needles breathe like a real master, mixed to a muted gain: analyser only, nothing audible.
      const noise = ctx.createBufferSource(); const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * .6; noise.buffer = buf; noise.loop = true;
      const lfo = ctx.createOscillator(); lfo.frequency.value = 0.9; const lfoG = ctx.createGain(); lfoG.gain.value = .35;
      const lfo2 = ctx.createOscillator(); lfo2.frequency.value = 2.3; const lfo2G = ctx.createGain(); lfo2G.gain.value = .2;
      const env = ctx.createGain(); env.gain.value = .5; lfo.connect(lfoG).connect(env.gain); lfo2.connect(lfo2G).connect(env.gain);
      const an = ctx.createAnalyser(); an.fftSize = 256; an.smoothingTimeConstant = .6;
      const mute = ctx.createGain(); mute.gain.value = 0;
      noise.connect(env).connect(an).connect(mute).connect(ctx.destination);
      noise.start(); lfo.start(); lfo2.start();
      A.ctx = ctx; A.an = an; A.data = new Uint8Array(an.frequencyBinCount);
    } catch (e) { A.ctx = null; }
  }
  let vuL = 0, vuR = 0;
  function reelFrame(now) {
    A.raf = 0; if (!A.on) return;
    let lvl = .35 + .25 * Math.sin(now / 700) * Math.sin(now / 1900);
    if (A.an) { A.an.getByteTimeDomainData(A.data); let s = 0; for (let i = 0; i < A.data.length; i++) { const v = (A.data[i] - 128) / 128; s += v * v; } lvl = Math.min(1, Math.sqrt(s / A.data.length) * 2.6); }
    vuL += (lvl - vuL) * .18; vuR += ((lvl * .92 + .03 * Math.sin(now / 300)) - vuR) * .16;
    const cs = A.vu.querySelectorAll('canvas'); drawNeedle(cs[0], vuL, now); drawNeedle(cs[1], vuR, now);
    A.raf = requestAnimationFrame(reelFrame);
  }
  function setPlaying(i) {
    rows.forEach((li, k) => { li.classList.toggle('is-playing', k === i); li.classList.toggle('is-ticked', k < i); });
    A.idx = i;
    clearTimeout(A.trackTimer);
    if (i < rows.length) A.trackTimer = setTimeout(() => setPlaying(i + 1), durations[i] * 1000);
    else { A.trackTimer = setTimeout(stopReel, 400); }
  }
  function startReel(fromIdx = 0) {
    if (reduce) { setPlaying(fromIdx); return; }
    if (!A.vu) A.vu = buildVU();
    if (C) C.disable();
    cover.classList.add('is-rolling'); document.body.classList.add('tape-rolling');
    startAudio(); A.on = true; if (!A.raf) A.raf = requestAnimationFrame(reelFrame);
    setPlaying(fromIdx);
  }
  function stopReel() {
    A.on = false; if (A.raf) cancelAnimationFrame(A.raf); A.raf = 0; clearTimeout(A.trackTimer);
    cover.classList.remove('is-rolling'); document.body.classList.remove('tape-rolling');
    rows.forEach(li => li.classList.remove('is-playing', 'is-ticked'));
    if (A.ctx) { A.ctx.suspend(); }
    if (C && !reduce) C.enable();
  }
  // hub + flange DOM for the reel (cover becomes the reel when rolling)
  const hub = document.createElement('div'); hub.className = 'reel__hub'; hub.setAttribute('aria-hidden', 'true');
  hub.innerHTML = '<span></span><span></span><span></span>'; cover.appendChild(hub);
  stamp.addEventListener('click', () => { setTimeout(() => { const open = stamp.getAttribute('aria-expanded') === 'true'; if (open) { if (A.ctx) A.ctx.resume(); startReel(A.idx < rows.length ? A.idx : 0); } else stopReel(); }, 0); });

  /* ============================== B : the sheet is the instrument ============== */
  const beep = { on: false, ctx: null };
  function click(ctx) { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'square'; o.frequency.value = 1800 + Math.random() * 300; g.gain.setValueAtTime(.05, ctx.currentTime); g.gain.exponentialRampToValueAtTime(.0005, ctx.currentTime + .045); o.connect(g).connect(ctx.destination); o.start(); o.stop(ctx.currentTime + .05); }
  // opt-in toggle, muted default, lives in the sheet head
  const head = sheet.querySelector('.sheet__head');
  const tog = document.createElement('button'); tog.type = 'button'; tog.className = 'keys tw'; tog.setAttribute('aria-pressed', 'false'); tog.textContent = 'KEY CLICKS: OFF';
  tog.addEventListener('click', () => { beep.on = !beep.on; tog.setAttribute('aria-pressed', String(beep.on)); tog.textContent = 'KEY CLICKS: ' + (beep.on ? 'ON' : 'OFF'); if (beep.on && !beep.ctx) { try { beep.ctx = new (window.AudioContext || window.webkitAudioContext)(); click(beep.ctx); } catch (e) { beep.on = false; } } });
  head.appendChild(tog);
  const carriage = document.createElement('span'); carriage.className = 'carriage'; carriage.setAttribute('aria-hidden', 'true'); sheet.querySelector('.tracks').appendChild(carriage);
  rows.forEach((li, i) => {
    li.tabIndex = 0; li.setAttribute('role', 'button'); li.setAttribute('aria-label', 'Play track ' + (i + 1) + ': ' + li.querySelector('.tracks__t').textContent);
    const t = li.querySelector('.tracks__t'); const text = t.textContent;
    t.innerHTML = [...text].map(ch => `<span class="g">${ch === ' ' ? '&nbsp;' : ch}</span>`).join('');
    li.addEventListener('pointerenter', e => { if (reduce) return; const r = li.getBoundingClientRect(), pr = li.parentElement.getBoundingClientRect(); carriage.style.top = (r.top - pr.top) + 'px'; carriage.style.height = r.height + 'px'; carriage.classList.add('is-on'); });
    li.addEventListener('pointermove', e => { if (reduce) return; const pr = li.parentElement.getBoundingClientRect(); carriage.style.setProperty('--x', Math.max(30, e.clientX - pr.left) + 'px'); });
    li.addEventListener('pointerleave', () => carriage.classList.remove('is-on'));
    const strike = () => {
      const gs = t.querySelectorAll('.g'); gs.forEach(g => g.classList.remove('hit'));
      if (!reduce) gs.forEach((g, k) => setTimeout(() => { g.classList.add('hit'); if (beep.on && beep.ctx) click(beep.ctx); }, k * 38));
      // open the player at this row: reuse the existing stamp behaviour, then mark the row
      const open = stamp.getAttribute('aria-expanded') === 'true';
      if (!open) stamp.click();
      setTimeout(() => { if (A.on || reduce) setPlaying(i); else startReel(i); }, open ? 0 : 60);
    };
    li.addEventListener('click', e => { if (e.target.closest('a')) return; strike(); });
    li.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); strike(); } });
  });

  initDepth();
})();
