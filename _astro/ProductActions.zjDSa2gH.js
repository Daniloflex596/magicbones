import{o as e,t}from"./react.BRNZa73l.js";import{f as n,t as r}from"./proxy.DC6z9cys.js";import{r as i}from"./cartStore.FfWhiFCh.js";var a=e(t(),1),o=n();function s({product:e}){let t=i(e=>e.add),[n,s]=(0,a.useState)(1),[c,l]=(0,a.useState)(!1);function u(){t({id:e.id,title:e.data.title,price:e.data.price,priceIsFrom:e.data.priceIsFrom,isCustom:e.data.isCustom},n),l(!0),setTimeout(()=>l(!1),1800)}return(0,o.jsxs)(`div`,{className:`actions`,children:[(0,o.jsxs)(`div`,{className:`actions__qty`,children:[(0,o.jsx)(`button`,{onClick:()=>s(e=>Math.max(1,e-1)),"aria-label":`Riduci quantità`,children:`−`}),(0,o.jsx)(`span`,{children:n}),(0,o.jsx)(`button`,{onClick:()=>s(e=>e+1),"aria-label":`Aumenta quantità`,children:`+`})]}),(0,o.jsx)(r.button,{className:`actions__add`,onClick:u,whileTap:{scale:.96},children:c?`Aggiunto ✓`:`Aggiungi al carrello`}),e.data.isCustom&&(0,o.jsx)(`p`,{className:`actions__note`,children:`Personalizzabile: potrai indicare i dettagli nella richiesta.`}),(0,o.jsx)(`style`,{children:`
        .actions { display: flex; flex-wrap: wrap; align-items: center; gap: 0.9rem; margin-bottom: 1rem; }
        .actions__qty {
          display: flex; align-items: center; gap: 0.6rem;
          font-family: var(--font-body); color: var(--bordeaux);
        }
        .actions__qty button {
          width: 2.75rem; height: 2.75rem; border-radius: 999px;
          border: 1px solid rgba(90, 30, 38, 0.25); background: transparent; color: var(--bordeaux); cursor: pointer;
        }
        .actions__add {
          font-family: var(--font-body); font-weight: 500; font-size: 0.95rem;
          padding: 0.8rem 1.5rem; border-radius: 999px; border: none;
          background: var(--bordeaux); color: var(--paper-warm); cursor: pointer;
        }
        .actions__note {
          flex-basis: 100%;
          font-family: var(--font-body); font-size: 0.8rem; color: var(--turquoise);
        }
      `})]})}export{s as ProductActions};