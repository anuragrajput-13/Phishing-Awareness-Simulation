/* PhishAware - Phishing Awareness Simulation
 * Educational use only. The email/username typed into the simulated login
 * form is sent to the backend and saved (data/emails.json). The password
 * field is never sent anywhere and is discarded immediately.
 */
(function () {
  'use strict';

  var PAGES = ['home', 'consent', 'email', 'login', 'landing', 'debrief', 'dashboard'];
  // Pages that require consent before they can be shown.
  var NEEDS_CONSENT = ['email', 'login', 'landing', 'debrief', 'dashboard'];

  var state = createState();

  function createState() {
    return {
      consented: false,
      delivered: 1,
      opened: 0,
      clicked: 0,
      reported: 0,
      events: []
    };
  }

  function $(id) {
    return document.getElementById(id);
  }

  function setHidden(id, hidden) {
    var el = $(id);
    if (el) el.classList.toggle('hidden', hidden);
  }

  function logEvent(text) {
    var now = new Date();
    state.events.push({
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      text: text
    });
  }

  /* ---------- Navigation ---------- */

  function showPage(pageId) {
    if (PAGES.indexOf(pageId) === -1 || !$(pageId)) {
      console.warn('showPage: unknown page "' + pageId + '"');
      return;
    }
    if (NEEDS_CONSENT.indexOf(pageId) !== -1 && !state.consented) {
      pageId = 'consent';
    }

    var pages = document.querySelectorAll('.page');
    for (var i = 0; i < pages.length; i++) {
      pages[i].classList.remove('active');
    }
    $(pageId).classList.add('active');

    if (pageId === 'email' && state.opened === 0) {
      state.opened = 1;
      logEvent('Email opened');
    }
    if (pageId === 'dashboard') {
      renderDashboard();
    }
    window.scrollTo(0, 0);
  }

  /* ---------- Simulation steps ---------- */

  function giveConsent() {
    var check = $('consentCheck');
    var error = $('consentError');
    if (!check || !check.checked) {
      if (error) error.textContent = 'Please tick the checkbox to confirm your consent before continuing.';
      return;
    }
    if (error) error.textContent = '';
    if (!state.consented) {
      state.consented = true;
      logEvent('Consent given');
    }
    showPage('email');
  }

  function clickSimulation() {
    if (state.clicked === 0) {
      state.clicked = 1;
      logEvent('Clicked "Review Account" link');
    }
    showPage('login');
  }

  function reportEmail() {
    if (state.reported === 0) {
      state.reported = 1;
      logEvent('Reported email as suspicious');
    }
    setHidden('emailFeedback', false);
    var reviewBtn = $('reviewBtn');
    if (reviewBtn) reviewBtn.disabled = true;
    var reportBtn = $('reportBtn');
    if (reportBtn) reportBtn.disabled = true;
  }

  function showRedFlags() {
    var box = $('redFlags');
    if (!box) return;
    var nowHidden = box.classList.toggle('hidden');
    if (!nowHidden) {
      box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  function resetSimulation() {
    state = createState();

    var check = $('consentCheck');
    if (check) check.checked = false;
    var error = $('consentError');
    if (error) error.textContent = '';

    var form = $('simLoginForm');
    if (form) form.reset();

    var result = $('loginResult');
    if (result) {
      result.hidden = true;
      result.textContent = '';
      result.className = 'result';
    }
    setHidden('loginContinue', true);
    setHidden('emailFeedback', true);
    setHidden('redFlags', true);
    setHidden('landingNote', true);

    var reviewBtn = $('reviewBtn');
    if (reviewBtn) reviewBtn.disabled = false;
    var reportBtn = $('reportBtn');
    if (reportBtn) reportBtn.disabled = false;
    var submitBtn = $('simSubmit');
    if (submitBtn) submitBtn.disabled = false;

    renderDashboard();
    showPage('home');
  }

  /* ---------- Login simulation (never stores or sends input) ---------- */

  function handleLoginSubmit(event) {
    event.preventDefault();

    var passwordField = $('simPassword');
    var usernameField = $('simUsername');
    var result = $('loginResult');

    // Only record WHETHER a password was typed; the password value itself is
    // never read into a variable, never sent, and is discarded immediately.
    var passwordEntered = !!(passwordField && passwordField.value.length > 0);
    if (passwordField) passwordField.value = '';

    // The email/username field IS sent to the backend and saved there.
    var emailValue = usernameField ? usernameField.value.trim() : '';
    if (usernameField) usernameField.value = '';

    if (emailValue) {
      saveEmailToServer(emailValue);
    }

    var message;
    if (passwordEntered) {
      message = 'Warning: you entered a password on a page reached from an unexpected email. ' +
        'In a real attack, that password would now be stolen. Your entry was discarded immediately ' +
        'and was not saved or sent anywhere. If this were real, you should change that password and report the message.';
      logEvent('Submitted the login form (input discarded)');
    } else {
      message = 'Good call: you did not enter a password. Even on a simulation, never type real ' +
        'credentials into a page you reached from an unexpected email.';
      logEvent('Submitted the login form without a password');
    }

    if (result) {
      result.textContent = message;
      result.className = 'result ' + (passwordEntered ? 'warn' : 'ok');
      result.hidden = false;
    }

    var note = $('landingNote');
    if (note) {
      note.textContent = passwordEntered
        ? 'You typed a password into the simulated sign-in page. It was discarded and never stored.'
        : 'You completed the sign-in page without entering a password.';
      note.classList.remove('hidden');
    }

    var submitBtn = $('simSubmit');
    if (submitBtn) submitBtn.disabled = true;
    setHidden('loginContinue', false);
  }

  // Sends the entered email/username to the backend so it gets saved in
  // data/emails.json. Fire-and-forget: if it fails, the simulation still
  // continues normally for the user.
  function saveEmailToServer(email) {
    fetch('/api/log-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email })
    }).catch(function (err) {
      console.warn('Could not save email to server:', err);
    });
  }

  /* ---------- Dashboard ---------- */

  function pct(count) {
    if (!state.delivered) return 0;
    return Math.round((count / state.delivered) * 100);
  }

  function setText(id, value) {
    var el = $(id);
    if (el) el.textContent = value;
  }

  function renderDashboard() {
    setText('delivered', state.delivered);
    setText('opened', state.opened);
    setText('clicked', state.clicked);
    setText('reported', state.reported);

    var bars = [
      ['openBar', 'openPct', state.opened],
      ['clickBar', 'clickPct', state.clicked],
      ['reportBar', 'reportPct', state.reported]
    ];
    bars.forEach(function (b) {
      var fill = $(b[0]);
      if (fill) fill.style.width = pct(b[2]) + '%';
      setText(b[1], pct(b[2]) + '%');
    });

    var timeline = $('timeline');
    if (!timeline) return;
    timeline.textContent = '';
    if (state.events.length === 0) {
      var empty = document.createElement('p');
      empty.className = 'timeline-empty';
      empty.textContent = 'No events yet. Start the simulation to record activity.';
      timeline.appendChild(empty);
      return;
    }
    state.events.forEach(function (ev) {
      var row = document.createElement('div');
      row.className = 'timeline-item';
      var time = document.createElement('span');
      time.className = 'timeline-time';
      time.textContent = ev.time;
      var text = document.createElement('span');
      text.textContent = ev.text;
      row.appendChild(time);
      row.appendChild(text);
      timeline.appendChild(row);
    });
  }

  /* ---------- Init ---------- */

  // Expose functions used by inline onclick attributes in index.html.
  window.showPage = showPage;
  window.giveConsent = giveConsent;
  window.clickSimulation = clickSimulation;
  window.reportEmail = reportEmail;
  window.showRedFlags = showRedFlags;
  window.resetSimulation = resetSimulation;

  document.addEventListener('DOMContentLoaded', function () {
    var form = $('simLoginForm');
    if (form) form.addEventListener('submit', handleLoginSubmit);
    renderDashboard();
    showPage('home');
  });
})();
