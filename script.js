(function () {
  'use strict';

  var WEBHOOK_URL = 'https://n8n.lamarketing.com.br/webhook/outlivenutrition-black-2026';

  // Para onde a pessoa vai depois do cadastro (Grupo VIP). Para trocar o destino, altere só esta linha.
  var WHATSAPP_GROUP_URL = 'https://cockpit.linqer.com.br/g/outlive-vip';

  // Datas do Esquenta Black (horário de Brasília, UTC-03:00)
  var START = new Date('2026-11-04T00:00:00-03:00').getTime();
  var END = new Date('2026-11-22T23:59:59-03:00').getTime();

  /* ---- Contador ---- */
  var elD = document.getElementById('cd-d');
  var elH = document.getElementById('cd-h');
  var elM = document.getElementById('cd-m');
  var elS = document.getElementById('cd-s');
  var elLabel = document.getElementById('countdown-label');
  var elBox = document.getElementById('countdown');

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function tick() {
    var now = Date.now();
    var target, label;
    if (now < START) { target = START; label = 'O Esquenta Black começa em'; }
    else if (now <= END) { target = END; label = 'O Esquenta Black e o cadastro VIP terminam em'; }
    else { elBox.hidden = true; return false; }

    var diff = Math.max(0, target - now);
    var s = Math.floor(diff / 1000);
    elD.textContent = pad(Math.floor(s / 86400));
    elH.textContent = pad(Math.floor((s % 86400) / 3600));
    elM.textContent = pad(Math.floor((s % 3600) / 60));
    elS.textContent = pad(s % 60);
    elLabel.textContent = label;
    return true;
  }
  if (elBox && tick()) {
    setInterval(tick, 1000);
  }

  /* ---- Formulário ---- */
  var form = document.getElementById('vip-form');
  if (!form) return;

  var nameEl = document.getElementById('name');
  var emailEl = document.getElementById('email');
  var phoneEl = document.getElementById('whatsapp');
  var consentEl = document.getElementById('consent');
  var btn = document.getElementById('submit-btn');
  var statusEl = document.getElementById('form-status');
  var successEl = document.getElementById('success');
  var successBtn = document.getElementById('success-btn');

  /* Máscara de WhatsApp: (11) 91234-5678 */
  phoneEl.addEventListener('input', function () {
    var d = phoneEl.value.replace(/\D/g, '').slice(0, 11);
    var out = d;
    if (d.length > 10) out = '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
    else if (d.length > 6) out = '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6);
    else if (d.length > 2) out = '(' + d.slice(0, 2) + ') ' + d.slice(2);
    else if (d.length > 0) out = '(' + d;
    phoneEl.value = out;
  });

  /* Botões que levam ao formulário */
  document.querySelectorAll('[data-scroll-to]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      e.preventDefault();
      var target = document.getElementById(el.getAttribute('data-scroll-to'));
      if (!target) return;
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(function () { target.focus({ preventScroll: true }); }, 600);
    });
  });

  function setStatus(msg, type) {
    statusEl.textContent = msg || '';
    statusEl.className = 'form__status' + (type ? ' is-' + type : '');
  }
  function mark(el, invalid) { el.classList.toggle('is-invalid', invalid); }

  function validate() {
    var okName = nameEl.value.trim().length >= 2;
    var okEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailEl.value.trim());
    var digits = phoneEl.value.replace(/\D/g, '');
    var okPhone = digits.length === 10 || digits.length === 11;
    var okConsent = consentEl.checked;

    mark(nameEl, !okName);
    mark(emailEl, !okEmail);
    mark(phoneEl, !okPhone);
    mark(consentEl, !okConsent);

    if (!okName) return { ok: false, msg: 'Digite seu nome.', el: nameEl };
    if (!okEmail) return { ok: false, msg: 'Digite um e-mail válido.', el: emailEl };
    if (!okPhone) return { ok: false, msg: 'Digite seu WhatsApp com DDD.', el: phoneEl };
    if (!okConsent) return { ok: false, msg: 'Marque o consentimento para entrar no grupo.', el: consentEl };
    return { ok: true };
  }

  [nameEl, emailEl, phoneEl].forEach(function (el) {
    el.addEventListener('input', function () { mark(el, false); });
  });
  consentEl.addEventListener('change', function () { mark(consentEl, false); });

  function showSuccess() {
    form.hidden = true;
    successEl.hidden = false;
    if (WHATSAPP_GROUP_URL) {
      successBtn.href = WHATSAPP_GROUP_URL;
      successBtn.hidden = false;
      setTimeout(function () { window.location.href = WHATSAPP_GROUP_URL; }, 1500);
    }
    successEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    setStatus('');

    var v = validate();
    if (!v.ok) {
      setStatus(v.msg, 'error');
      v.el.focus();
      return;
    }

    var params = new URLSearchParams(window.location.search);
    var payload = {
      name: nameEl.value.trim(),
      email: emailEl.value.trim(),
      whatsapp: phoneEl.value.trim(),
      consent: true,
      source: 'outlivenutrition-black-2026',
      submittedAt: new Date().toISOString()
    };
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(function (k) {
      if (params.get(k)) payload[k] = params.get(k);
    });

    btn.disabled = true;
    btn.querySelector('.btn-cta__label').textContent = 'ENVIANDO...';

    fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        form.reset();
        showSuccess();
      })
      .catch(function () {
        btn.disabled = false;
        btn.querySelector('.btn-cta__label').textContent = 'ENTRAR NO GRUPO VIP';
        setStatus('Não foi possível enviar agora. Tente novamente em instantes.', 'error');
      });
  });
})();
