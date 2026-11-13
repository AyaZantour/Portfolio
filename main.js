(function () {
  var root = document.documentElement;

  // Theme toggle (remembered per browser; falls back to system preference)
  var themeBtn = document.getElementById('theme-btn');
  function currentTheme() {
    var set = root.getAttribute('data-theme');
    if (set) return set;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
    });
  }

  // Mobile menu
  var menuBtn = document.getElementById('menu-btn');
  var links = document.getElementById('nav-links');
  if (menuBtn && links) {
    menuBtn.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', String(open));
    });
    links.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        links.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Back to top: the #top target is the sticky header, so the browser would only
  // scroll to wherever it's currently stuck. Scroll the window to 0 instead.
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('a[href="#top"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      if (history.replaceState) history.replaceState(null, '', location.pathname + location.search);
    });
  });

  // Contact dialog
  var dialog = document.getElementById('contact-dialog');
  var form = document.getElementById('contact-form');
  var statusEl = document.getElementById('contact-status');
  if (dialog && form && typeof dialog.showModal === 'function') {
    var lastFocus = null;
    var setStatus = function (msg, kind) {
      statusEl.textContent = msg || '';
      statusEl.className = 'cform__status' + (kind ? ' ' + kind : '');
    };
    var openDialog = function () {
      lastFocus = document.activeElement;
      setStatus('');
      dialog.showModal();
      document.body.classList.add('dialog-open');
      var first = form.querySelector('input[name="name"]');
      if (first) first.focus();
    };
    dialog.addEventListener('close', function () {
      document.body.classList.remove('dialog-open');
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    });
    document.querySelectorAll('[data-contact]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        if (links) { links.classList.remove('open'); if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false'); }
        openDialog();
      });
    });
    dialog.querySelectorAll('[data-close]').forEach(function (b) {
      b.addEventListener('click', function () { dialog.close(); });
    });
    // Click on the backdrop closes the dialog
    dialog.addEventListener('click', function (e) {
      if (e.target !== dialog) return;
      var r = dialog.getBoundingClientRect();
      var inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      if (!inside) dialog.close();
    });

    var to = form.getAttribute('data-to');
    var copyBtn = document.getElementById('copy-email');
    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        var done = function () { setStatus('Email address copied: ' + to, 'ok'); };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(to).then(done, function () { setStatus(to); });
        } else { setStatus(to); }
      });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var fields = ['name', 'email', 'message'];
      var firstBad = null;
      fields.forEach(function (n) {
        var el = form.elements[n];
        var bad = !el.value.trim() || (n === 'email' && !el.checkValidity());
        el.setAttribute('aria-invalid', bad ? 'true' : 'false');
        if (bad && !firstBad) firstBad = el;
      });
      if (firstBad) {
        setStatus(firstBad.name === 'email' && firstBad.value.trim() ? 'That email address doesn\'t look right.' : 'Please fill in your name, email and message.', 'err');
        firstBad.focus();
        return;
      }
      if (form.elements._gotcha.value) return; // bot

      var data = {
        name: form.elements.name.value.trim(),
        email: form.elements.email.value.trim(),
        topic: (form.querySelector('input[name="topic"]:checked') || {}).value || '',
        message: form.elements.message.value.trim()
      };
      var endpoint = form.getAttribute('data-endpoint');
      var submitBtn = form.querySelector('button[type="submit"]');

      if (endpoint) {
        submitBtn.disabled = true;
        setStatus('Sending…');
        fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({
            name: data.name, email: data.email, topic: data.topic, message: data.message,
            _subject: 'Portfolio: ' + data.topic + ' — from ' + data.name,
            _replyto: data.email, _template: 'table', _captcha: 'false'
          })
        }).then(function (r) {
          if (!r.ok) throw new Error('status ' + r.status);
          return r.json().catch(function () { return {}; });
        }).then(function (res) {
          if (res && (res.success === false || res.success === 'false')) throw new Error(res.message || 'rejected');
          form.reset();
          setStatus('Thanks, ' + data.name.split(' ')[0] + '. Your message was sent and I\'ll reply by email.', 'ok');
        }).catch(function () {
          setStatus('Something went wrong sending that. You can email me directly at ' + to + '.', 'err');
        }).then(function () { submitBtn.disabled = false; });
      } else {
        var subject = data.topic + ' — from ' + data.name;
        var body = data.message + '\n\n— ' + data.name + ' (' + data.email + ')';
        window.location.href = 'mailto:' + to + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
        setStatus('Your email app should open with the message ready to send. If it didn\'t, use “Copy email address”.', 'ok');
      }
    });
  }

  // Nav border on scroll
  var nav = document.querySelector('.nav');
  var bar = document.getElementById('progress-bar');
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      if (nav) nav.classList.toggle('scrolled', window.scrollY > 8);
      if (bar) {
        var max = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, window.scrollY / max) : 0) + ')';
      }
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  var wait = function (ms) { return new Promise(function (r) { setTimeout(r, reduceMotion ? 0 : ms); }); };
  var esc = function (t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  // ---------- SmartOCR replay (illustrative data) ----------
  var ocr = document.getElementById('ocr-demo');
  var runOcr = null;
  if (ocr) {
    var SCEN = {
      clean: { ttc: '1 487,500', dup: false, sum: true },
      total: { ttc: '1 497,500', dup: false, sum: false },
      dup:   { ttc: '1 487,500', dup: true,  sum: true }
    };
    var scen = 'clean', ocrRun = 0;
    var inv = ocr.querySelector('.invoice');
    var ttcEl = document.getElementById('inv-ttc');
    var fieldsEl = document.getElementById('ocr-fields');
    var checksEl = document.getElementById('ocr-checks');
    var verdictEl = document.getElementById('ocr-verdict');
    var stageEl = document.getElementById('ocr-stage');
    var runBtn = document.getElementById('ocr-run');
    var setStage = function (t, cls) { stageEl.textContent = t; stageEl.className = 'extract__stage label' + (cls ? ' ' + cls : ''); };
    var box = function (f) { return ocr.querySelector('.x[data-f="' + f + '"]'); };

    var resetOcr = function () {
      inv.classList.remove('scanning');
      ocr.querySelectorAll('.x').forEach(function (x) { x.classList.remove('hit', 'bad'); });
      fieldsEl.innerHTML = ''; checksEl.innerHTML = '';
      verdictEl.className = 'verdict'; verdictEl.textContent = '';
    };

    runOcr = async function () {
      var id = ++ocrRun;
      var alive = function () { return id === ocrRun; };
      var sc = SCEN[scen];
      resetOcr();
      ttcEl.textContent = sc.ttc;
      runBtn.disabled = true;

      setStage('Reading the page (OCR)', 'busy');
      void inv.offsetWidth; // restart the scan animation
      inv.classList.add('scanning');
      await wait(1300); if (!alive()) return;

      setStage('Retrieving context, classifying', 'busy');
      await wait(550); if (!alive()) return;

      setStage('Extracting fields', 'busy');
      var fields = [
        ['doc_type', 'supplier_invoice'], ['supplier', 'Fournisseur Démo SARL'], ['invoice_no', 'F-2026-0147'],
        ['date', '2026-03-03'], ['total_ht', '1250.000 TND'], ['tva', '237.500 TND (19%)'],
        ['total_ttc', sc.ttc.replace(' ', '').replace(',', '.') + ' TND'], ['rib', '08006012345678901234']
      ];
      for (var i = 0; i < fields.length; i++) {
        if (!alive()) return;
        var b = box(fields[i][0]); if (b) b.classList.add('hit');
        fieldsEl.insertAdjacentHTML('beforeend', '<dt>' + esc(fields[i][0]) + '</dt><dd>' + esc(fields[i][1]) + '</dd>');
        await wait(220);
      }

      setStage('Validating', 'busy');
      var checks = [
        ['Required fields', true, 'all 8 present'],
        ['Duplicate check', !sc.dup, sc.dup ? 'F-2026-0147 from this supplier is already recorded' : 'no earlier record of this invoice', 'invoice_no'],
        ['HT + TVA = TTC', sc.sum, sc.sum ? '1 250,000 + 237,500 = 1 487,500' : '1 250,000 + 237,500 = 1 487,500, not 1 497,500', 'total_ttc'],
        ['RIB', true, '20 digits, well-formed'],
        ['Prices', true, 'quantity × unit price matches every line']
      ];
      var failed = 0;
      for (var j = 0; j < checks.length; j++) {
        if (!alive()) return;
        var c = checks[j];
        if (!c[1]) { failed++; var bb = box(c[3]); if (bb) bb.classList.add('bad'); }
        checksEl.insertAdjacentHTML('beforeend',
          '<li class="' + (c[1] ? 'ok' : 'bad') + '"><span class="ic" aria-hidden="true">' + (c[1] ? '✓' : '✕') + '</span>' +
          '<span><b>' + esc(c[0]) + '</b><small>' + esc(c[2]) + '</small></span></li>');
        await wait(320);
      }
      if (!alive()) return;
      if (failed) {
        verdictEl.className = 'verdict bad';
        verdictEl.textContent = 'Draft blocked: 1 issue to resolve before it can be confirmed.';
      } else {
        verdictEl.className = 'verdict ok';
        verdictEl.textContent = 'Draft created and ready for review in the ERP.';
      }
      setStage('Done', 'done');
      runBtn.disabled = false;
    };

    runBtn.addEventListener('click', function () { runOcr(); });
    ocr.querySelectorAll('[data-scen]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        scen = btn.getAttribute('data-scen');
        ocr.querySelectorAll('[data-scen]').forEach(function (o) { o.setAttribute('aria-checked', String(o === btn)); });
        runOcr();
      });
    });
    setStage('Ready. Press Run, or pick a scenario');
  }

  // ---------- Supervisor routing demo ----------
  var router = document.getElementById('router');
  var autoRoute = null;
  if (router) {
    var stageR = document.getElementById('router-stage');
    var dot = document.getElementById('router-dot');
    var reqEl = document.getElementById('router-req');
    var sup = document.getElementById('router-sup');
    var think = document.getElementById('router-think');
    var why = document.getElementById('router-why');
    var reqText = document.getElementById('router-text');
    var picks = router.querySelectorAll('.router__picks button');
    var routeRun = 0;
    var center = function (el) {
      var r = el.getBoundingClientRect(), s = stageR.getBoundingClientRect();
      return [r.left - s.left + r.width / 2, r.top - s.top + r.height / 2];
    };
    var move = function (from, to, ms) {
      var a = center(from), b = center(to);
      if (reduceMotion || !dot.animate) return Promise.resolve();
      return dot.animate([
        { transform: 'translate(' + a[0] + 'px,' + a[1] + 'px)', opacity: 1 },
        { transform: 'translate(' + b[0] + 'px,' + b[1] + 'px)', opacity: 1 }
      ], { duration: ms, easing: 'cubic-bezier(.5,0,.3,1)', fill: 'forwards' }).finished;
    };
    var route = async function (btn) {
      var id = ++routeRun;
      var alive = function () { return id === routeRun; };
      picks.forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
      stageR.classList.remove('routed');
      router.querySelectorAll('.router__targets .node').forEach(function (n) { n.classList.remove('hit'); });
      var target = router.querySelector('[data-agent="' + btn.getAttribute('data-to') + '"]');
      reqText.textContent = btn.textContent.replace(/\s+/g, ' ').trim();
      think.textContent = ''; why.textContent = '';

      await move(reqEl, sup, 600); if (!alive()) return;
      sup.classList.add('thinking'); think.textContent = 'deciding…';
      await wait(750); if (!alive()) return;
      sup.classList.remove('thinking');
      think.textContent = '→ ' + target.querySelector('b').textContent;
      await move(sup, target, 600); if (!alive()) return;
      stageR.classList.add('routed');
      target.classList.add('hit');
      why.textContent = btn.getAttribute('data-why');
      if (dot.animate && !reduceMotion) dot.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 400, fill: 'forwards' });
    };
    picks.forEach(function (b) { b.addEventListener('click', function () { route(b); }); });
    autoRoute = function () { if (picks[0]) route(picks[0]); };
  }

  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
    return;
  }

  // Reveal on scroll (CSS disables motion for reduced-motion users)
  var revealObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add('in'); revealObs.unobserve(en.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
  document.querySelectorAll('.reveal').forEach(function (el) { revealObs.observe(el); });

  // Count numbers up the first time they appear
  if (!reduceMotion) {
    var countObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        countObs.unobserve(en.target);
        var el = en.target, end = +el.getAttribute('data-count'), t0 = null, dur = 1100;
        var step = function (t) {
          if (t0 === null) t0 = t;
          var p = Math.min(1, (t - t0) / dur);
          el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(step);
        };
        el.textContent = '0';
        requestAnimationFrame(step);
      });
    }, { threshold: 0.6 });
    document.querySelectorAll('[data-count]').forEach(function (el) { countObs.observe(el); });
  }

  // Play each demo once, automatically, when it first scrolls into view
  var playOnce = function (el, fn) {
    if (!el || !fn) return;
    var o = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { o.disconnect(); setTimeout(fn, 400); }
    }, { threshold: 0.45 });
    o.observe(el);
  };
  playOnce(ocr, runOcr);
  playOnce(router, autoRoute);

  // Active section in nav
  var map = {};
  document.querySelectorAll('.nav__links a').forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
  var spyObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      var id = en.target.id;
      if (id === 'education' || id === 'achievements') id = 'experience';
      if (id === 'approach') id = 'toolkit';
      Object.keys(map).forEach(function (k) { map[k].classList.toggle('active', k === id); });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  document.querySelectorAll('main section[id]').forEach(function (s) { spyObs.observe(s); });
})();
