/* ==========================================================================
   MAGIC BONES — la raccolta (carrello) → messaggio WhatsApp
   I dati dei pezzi vivono nei data-* del markup (card del catalogo o bottone
   del pezzo del mese): unica fonte di verità, nessun catalogo duplicato in JS.
   Lo stesso modulo serve la home e la pagina catalogo.
   ========================================================================== */
(function () {
  'use strict';

  var KEY = 'magicbones.raccolta.v1';

  // Un "pezzo" è qualunque elemento (o suo antenato) con i data-* completi.
  function fields(el) {
    var host = el.hasAttribute('data-id') ? el : el.closest('[data-id]');
    if (!host) return null;
    return {
      id:     host.getAttribute('data-id'),
      nome:   host.getAttribute('data-nome'),
      prezzo: host.getAttribute('data-prezzo'),
      da:     host.getAttribute('data-da') === '1',   // prezzo "a partire da"
      foto:   host.getAttribute('data-foto')
    };
  }
  function euro(it) { return (it.da ? 'da ' : '') + '€ ' + window.MB.euro(it.prezzo); }
  var items = [];           // [{id, nome, prezzo, da, foto}]
  var lastFocus = null;

  var fab      = document.getElementById('cartFab');
  var cart     = document.getElementById('cart');
  var panel    = document.getElementById('cartPanel');
  var body     = document.getElementById('cartBody');
  var countEl  = document.getElementById('cartCount');
  var totalEl  = document.getElementById('cartTotal');
  var sendEl   = document.getElementById('cartSend');
  var copyEl   = document.getElementById('cartCopy');
  var noteEl   = document.getElementById('cartNote');
  var closeEl  = document.getElementById('cartClose');
  var backdrop = document.getElementById('cartBackdrop');

  if (!fab || !cart) return;

  /* ------------------------------------------------------ persistenza -- */
  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return;
      var parsed = JSON.parse(raw);
      // La raccolta è condivisa fra le pagine: si tiene tutto ciò che è
      // ben formato, anche se il pezzo non è presente in QUESTA pagina.
      if (Array.isArray(parsed)) {
        items = parsed.filter(function (it) { return it && it.id && it.nome && it.prezzo; });
      }
    } catch (e) { items = []; }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (e) {}
  }

  /* ------------------------------------------------------------ render -- */
  function total() {
    return items.reduce(function (s, it) { return s + (Number(it.prezzo) || 0); }, 0);
  }

  function render() {
    countEl.textContent = String(items.length);
    fab.hidden = items.length === 0;
    totalEl.textContent = '€ ' + window.MB.euro(total());

    if (!items.length) {
      body.innerHTML = '<p class="cart__empty">La tua raccolta è vuota.<br>Aggiungi i pezzi che ti interessano: comporrò il messaggio per Claudia.</p>';
    } else {
      var ul = document.createElement('ul');
      ul.className = 'cart__items';
      items.forEach(function (it, i) {
        var li = document.createElement('li');
        li.className = 'cart__item';

        var img = document.createElement('img');
        img.src = it.foto; img.alt = ''; img.width = 64; img.height = 64; img.loading = 'lazy';

        var mid = document.createElement('div');
        var name = document.createElement('p');
        name.className = 'cart__item-name'; name.textContent = it.nome;
        var price = document.createElement('p');
        price.className = 'cart__item-price'; price.textContent = euro(it);
        mid.appendChild(name); mid.appendChild(price);

        var rm = document.createElement('button');
        rm.type = 'button'; rm.className = 'cart__remove'; rm.textContent = '×';
        rm.setAttribute('aria-label', 'Togli ' + it.nome + ' dalla raccolta');
        rm.addEventListener('click', function () { remove(i); });

        li.appendChild(img); li.appendChild(mid); li.appendChild(rm);
        ul.appendChild(li);
      });
      body.innerHTML = '';
      body.appendChild(ul);
    }

    // stato dei bottoni "Aggiungi", ovunque si trovino
    document.querySelectorAll('.js-add').forEach(function (btn) {
      var f = fields(btn);
      if (!f) return;
      var inCart = items.some(function (it) { return it.id === f.id; });
      if (!btn.dataset.labelIdle) btn.dataset.labelIdle = btn.textContent.trim();
      btn.textContent = inCart ? 'Nella raccolta ✓' : btn.dataset.labelIdle;
      btn.disabled = inCart;
      btn.classList.toggle('btn--ghost', inCart);
    });

    var msg = buildMessage();
    sendEl.href = window.MB.waLink(msg);
    sendEl.target = '_blank';
  }

  function buildMessage() {
    var lines = [window.MB.msgIntro];
    if (items.length) {
      lines.push(window.MB.msgOrderIntro);
      items.forEach(function (it) { lines.push('• ' + it.nome + ' — ' + euro(it)); });
      lines.push('Totale indicativo: € ' + window.MB.euro(total()));
    }
    var note = (noteEl && noteEl.value || '').trim();
    if (note) lines.push('', note);
    return lines.join('\n');
  }

  /* ------------------------------------------------------------ azioni -- */
  function add(el) {
    var f = fields(el);
    if (!f || items.some(function (it) { return it.id === f.id; })) return;
    items.push(f);
    save(); render();
    fab.classList.remove('is-bump');
    void fab.offsetWidth;                 // restart dell'animazione
    fab.classList.add('is-bump');
    window.MB.toast(f.nome + ' è nella tua raccolta');
  }

  function remove(i) {
    var nome = items[i] ? items[i].nome : '';
    items.splice(i, 1); save(); render();
    window.MB.toast(nome ? nome + ' rimosso' : 'Rimosso');
    if (!items.length) close();
  }

  /* ------------------------------------------------------- apri/chiudi -- */
  function open() {
    lastFocus = document.activeElement;
    cart.hidden = false;
    void cart.offsetWidth;
    cart.classList.add('is-open');
    fab.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    closeEl.focus();
    document.addEventListener('keydown', onKey);
  }
  function close() {
    cart.classList.remove('is-open');
    fab.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    document.removeEventListener('keydown', onKey);
    var done = function () { cart.hidden = true; };
    // attende la transizione, ma non resta appeso se non parte
    var t = setTimeout(done, 360);
    panel.addEventListener('transitionend', function h() {
      panel.removeEventListener('transitionend', h); clearTimeout(t); done();
    });
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function onKey(e) {
    if (e.key === 'Escape') { close(); return; }
    if (e.key !== 'Tab') return;
    // focus trap
    var f = panel.querySelectorAll('button, [href], textarea, input, select, [tabindex]:not([tabindex="-1"])');
    f = Array.prototype.filter.call(f, function (el) { return !el.disabled && el.offsetParent !== null; });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  /* ------------------------------------------------------------ eventi -- */
  document.querySelectorAll('.js-add').forEach(function (btn) {
    btn.addEventListener('click', function () { add(btn); });
  });
  fab.addEventListener('click', open);
  closeEl.addEventListener('click', close);
  backdrop.addEventListener('click', close);
  if (noteEl) noteEl.addEventListener('input', function () { sendEl.href = window.MB.waLink(buildMessage()); });

  copyEl.addEventListener('click', function () {
    var msg = buildMessage();
    var ok = function () { window.MB.toast('Messaggio copiato'); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(msg).then(ok, fallbackCopy);
    } else { fallbackCopy(); }
    function fallbackCopy() {
      var ta = document.createElement('textarea');
      ta.value = msg; ta.setAttribute('readonly', '');
      ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); ok(); } catch (e) { window.MB.toast('Copia non riuscita'); }
      document.body.removeChild(ta);
    }
  });

  load();
  render();
})();
