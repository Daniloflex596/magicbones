import{f as e,t}from"./proxy.DC6z9cys.js";import{t as n}from"./AnimatePresence.DA4JTVXO.js";import{r,t as i}from"./cartStore.FfWhiFCh.js";var a=e();function o(){let e=r(e=>e.items),o=r(e=>e.open),s=i(e);return(0,a.jsxs)(t.button,{className:`cart-button`,onClick:o,"aria-label":`Apri il carrello (${s} articoli)`,whileTap:{scale:.9},children:[(0,a.jsxs)(`svg`,{viewBox:`0 0 24 24`,width:`20`,height:`20`,fill:`none`,stroke:`currentColor`,strokeWidth:`1.6`,children:[(0,a.jsx)(`path`,{d:`M4 6h2l1.4 10.2A2 2 0 0 0 9.4 18h7.2a2 2 0 0 0 2-1.8L20 8H7`,strokeLinecap:`round`,strokeLinejoin:`round`}),(0,a.jsx)(`circle`,{cx:`10`,cy:`21`,r:`1.2`}),(0,a.jsx)(`circle`,{cx:`17`,cy:`21`,r:`1.2`})]}),(0,a.jsx)(n,{children:s>0&&(0,a.jsx)(t.span,{className:`cart-button__badge`,initial:{scale:.4,opacity:0},animate:{scale:1,opacity:1},exit:{scale:.4,opacity:0},transition:{type:`spring`,stiffness:500,damping:20},children:s},s)}),(0,a.jsx)(`style`,{children:`
        .cart-button {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 2.75rem;
          height: 2.75rem;
          border-radius: 999px;
          border: 1px solid rgba(90, 30, 38, 0.2);
          background: transparent;
          color: var(--bordeaux);
          cursor: pointer;
        }
        .cart-button__badge {
          position: absolute;
          top: -0.35rem;
          right: -0.35rem;
          min-width: 1.2rem;
          height: 1.2rem;
          padding: 0 0.25rem;
          border-radius: 999px;
          background: var(--bordeaux);
          color: var(--paper-warm);
          font-family: var(--font-body);
          font-size: 0.68rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `})]})}export{o as CartButton};