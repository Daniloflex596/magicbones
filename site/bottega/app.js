/* ==========================================================================
   BOTTEGA — l'app di Claudia per il catalogo Magic Bones

   · Accesso con il PIN (la "tessera" resta 6 mesi sul telefono).
   · I miei pezzi: in vendita / venduti, con ricerca.
   · Nuovo pezzo / modifica: foto (dalla fotocamera o dalla galleria),
     copertina, nome, prezzo, categoria, disponibilità, descrizione, frase.
   · Venduto / di nuovo in vendita.

   Le foto le prepara il TELEFONO: tre misure (900 px, 600 px, mini 240×240),
   formato WebP dove il browser lo sa fare (altrimenti JPEG), e un'impronta
   SHA-256 che diventa il nome del file. Poi partono una alla volta verso
   /api/foto, e alla fine /api/pezzo salva tutto in un colpo solo
   (lib/api.js). Il sito si ripubblica da solo in circa un minuto: l'app
   controlla data/pezzi.js finché il pezzo non è davvero online.
   ========================================================================== */
(function () {
  'use strict';

  var app = document.getElementById('app');
  var avviso = document.getElementById('avviso');
  var BOZZA = 'bottega-bozza-v1';
  var MAX_FOTO = 10;

  var stato = { dati: null, filtro: 'vendita', cerca: '' };
  var modulo = null;      // la scheda aperta (nuova o in modifica)
  var inviando = false;

  /* ------------------------------------------------------------ utilità -- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  var tAvviso;
  function mostraAvviso(msg) {
    avviso.textContent = msg; avviso.hidden = false;
    clearTimeout(tAvviso); tAvviso = setTimeout(function () { avviso.hidden = true; }, 3500);
  }
  // 35 → "35", 35.5 → "35,50" (come sul sito)
  function numero(n) {
    var x = Number(n);
    return Math.round(x * 100) % 100 === 0 ? String(Math.round(x)) : x.toFixed(2).replace('.', ',');
  }
  function euro(p) {
    return (p.da ? 'da ' : '') + '€ ' + numero(p.prezzo) + (p.unita === 'a pezzo' ? ' a pezzo' : '');
  }
  function categoria(id) {
    var c = (stato.dati && stato.dati.categorie || []).find(function (x) { return x.id === id; });
    return c ? c.nome : '';
  }

  function api(metodo, via, corpo) {
    return fetch('/api/' + via, {
      method: metodo, credentials: 'same-origin',
      headers: corpo ? { 'Content-Type': 'application/json' } : {},
      body: corpo ? JSON.stringify(corpo) : undefined
    }).then(function (r) {
      return r.json().catch(function () { return { errore: 'Risposta non valida dal server' }; }).then(function (j) {
        if (r.status === 401 && via !== 'accedi') {
          // all'apertura (io) è il primo accesso o la tessera è scaduta: messaggio di benvenuto
          vistaAccesso(via === 'io' ? null : 'Per sicurezza ti chiedo di nuovo il PIN.');
          var e1 = new Error(j.errore || 'Accesso scaduto'); e1.accesso = true; throw e1;
        }
        if (!r.ok) { var e = new Error(j.errore || 'Errore ' + r.status); e.errori = j.errori; e.stato = r.status; throw e; }
        return j;
      });
    }, function () {
      throw new Error('Nessuna connessione: controlla internet e riprova');
    });
  }

  /* ---------------------------------------------------------- le foto -- */
  var FORMATO = null;
  function formato() {
    if (FORMATO) return Promise.resolve(FORMATO);
    var c = document.createElement('canvas'); c.width = c.height = 2;
    return new Promise(function (ok) {
      c.toBlob(function (b) { FORMATO = b && b.type === 'image/webp' ? 'webp' : 'jpg'; ok(FORMATO); }, 'image/webp', 0.8);
    });
  }
  function apriImmagine(file) {
    return new Promise(function (ok, ko) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () { ok({ img: img, url: url }); };
      img.onerror = function () { URL.revokeObjectURL(url); ko(new Error('Questa foto non si apre: provane un\'altra')); };
      img.src = url;   // il browser la raddrizza da solo (orientamento EXIF)
    });
  }
  // Su iPhone Safari tiene in memoria le tele finché non passa a pulire, e
  // oltre un certo totale smette di disegnare ("Non riesco a preparare la
  // foto" dopo qualche pezzo). Azzerarne la misura le libera subito.
  function libera(c) { if (c && c.getContext) { c.width = 0; c.height = 0; } }
  // rimpicciolisce a metà per volta: molto più nitido che in un colpo solo
  function scala(sorg, sx, sy, sw, sh, w, h) {
    var cur = sorg, cx = sx, cy = sy, cw = sw, ch = sh;
    while (cw / 2 >= w && ch / 2 >= h) {
      var t = document.createElement('canvas');
      t.width = Math.round(cw / 2); t.height = Math.round(ch / 2);
      var tx = t.getContext('2d'); tx.imageSmoothingQuality = 'high';
      tx.drawImage(cur, cx, cy, cw, ch, 0, 0, t.width, t.height);
      if (cur !== sorg) libera(cur);        // il passaggio di prima non serve più
      cur = t; cx = 0; cy = 0; cw = t.width; ch = t.height;
    }
    var c = document.createElement('canvas'); c.width = w; c.height = h;
    var x = c.getContext('2d'); x.imageSmoothingQuality = 'high';
    x.drawImage(cur, cx, cy, cw, ch, 0, 0, w, h);
    if (cur !== sorg) libera(cur);
    return c;
  }
  function misura(iw, ih, latoCorto) {
    var k = Math.min(1, latoCorto / Math.min(iw, ih));
    return { w: Math.round(iw * k), h: Math.round(ih * k) };
  }
  function aBlob(canvas, fmt) {
    return new Promise(function (ok, ko) {
      canvas.toBlob(function (b) { b ? ok(b) : ko(new Error('Non riesco a preparare la foto')); },
        fmt === 'webp' ? 'image/webp' : 'image/jpeg', fmt === 'webp' ? 0.82 : 0.86);
    });
  }
  function impronta(blob) {
    return blob.arrayBuffer().then(function (buf) { return crypto.subtle.digest('SHA-256', buf); }).then(function (h) {
      return Array.prototype.map.call(new Uint8Array(h), function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
    });
  }
  function aBase64(blob) {
    return new Promise(function (ok, ko) {
      var r = new FileReader();
      r.onload = function () { ok(String(r.result).split(',')[1]); };
      r.onerror = function () { ko(new Error('Non riesco a leggere la foto')); };
      r.readAsDataURL(blob);
    });
  }
  /* Dall'originale (12-48 milioni di punti) si ricava UNA volta la grande
     (lato corto 900); la porta (600) e la mini (240×240) vengono da quella,
     non di nuovo dall'originale: tre volte meno memoria e meno tempo. Ogni
     tela si libera appena la sua foto è pronta. */
  function preparaFoto(file) {
    return formato().then(function (fmt) {
      return apriImmagine(file).then(function (o) {
        var iw = o.img.naturalWidth, ih = o.img.naturalHeight;
        if (!iw || !ih) { URL.revokeObjectURL(o.url); throw new Error('Questa foto non si apre: provane un\'altra'); }
        var g = misura(iw, ih, 900);
        var cg = scala(o.img, 0, 0, iw, ih, g.w, g.h);
        URL.revokeObjectURL(o.url);
        o.img.removeAttribute('src');        // l'originale decodificato non serve più
        var p = misura(g.w, g.h, 600), lato = Math.min(g.w, g.h);
        var b = {};
        return aBlob(cg, fmt).then(function (x) {
          b.grande = x;
          var cp = scala(cg, 0, 0, g.w, g.h, p.w, p.h);
          return aBlob(cp, fmt).then(function (y) { libera(cp); b.porta = y; });
        }).then(function () {
          var cm = scala(cg, (g.w - lato) / 2, (g.h - lato) / 2, lato, lato, 240, 240);
          libera(cg);
          return aBlob(cm, fmt).then(function (z) { libera(cm); b.mini = z; });
        }).then(function () {
          return impronta(b.grande);
        }).then(function (h) {
          return { grande: b.grande, porta: b.porta, mini: b.mini, w: g.w, h: g.h, ext: fmt, hash: h };
        }, function (err) { libera(cg); throw err; });
      });
    });
  }

  /* ----------------------------------------------------------- accesso -- */
  function vistaAccesso(msg) {
    modulo = null;
    app.innerHTML =
      '<section class="accesso">' +
        '<img src="icona-192.png" alt="">' +
        '<h1>Bottega</h1>' +
        '<p>' + esc(msg || 'Il tuo laboratorio online: da qui aggiungi e cambi i pezzi del sito.') + '</p>' +
        '<form id="formAccesso">' +
          '<label for="pin" class="nascosto">PIN</label>' +
          '<input class="pin" id="pin" name="pin" type="password" inputmode="numeric" autocomplete="current-password" placeholder="PIN" required>' +
          '<button class="btn btn--primario btn--largo" type="submit">Entra</button>' +
        '</form>' +
      '</section>';
    var f = document.getElementById('formAccesso');
    document.getElementById('pin').focus();
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var b = f.querySelector('button'); b.disabled = true; b.textContent = 'Controllo…';
      api('POST', 'accedi', { pin: f.pin.value.trim() }).then(function () {
        carica().then(function () { vai(location.hash.slice(1) || 'elenco', true); });
      }, function (err) {
        b.disabled = false; b.textContent = 'Entra';
        f.pin.value = ''; f.pin.focus();
        mostraAvviso(err.message);
      });
    });
  }

  function carica() {
    return api('GET', 'pezzi').then(function (r) { stato.dati = r.dati; });
  }

  /* ------------------------------------------------------------ elenco -- */
  function htmlLista() {
    var tutti = stato.dati.pezzi.slice().reverse();   // i più recenti in alto
    var lista = tutti.filter(function (p) { return stato.filtro === 'venduti' ? p.venduto : !p.venduto; });
    var q = stato.cerca.trim().toLowerCase();
    if (q) lista = lista.filter(function (p) { return (p.nome + ' ' + categoria(p.cat)).toLowerCase().indexOf(q) >= 0; });
    var righe = lista.map(function (p) {
      return '<button class="riga" type="button" data-apri="' + esc(p.id) + '">' +
        '<img src="/' + esc(p.thumb) + '" alt="" loading="lazy" onerror="this.outerHTML=\'<span class=vuota></span>\'">' +
        '<span class="riga__testo"><span class="riga__nome">' + esc(p.nome) + '</span>' +
        '<span class="riga__sotto">' + esc(euro(p)) + ' · ' + esc(categoria(p.cat)) + '</span></span>' +
        (p.venduto ? '<span class="bollino bollino--venduto">Venduto</span>' : '') +
        '</button>';
    }).join('');
    return '<h2>' + (stato.filtro === 'venduti' ? 'Venduti' : 'In vendita sul sito') + '</h2>' +
      (righe || '<p class="vuoto">' + (q ? 'Nessun pezzo trovato.' : (stato.filtro === 'venduti' ? 'Ancora nessun pezzo venduto.' : 'Nessun pezzo in vendita.')) + '</p>');
  }

  function vistaElenco() {
    modulo = null;
    var d = stato.dati;
    var inVendita = d.pezzi.filter(function (p) { return !p.venduto; }).length;
    var venduti = d.pezzi.length - inVendita;

    app.innerHTML =
      '<header class="testa"><span class="testa__titolo"><small>Magic Bones</small>Bottega</span>' +
        '<a href="/catalogo.html" target="_blank" rel="noopener">Vedi il sito</a></header>' +
      '<section class="pagina">' +
        '<div class="schede" role="group" aria-label="Quali pezzi">' +
          '<button type="button" data-filtro="vendita" aria-pressed="' + (stato.filtro !== 'venduti') + '">In vendita (' + inVendita + ')</button>' +
          '<button type="button" data-filtro="venduti" aria-pressed="' + (stato.filtro === 'venduti') + '">Venduti (' + venduti + ')</button>' +
        '</div>' +
        '<input class="cerca" id="cerca" type="search" placeholder="Cerca un pezzo…" value="' + esc(stato.cerca) + '" aria-label="Cerca un pezzo">' +
        '<div id="lista">' + htmlLista() + '</div>' +
      '</section>' +
      '<nav class="piede"><button class="btn btn--primario" type="button" data-azione="nuovo">+ Nuovo pezzo</button></nav>';

    // scrivendo nella ricerca cambia SOLO la lista: il campo resta quello,
    // e la tastiera del telefono non si chiude a ogni lettera
    var cerca = document.getElementById('cerca');
    cerca.addEventListener('input', function () {
      stato.cerca = cerca.value;
      document.getElementById('lista').innerHTML = htmlLista();
    });
  }

  /* ------------------------------------------------------------ scheda -- */
  function nuovoModulo(p) {
    var bozza = null;
    if (!p) { try { bozza = JSON.parse(localStorage.getItem(BOZZA)); } catch (e) {} }
    var c = p || bozza || {};
    return {
      id: p ? p.id : null,
      venduto: !!(p && p.venduto),
      campi: {
        nome: c.nome || '', prezzo: c.prezzo == null || c.prezzo === '' ? '' : (p ? numero(c.prezzo) : String(c.prezzo)), da: !!c.da,
        cat: c.cat || '', nuovaCategoria: c.nuovaCategoria || '', usaNuova: !!c.usaNuova,
        unita: c.unita || 'pezzo unico', descrizione: c.descrizione || '', citazione: c.citazione || ''
      },
      foto: p ? p.foto.map(function (f) {
        return { tipo: 'esistente', src: f.src, porta: f.porta, w: f.w, h: f.h, anteprima: '/' + (f.porta || f.src) };
      }) : [],
      daBozza: !p && !!bozza,
      sporco: false,
      errori: []
    };
  }

  function htmlFoto(m) {
    var daFare = m.foto.filter(function (f) { return f.tipo === 'nuova' && f.stato === 'preparo'; }).length;
    var foto = m.foto.map(function (f, i) {
      var st = f.tipo === 'nuova' && f.stato !== 'pronta'
        ? '<span class="foto__stato' + (f.stato === 'errore' ? ' foto__stato--errore' : '') + '">' + esc(f.stato === 'errore' ? f.errore : 'Preparo la foto…') + '</span>' : '';
      return '<figure class="foto__una">' +
        (f.anteprima ? '<img src="' + esc(f.anteprima) + '" alt="Foto ' + (i + 1) + '">' : '') +
        (i === 0 ? '<span class="foto__cop">★ Copertina</span>' : '') + st +
        '<span class="foto__comandi">' +
          '<button type="button" data-foto="su" data-i="' + i + '" aria-label="Sposta prima"' + (i ? '' : ' disabled') + '>←</button>' +
          '<button type="button" data-foto="cop" data-i="' + i + '" aria-label="Metti in copertina"' + (i ? '' : ' disabled') + '>★</button>' +
          '<button type="button" data-foto="giu" data-i="' + i + '" aria-label="Sposta dopo"' + (i < m.foto.length - 1 ? '' : ' disabled') + '>→</button>' +
          '<button type="button" data-foto="via" data-i="' + i + '" aria-label="Togli questa foto">✕</button>' +
        '</span></figure>';
    }).join('');
    var aggiungi = m.foto.length < MAX_FOTO
      ? '<label class="foto__aggiungi"><span>+</span>Aggiungi foto<input type="file" id="nuoveFoto" accept="image/*" multiple></label>' : '';
    return foto + aggiungi + (daFare ? '<p class="foto__attesa" role="status">Preparo ' + (daFare === 1 ? 'la foto' : 'le foto (' + daFare + ')') + '… intanto puoi scrivere.</p>' : '');
  }

  // le foto cambiano (pronte, spostate, tolte): si ridisegna SOLO il loro
  // riquadro. Ridisegnare tutta la scheda toglieva il campo in cui Claudia
  // stava scrivendo: su iPhone si chiudeva la tastiera e si perdevano lettere.
  function ridisegnaFoto() {
    var box = app.querySelector('#scheda .foto');
    if (!box) return vistaScheda();
    box.innerHTML = htmlFoto(modulo);
    if (!modulo.errori.some(function (e) { return /foto/i.test(e); })) box.closest('.campo').classList.remove('campo--errore');
    ricontrolla(false);
  }

  function vistaScheda() {
    var m = modulo;
    var cats = stato.dati.categorie;

    var chips = cats.map(function (c) {
      return '<label class="scelta"><input type="radio" name="cat" value="' + esc(c.id) + '"' + (!m.campi.usaNuova && m.campi.cat === c.id ? ' checked' : '') + '><span>' + esc(c.nome) + '</span></label>';
    }).join('') + '<label class="scelta"><input type="radio" name="cat" value="__nuova"' + (m.campi.usaNuova ? ' checked' : '') + '><span>+ Nuova categoria</span></label>';

    var err = htmlErrori(m.errori);
    var haErr = function (parola) { return m.errori.some(function (e) { return e.toLowerCase().indexOf(parola) >= 0; }); };

    app.innerHTML =
      '<header class="testa"><button type="button" data-azione="indietro">‹ Pezzi</button>' +
        '<span class="testa__titolo"><small>' + (m.id ? 'Modifica' : 'Nuovo pezzo') + '</small>' + esc(m.campi.nome || (m.id ? '' : 'Senza nome')) + '</span>' +
        (m.id ? '<a href="/pezzo.html?id=' + encodeURIComponent(m.id) + '" target="_blank" rel="noopener">Sul sito</a>' : '') +
      '</header>' +
      '<form class="pagina" id="scheda" autocomplete="off" novalidate>' +
        (m.daBozza ? '<p class="errori" style="background:var(--giallo-chiaro);color:var(--giallo)">Ho ripreso la scheda che avevi lasciato a metà. Le foto vanno riaggiunte.</p>' : '') +
        (m.venduto ? '<div class="stato-pezzo"><span class="bollino bollino--venduto">Venduto — non è sul sito</span></div>' : '') +
        err +
        '<fieldset class="campo' + (haErr('foto') ? ' campo--errore' : '') + '"><legend>Foto * <i>(la prima è la copertina)</i></legend>' +
          '<div class="foto">' + htmlFoto(m) + '</div>' +
          '<p class="foto__nota">Scatta o scegli dalla galleria. Con ★ scegli la copertina, con ← → l\'ordine. Massimo ' + MAX_FOTO + ' foto.</p>' +
        '</fieldset>' +
        '<label class="campo' + (haErr('nome') ? ' campo--errore' : '') + '"><span>Nome del pezzo *</span>' +
          '<input type="text" name="nome" value="' + esc(m.campi.nome) + '" maxlength="80" autocapitalize="sentences" placeholder="es. Cinghiale luxury"></label>' +
        '<div class="campo' + (haErr('prezzo') ? ' campo--errore' : '') + '"><label for="prezzo" style="display:block;margin-bottom:6px;font-weight:600">Prezzo *</label>' +
          '<div class="prezzo"><b>€</b><input type="text" id="prezzo" name="prezzo" inputmode="decimal" value="' + esc(m.campi.prezzo) + '" placeholder="es. 45"></div>' +
          '<label class="spunta"><input type="checkbox" name="da"' + (m.campi.da ? ' checked' : '') + '> È un prezzo di partenza: sul sito si legge «da € …»</label></div>' +
        '<fieldset class="campo' + (haErr('categoria') ? ' campo--errore' : '') + '"><legend>Categoria *</legend><div class="scelte">' + chips + '</div>' +
          '<input type="text" name="nuovaCategoria" value="' + esc(m.campi.nuovaCategoria) + '" maxlength="40" placeholder="Nome della nuova categoria"' + (m.campi.usaNuova ? '' : ' class="nascosto"') + '>' +
        '</fieldset>' +
        '<fieldset class="campo"><legend>Quanti ne hai?</legend><div class="scelte">' +
          '<label class="scelta"><input type="radio" name="unita" value="pezzo unico"' + (m.campi.unita !== 'a pezzo' ? ' checked' : '') + '><span>Pezzo unico</span></label>' +
          '<label class="scelta"><input type="radio" name="unita" value="a pezzo"' + (m.campi.unita === 'a pezzo' ? ' checked' : '') + '><span>Più di uno (prezzo a pezzo)</span></label>' +
        '</div></fieldset>' +
        '<label class="campo"><span>Descrizione</span>' +
          '<textarea name="descrizione" rows="4" maxlength="2000" autocapitalize="sentences" placeholder="Com\'è fatto, materiali, misure…">' + esc(m.campi.descrizione) + '</textarea></label>' +
        '<label class="campo"><span>Una tua frase <i>(se vuoi: sul sito compare tra virgolette)</i></span>' +
          '<textarea name="citazione" rows="2" maxlength="300" autocapitalize="sentences" placeholder="es. Romantico gotico.">' + esc(m.campi.citazione) + '</textarea></label>' +
        (m.id ? '<div class="zona-vendita">' +
          (m.venduto
            ? '<button class="btn btn--largo" type="button" data-azione="rimetti">Rimettilo in vendita</button>'
            : '<button class="btn btn--largo" type="button" data-azione="venduto">Segna come venduto</button>') +
          '</div>' : '') +
      '</form>' +
      '<nav class="piede"><button class="btn btn--primario" type="button" data-azione="pubblica">' + (m.id ? 'Salva le modifiche' : 'Pubblica sul sito') + '</button></nav>';
  }

  function htmlErrori(e) {
    return e.length ? '<div class="errori" role="alert">Da sistemare:<ul>' + e.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>' : '';
  }
  // dopo un "Pubblica" con cose mancanti, il riquadro si aggiorna mentre le sistemi
  function ricontrolla(perRidisegno) {
    if (!modulo || !modulo.errori.length) return;
    modulo.errori = controlla();
    if (perRidisegno) return;
    var box = app.querySelector('.errori[role=alert]');
    if (box) { if (modulo.errori.length) box.outerHTML = htmlErrori(modulo.errori); else box.remove(); }
  }

  function salvaBozza() {
    if (!modulo || modulo.id) return;
    try { localStorage.setItem(BOZZA, JSON.stringify(modulo.campi)); } catch (e) {}
  }
  function leggiCampo(el) {
    if (!modulo || !el.name) return;
    var c = modulo.campi;
    if (el.name === 'cat') {
      c.usaNuova = el.value === '__nuova';
      if (!c.usaNuova) c.cat = el.value;
      var n = app.querySelector('input[name=nuovaCategoria]');
      n.classList.toggle('nascosto', !c.usaNuova);
      if (c.usaNuova) n.focus();
    } else if (el.name === 'da') c.da = el.checked;
    else if (el.name in c) c[el.name] = el.value;
    if (el.name === 'nome') { var t = app.querySelector('.testa__titolo'); if (t) t.lastChild.textContent = el.value || 'Senza nome'; }
    modulo.sporco = true;
    var campo = el.closest('.campo'); if (campo) campo.classList.remove('campo--errore');
    ricontrolla(false);
    salvaBozza();
  }

  function aggiungiFoto(files) {
    var m = modulo;
    var lista = Array.prototype.slice.call(files || [], 0, MAX_FOTO - m.foto.length);
    if (files && files.length > lista.length) mostraAvviso('Massimo ' + MAX_FOTO + ' foto per pezzo');
    var nuove = lista.map(function (file) { return { tipo: 'nuova', stato: 'preparo', file: file }; });
    m.foto = m.foto.concat(nuove);
    m.sporco = true;
    ridisegnaFoto();
    // una alla volta: su iPhone le foto da 12-48 MP aperte insieme finiscono la memoria
    nuove.reduce(function (catena, f) {
      return catena.then(function () {
        return preparaFoto(f.file).then(function (pronta) {
          f.pronta = pronta; f.stato = 'pronta'; f.file = null;
          f.anteprima = URL.createObjectURL(pronta.porta);
        }, function (err) {
          f.stato = 'errore'; f.errore = err.message; f.file = null;
        }).then(function () { if (modulo === m) ridisegnaFoto(); });
      });
    }, Promise.resolve());
  }

  function fotoComando(azione, i) {
    var f = modulo.foto;
    if (azione === 'via') {
      var x = f.splice(i, 1)[0];
      if (x && x.tipo === 'nuova' && x.anteprima) URL.revokeObjectURL(x.anteprima);
    } else if (azione === 'cop' && i > 0) f.unshift(f.splice(i, 1)[0]);
    else if (azione === 'su' && i > 0) f.splice(i - 1, 0, f.splice(i, 1)[0]);
    else if (azione === 'giu' && i < f.length - 1) f.splice(i + 1, 0, f.splice(i, 1)[0]);
    modulo.sporco = true;
    ridisegnaFoto();
  }

  function controlla() {
    var c = modulo.campi, e = [];
    if (!modulo.foto.length) e.push('Aggiungi almeno una foto');
    if (modulo.foto.some(function (f) { return f.tipo === 'nuova' && f.stato === 'preparo'; })) e.push('Aspetta che le foto siano pronte');
    if (modulo.foto.some(function (f) { return f.tipo === 'nuova' && f.stato === 'errore'; })) e.push('Togli le foto che non si sono aperte (in rosso)');
    if (!c.nome.trim()) e.push('Scrivi il nome del pezzo');
    var prezzo = Number(String(c.prezzo).replace(',', '.'));
    if (!(prezzo > 0)) e.push('Scrivi il prezzo (solo il numero)');
    if (c.usaNuova ? !c.nuovaCategoria.trim() : !c.cat) e.push('Scegli la categoria');
    return e;
  }

  /* ------------------------------------------------------------- invio -- */
  function pannello(testo, frazione) {
    var p = document.getElementById('invio');
    if (!p) {
      p = document.createElement('div'); p.id = 'invio'; p.className = 'invio';
      p.innerHTML = '<div class="invio__box" role="status"><p id="invioTesto"></p><div class="invio__barra"><i id="invioBarra"></i></div><p style="color:var(--tenue);font-size:.9rem">Non chiudere l\'app finché non ho finito.</p></div>';
      document.body.appendChild(p);
    }
    document.getElementById('invioTesto').textContent = testo;
    document.getElementById('invioBarra').style.width = Math.round(Math.max(0.04, frazione) * 100) + '%';
  }
  function chiudiPannello() { var p = document.getElementById('invio'); if (p) p.remove(); }

  function caricaFoto(f) {
    if (f.caricata) return Promise.resolve(f.caricata);   // già salita in un tentativo precedente
    var p = f.pronta;
    return Promise.all([aBase64(p.grande), aBase64(p.porta), aBase64(p.mini)]).then(function (b) {
      return api('POST', 'foto', { hash: p.hash, ext: p.ext, w: p.w, h: p.h, grande: b[0], porta: b[1], mini: b[2] });
    }).then(function (r) { f.caricata = r; return r; });
  }

  function pubblica() {
    if (inviando) return;
    modulo.errori = controlla();
    if (modulo.errori.length) { vistaScheda(); window.scrollTo(0, 0); return; }
    inviando = true;
    var m = modulo, c = m.campi;
    var nuove = m.foto.filter(function (f) { return f.tipo === 'nuova'; });
    var passi = nuove.length + 1, fatti = 0;
    pannello(nuove.length ? 'Carico la foto 1 di ' + nuove.length + '…' : 'Salvo…', 0);

    m.foto.reduce(function (catena, f) {
      return catena.then(function (lista) {
        if (f.tipo === 'esistente') { lista.push({ src: f.src, porta: f.porta, w: f.w, h: f.h }); return lista; }
        pannello('Carico la foto ' + (fatti + 1) + ' di ' + nuove.length + '…', fatti / passi);
        return caricaFoto(f).then(function (r) { fatti++; lista.push(r); return lista; });
      });
    }, Promise.resolve([])).then(function (lista) {
      pannello(m.id ? 'Salvo le modifiche…' : 'Metto il pezzo nel catalogo…', fatti / passi);
      var campi = {
        nome: c.nome.trim(), prezzo: c.prezzo, da: c.da, unita: c.unita,
        descrizione: c.descrizione, citazione: c.citazione
      };
      if (c.usaNuova) campi.nuovaCategoria = c.nuovaCategoria.trim(); else campi.cat = c.cat;
      return api('POST', 'pezzo', { id: m.id, campi: campi, foto: lista });
    }).then(function (esito) {
      inviando = false;
      chiudiPannello();
      if (!m.id) try { localStorage.removeItem(BOZZA); } catch (e) {}
      // i dati appena salvati arrivano nella risposta: rileggerli subito da GitHub
      // potrebbe dare ancora la versione di prima (succede per ~1 s)
      if (esito.dati) stato.dati = esito.dati;
      vistaFatto(esito);
    }, function (err) {
      inviando = false;
      chiudiPannello();
      if (err.accesso) return;
      m.errori = err.errori && err.errori.length ? err.errori : [err.message];
      vistaScheda(); window.scrollTo(0, 0);
    });
  }

  function cambiaVendita(venduto) {
    var m = modulo;
    if (venduto && !window.confirm('Segno «' + m.campi.nome + '» come venduto? Sparirà dal catalogo (potrai rimetterlo).')) return;
    pannello(venduto ? 'Segno come venduto…' : 'Lo rimetto in vendita…', 0.5);
    api('POST', 'venduto', { id: m.id, venduto: venduto }).then(function (esito) {
      chiudiPannello();
      if (esito.dati) stato.dati = esito.dati;
      esito.id = m.id; esito.nome = m.campi.nome; esito.venduto = venduto;
      vistaFatto(esito);
    }, function (err) { chiudiPannello(); if (!err.accesso) mostraAvviso(err.message); });
  }

  /* ------------------------------------------------- fatto + controllo online -- */
  var tOnline;
  function vistaFatto(esito) {
    modulo = null;
    // l'indirizzo segue la schermata: così riaprire lo stesso pezzo subito dopo funziona
    history.replaceState(null, '', '#fatto');
    var titolo = esito.venduto === true ? 'Segnato come venduto' : esito.venduto === false ? 'Di nuovo in vendita' : esito.nuovo ? 'Pubblicato!' : 'Modifiche salvate';
    app.innerHTML =
      '<header class="testa"><span class="testa__titolo"><small>Magic Bones</small>Bottega</span></header>' +
      '<section class="pagina fatto">' +
        '<div class="fatto__segno" aria-hidden="true">✓</div>' +
        '<h1>' + esc(titolo) + '</h1>' +
        '<p>' + esc(esito.nome || '') + '</p>' +
        '<p class="fatto__online" id="online">Il sito si sta aggiornando: ci vogliono pochi secondi…</p>' +
        '<a class="btn btn--largo" id="vediSito" href="/pezzo.html?id=' + encodeURIComponent(esito.id) + '" target="_blank" rel="noopener">Guardalo sul sito</a>' +
        '<p></p>' +
        '<button class="btn btn--primario btn--largo" type="button" data-azione="nuovo">+ Aggiungi un altro pezzo</button>' +
        '<p></p>' +
        '<button class="btn btn--largo" type="button" data-azione="elenco">Torna ai pezzi</button>' +
      '</section>';
    controllaOnline(esito.aggiornato, Date.now());
  }
  // il sito è aggiornato quando data/pezzi.js porta la data di questa modifica
  function controllaOnline(aggiornato, inizio) {
    clearTimeout(tOnline);
    var el = document.getElementById('online');
    if (!el || !aggiornato) return;
    fetch('/data/pezzi.js?t=' + Date.now(), { cache: 'no-store' }).then(function (r) { return r.text(); }).then(function (t) {
      var m = /"aggiornato":\s*"([^"]+)"/.exec(t);
      if (m && m[1] >= aggiornato) {
        el.textContent = '✓ È online: tutti lo vedono già sul sito.';
        el.classList.add('fatto__online--si');
        return;
      }
      throw new Error('non ancora');
    }).catch(function () {
      if (Date.now() - inizio > 6 * 60 * 1000) {
        el.textContent = 'Ci sta mettendo più del solito: è tutto salvato, comparirà sul sito tra poco.';
        return;
      }
      tOnline = setTimeout(function () { controllaOnline(aggiornato, inizio); }, 4000);
    });
  }

  /* ------------------------------------------------------- navigazione -- */
  // #elenco · #nuovo · #p=<id>: il tasto "indietro" del telefono funziona
  function mostra() {
    if (!stato.dati) return;
    var h = location.hash.slice(1);
    if (h === 'nuovo') {
      if (!modulo || modulo.id) modulo = nuovoModulo(null);
      return vistaScheda();
    }
    if (h.indexOf('p=') === 0) {
      var p = stato.dati.pezzi.find(function (x) { return x.id === decodeURIComponent(h.slice(2)); });
      if (p) { if (!modulo || modulo.id !== p.id) modulo = nuovoModulo(p); return vistaScheda(); }
    }
    vistaElenco();
  }
  function vai(h, sostituisci) {
    if (location.hash.slice(1) === h) return mostra();
    if (sostituisci) { history.replaceState(null, '', '#' + h); mostra(); } else location.hash = h;
  }
  window.addEventListener('hashchange', function () {
    var qui = modulo ? (modulo.id ? 'p=' + encodeURIComponent(modulo.id) : 'nuovo') : null;
    if (modulo && modulo.sporco && location.hash.slice(1) !== qui) {
      var conFoto = modulo.foto.some(function (f) { return f.tipo === 'nuova'; });
      var domanda = modulo.id ? 'Esci senza salvare le modifiche?'
        : conFoto ? 'Esci? Il testo resta salvato, ma le foto aggiunte andranno riaggiunte.' : null;
      if (domanda && !window.confirm(domanda)) { history.pushState(null, '', '#' + qui); return; }
      modulo = null;
    }
    mostra();
  });
  window.addEventListener('beforeunload', function (e) {
    if (inviando || (modulo && modulo.sporco && modulo.foto.some(function (f) { return f.tipo === 'nuova'; }))) { e.preventDefault(); e.returnValue = ''; }
  });

  app.addEventListener('click', function (e) {
    var b = e.target.closest('[data-azione],[data-apri],[data-filtro],[data-foto]');
    if (!b) return;
    if (b.hasAttribute('data-apri')) return vai('p=' + encodeURIComponent(b.getAttribute('data-apri')));
    if (b.hasAttribute('data-filtro')) { stato.filtro = b.getAttribute('data-filtro'); return vistaElenco(); }
    if (b.hasAttribute('data-foto')) return fotoComando(b.getAttribute('data-foto'), +b.getAttribute('data-i'));
    var a = b.getAttribute('data-azione');
    if (a === 'nuovo') { modulo = null; vai('nuovo'); }
    else if (a === 'elenco') vai('elenco');
    else if (a === 'indietro') vai('elenco');
    else if (a === 'pubblica') pubblica();
    else if (a === 'venduto') cambiaVendita(true);
    else if (a === 'rimetti') cambiaVendita(false);
  });
  app.addEventListener('input', function (e) { if (e.target.closest('#scheda')) leggiCampo(e.target); });
  app.addEventListener('change', function (e) {
    // le foto scelte: l'elenco dei file si legge subito, prima di ridisegnare
    if (e.target.id === 'nuoveFoto') { var files = e.target.files; aggiungiFoto(files); e.target.value = ''; return; }
    if (e.target.closest('#scheda') && e.target.type !== 'file') leggiCampo(e.target);
  });

  /* -------------------------------------------------------------- avvio -- */
  app.innerHTML = '<p class="vuoto">Apro la bottega…</p>';
  api('GET', 'io').then(function () { return carica(); }).then(function () {
    vai(location.hash.slice(1) || 'elenco', true);
  }, function (err) {
    if (!err.accesso) vistaAccesso(err.message);
  });
})();
