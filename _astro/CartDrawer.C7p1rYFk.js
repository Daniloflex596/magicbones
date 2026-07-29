import{o as e,t}from"./react.BRNZa73l.js";import{t as n}from"./jsx-runtime.C8BoMr6r.js";import{t as r}from"./proxy.CKYU37Ej.js";import{t as i}from"./AnimatePresence.-l7QYcWE.js";import{n as a,r as o}from"./cartStore.D3JdJmCQ.js";var s=e(t(),1),c=`393283632440`,l=`magicbones111@gmail.com`;function u(e){return new Intl.NumberFormat(`it-IT`,{style:`currency`,currency:`EUR`,maximumFractionDigits:0}).format(e)}function d(e,t,n,r){return[`Richiesta ordine Magic Bones — ${t||`senza nome`}`,``,...e.map(e=>{let t=`${e.priceIsFrom?`a partire da `:``}${u(e.price*e.quantity)}`,n=[e.isUnique?`pezzo unico`:``,e.isCustom?`personalizzabile — da confermare`:``].filter(Boolean);return`• ${e.title} × ${e.quantity} — ${t}${n.length?` (${n.join(`, `)})`:``}`}),``,`Totale indicativo: ${u(e.reduce((e,t)=>e+t.price*t.quantity,0))}${e.some(e=>e.priceIsFrom)?` (alcuni pezzi sono "a partire da": da preventivare)`:``}`,``,`Contatto: ${n||`da specificare`}`,r?`Note: ${r}`:``].filter(Boolean).join(`
`)}function f(e,t,n,r){let i=d(e,t,n,r);return`https://wa.me/${c}?text=${encodeURIComponent(i)}`}function p(e,t,n,r){let i=`Richiesta ordine Magic Bones — ${t||`nuovo cliente`}`,a=d(e,t,n,r);return`mailto:${l}?subject=${encodeURIComponent(i)}&body=${encodeURIComponent(a)}`}var m=n();function h({items:e,onSent:t}){let[n,i]=(0,s.useState)(``),[a,o]=(0,s.useState)(``),[c,l]=(0,s.useState)(``),[u,d]=(0,s.useState)(null),h=(0,s.useRef)(null);function g(r){let i=r===`whatsapp`?f(e,n,a,c):p(e,n,a,c);window.open(i,r===`whatsapp`?`_blank`:`_self`),d(r),t()}function _(){h.current&&!h.current.reportValidity()||g(`email`)}return u?(0,m.jsxs)(r.div,{initial:{opacity:0,y:8},animate:{opacity:1,y:0},className:`order-confirm`,children:[(0,m.jsx)(`p`,{children:u===`whatsapp`?`Si è aperta una chat WhatsApp con il tuo riepilogo già scritto: invia il messaggio per completare la richiesta.`:`Si è aperto il tuo client email con il riepilogo già scritto: invia il messaggio per completare la richiesta.`}),(0,m.jsx)(`p`,{className:`order-confirm__note`,children:`Claudia ti risponderà personalmente per confermare disponibilità e spedizione.`})]}):(0,m.jsxs)(`form`,{ref:h,className:`order-form`,onSubmit:e=>{e.preventDefault(),g(`whatsapp`)},children:[(0,m.jsxs)(`label`,{htmlFor:`ordine-nome`,children:[`Nome`,(0,m.jsx)(`input`,{id:`ordine-nome`,name:`name`,autoComplete:`name`,value:n,onChange:e=>i(e.target.value),placeholder:`Il tuo nome`,required:!0})]}),(0,m.jsxs)(`label`,{htmlFor:`ordine-contatto`,children:[`Contatto (email o telefono)`,(0,m.jsx)(`input`,{id:`ordine-contatto`,name:`contact`,autoComplete:`email`,inputMode:`email`,value:a,onChange:e=>o(e.target.value),placeholder:`Dove risponderti`,required:!0})]}),(0,m.jsxs)(`label`,{htmlFor:`ordine-note`,children:[`Note (misure, personalizzazioni, colori…)`,(0,m.jsx)(`textarea`,{id:`ordine-note`,name:`notes`,value:c,onChange:e=>l(e.target.value),rows:3,placeholder:`Facoltativo`})]}),(0,m.jsxs)(`div`,{className:`order-form__actions`,children:[(0,m.jsx)(`button`,{type:`submit`,className:`btn btn--primary`,children:`Invia su WhatsApp`}),(0,m.jsx)(`button`,{type:`button`,className:`btn btn--ghost`,onClick:_,children:`Invia via email`})]}),(0,m.jsx)(`style`,{children:`
        .order-form { display: flex; flex-direction: column; gap: 0.875rem; }
        .order-form label {
          display: flex; flex-direction: column; gap: 0.25rem;
          font-family: var(--font-body); font-size: 0.85rem; color: var(--bordeaux);
        }
        .order-form input, .order-form textarea {
          font-family: var(--font-body); font-size: 0.9rem;
          padding: 0.625rem 0.75rem; border-radius: var(--radius-md);
          border: 1px solid rgba(90, 30, 38, 0.25); background: #fffdf9; color: var(--bordeaux);
          resize: vertical;
        }
        .order-form__actions { display: flex; flex-direction: column; gap: 0.625rem; margin-top: 0.375rem; }
        .btn {
          font-family: var(--font-body); font-size: 0.9rem; font-weight: 500;
          padding: 0.75rem 1rem; border-radius: var(--r-sm); cursor: pointer; border: 1px solid transparent;
        }
        .btn--primary { background: var(--bordeaux); color: var(--paper-warm); }
        .btn--ghost { background: transparent; color: var(--bordeaux); border-color: rgba(90, 30, 38, 0.3); }
        .order-confirm { font-family: var(--font-body); color: var(--bordeaux); line-height: 1.6; }
        .order-confirm__note { font-size: 0.82rem; opacity: 0.75; margin-top: 0.5rem; }
      `})]})}function g(){let e=o(e=>e.isOpen),t=o(e=>e.items),n=o(e=>e.close),c=o(e=>e.setQuantity),l=o(e=>e.remove),d=o(e=>e.clear),[f,p]=(0,s.useState)(`cart`),g=(0,s.useRef)(null),_=(0,s.useRef)(null);return(0,s.useEffect)(()=>{e?(_.current=document.activeElement,p(`cart`),requestAnimationFrame(()=>g.current?.focus())):_.current?.focus?.()},[e]),(0,s.useEffect)(()=>{if(!e)return;function t(e){if(e.key===`Escape`){n();return}if(e.key===`Tab`&&g.current){let t=g.current.querySelectorAll(`button, a[href], input, textarea, select, [tabindex]:not([tabindex="-1"])`);if(t.length===0)return;let n=t[0],r=t[t.length-1];e.shiftKey&&document.activeElement===n?(e.preventDefault(),r.focus()):!e.shiftKey&&document.activeElement===r&&(e.preventDefault(),n.focus())}}return document.addEventListener(`keydown`,t),()=>document.removeEventListener(`keydown`,t)},[e,n]),(0,m.jsxs)(m.Fragment,{children:[(0,m.jsx)(i,{children:e&&(0,m.jsxs)(m.Fragment,{children:[(0,m.jsx)(r.div,{className:`cart-overlay`,initial:{opacity:0},animate:{opacity:1},exit:{opacity:0},onClick:n}),(0,m.jsxs)(r.div,{className:`cart-panel`,role:`dialog`,"aria-modal":`true`,"aria-label":`Il tuo carrello`,tabIndex:-1,ref:g,initial:{x:`100%`},animate:{x:0},exit:{x:`100%`},transition:{type:`spring`,damping:32,stiffness:300},children:[(0,m.jsxs)(`div`,{className:`cart-panel__header`,children:[(0,m.jsx)(`h2`,{children:f===`cart`?`Il tuo carrello`:`Richiedi il tuo bosco`}),(0,m.jsx)(`button`,{className:`cart-panel__close`,onClick:n,"aria-label":`Chiudi carrello`,children:`×`})]}),f===`cart`&&(0,m.jsxs)(m.Fragment,{children:[t.length===0?(0,m.jsx)(`p`,{className:`cart-panel__empty`,children:`Il carrello è vuoto. Torna nel bosco a scegliere un pezzo.`}):(0,m.jsx)(`ul`,{className:`cart-panel__items`,children:t.map(e=>(0,m.jsxs)(`li`,{children:[(0,m.jsxs)(`div`,{children:[(0,m.jsx)(`p`,{className:`item-title`,children:e.title}),(0,m.jsx)(`p`,{className:`item-price`,children:u(e.price)})]}),e.isUnique?(0,m.jsx)(`span`,{className:`item-unique`,children:`pezzo unico`}):(0,m.jsxs)(`div`,{className:`item-qty`,children:[(0,m.jsx)(`button`,{onClick:()=>c(e.id,e.quantity-1),"aria-label":`Riduci quantità di ${e.title}`,children:`−`}),(0,m.jsx)(`span`,{children:e.quantity}),(0,m.jsx)(`button`,{onClick:()=>c(e.id,e.quantity+1),"aria-label":`Aumenta quantità di ${e.title}`,children:`+`})]}),(0,m.jsx)(`button`,{className:`item-remove`,onClick:()=>l(e.id),"aria-label":`Rimuovi ${e.title}`,children:`Rimuovi`})]},e.id))}),t.length>0&&(0,m.jsxs)(`div`,{className:`cart-panel__footer`,children:[(0,m.jsxs)(`div`,{className:`cart-panel__total`,children:[(0,m.jsx)(`span`,{children:`Totale indicativo`}),(0,m.jsx)(`strong`,{children:u(a(t))})]}),(0,m.jsx)(`button`,{className:`btn btn--primary`,onClick:()=>p(`form`),children:`Richiedi il tuo bosco →`}),(0,m.jsx)(`button`,{className:`btn btn--text`,onClick:d,children:`Svuota carrello`})]})]}),f===`form`&&(0,m.jsxs)(m.Fragment,{children:[(0,m.jsx)(`button`,{className:`back-link`,onClick:()=>p(`cart`),children:`← Torna al carrello`}),(0,m.jsx)(h,{items:t,onSent:()=>d()})]})]})]})}),(0,m.jsx)(`style`,{children:`
        .cart-overlay {
          position: fixed;
          inset: 0;
          background: rgba(12, 15, 26, 0.45);
          z-index: 90;
        }
        .cart-panel {
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          width: min(24rem, 100vw);
          background: var(--paper-warm);
          color: var(--bordeaux);
          z-index: 91;
          padding: 1.5rem;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .cart-panel__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .cart-panel__header h2 {
          font-family: var(--font-display);
          font-size: 1.4rem;
        }
        .cart-panel__close {
          background: transparent;
          border: none;
          font-size: 1.5rem;
          line-height: 1;
          color: var(--bordeaux);
          cursor: pointer;
          padding: 0.25rem 0.625rem;
        }
        .cart-panel__empty {
          font-family: var(--font-body);
          color: rgba(90, 30, 38, 0.7);
        }
        .cart-panel__items {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .cart-panel__items li {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 0.5rem 1rem;
          align-items: center;
          padding-bottom: 1rem;
          border-bottom: 1px solid rgba(90, 30, 38, 0.12);
        }
        .item-title {
          font-family: var(--font-body);
          font-weight: 500;
        }
        .item-price {
          font-family: var(--font-body);
          font-size: 0.85rem;
          opacity: 0.75;
        }
        .item-qty {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-family: var(--font-body);
        }
        /* 44px pieni: sotto questa soglia il dito manca il bersaglio. */
        .item-qty button {
          width: 2.75rem;
          height: 2.75rem;
          flex-shrink: 0;
          border-radius: 999px;
          border: 1px solid rgba(90, 30, 38, 0.25);
          background: transparent;
          color: var(--bordeaux);
          cursor: pointer;
        }
        .item-unique {
          font-family: var(--font-body);
          font-size: 0.72rem;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: rgba(90, 30, 38, 0.6);
          white-space: nowrap;
        }
        .item-remove {
          grid-column: 1 / -1;
          justify-self: start;
          background: transparent;
          border: none;
          color: rgba(90, 30, 38, 0.6);
          font-family: var(--font-body);
          font-size: 0.78rem;
          text-decoration: underline;
          cursor: pointer;
          padding: 0;
        }
        .cart-panel__footer {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          padding-top: 1rem;
        }
        .cart-panel__total {
          display: flex;
          justify-content: space-between;
          font-family: var(--font-body);
        }
        .btn {
          font-family: var(--font-body);
          font-size: 0.9rem;
          font-weight: 500;
          padding: 0.75rem 1rem;
          border-radius: var(--r-sm);
          cursor: pointer;
          border: 1px solid transparent;
        }
        .btn--primary {
          background: var(--bordeaux);
          color: var(--paper-warm);
        }
        .btn--text {
          background: transparent;
          color: rgba(90, 30, 38, 0.6);
          text-decoration: underline;
        }
        .back-link {
          align-self: flex-start;
          background: transparent;
          border: none;
          color: var(--bordeaux);
          font-family: var(--font-body);
          font-size: 0.85rem;
          cursor: pointer;
          padding: 0;
          margin-bottom: 0.5rem;
        }
      `})]})}export{g as CartDrawer};