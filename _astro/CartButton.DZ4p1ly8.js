import{t as e}from"./jsx-runtime.C8BoMr6r.js";import{t}from"./proxy.CKYU37Ej.js";import{r as n,t as r}from"./cartStore.D3JdJmCQ.js";var i=e();function a(){let e=n(e=>e.items),a=n(e=>e.open),o=r(e),s=2+Math.min(o/6,1)*11;return(0,i.jsxs)(t.button,{className:`barattolo`,"data-barattolo":!0,onClick:a,"aria-label":`Il tuo barattolo (${o} ${o===1?`pezzo`:`pezzi`})`,whileTap:{scale:.92},children:[(0,i.jsxs)(`svg`,{viewBox:`0 0 20 24`,width:`22`,height:`26`,"aria-hidden":`true`,children:[(0,i.jsx)(`rect`,{x:`5.5`,y:`1`,width:`9`,height:`3`,rx:`1`,className:`barattolo__tappo`}),(0,i.jsx)(`path`,{d:`M4 5.5h12a1 1 0 0 1 1 1v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-14a1 1 0 0 1 1-1z`,className:`barattolo__vetro`}),(0,i.jsx)(t.rect,{x:`4.2`,width:`11.6`,rx:`0.6`,className:`barattolo__livello`,initial:!1,animate:{y:21.4-s,height:s},transition:{type:`spring`,stiffness:260,damping:24}}),(0,i.jsx)(`path`,{d:`M6 7.5v12`,className:`barattolo__riflesso`})]}),o>0&&(0,i.jsx)(`span`,{className:`barattolo__conta`,children:o}),(0,i.jsx)(`style`,{children:`
        .barattolo {
          position: relative;
          display: inline-flex; align-items: center; justify-content: center;
          width: 2.75rem; height: 2.75rem;
          border-radius: 999px;
          border: 1px solid rgba(220, 197, 158, 0.28);
          background: transparent;
          color: var(--bone-light);
          cursor: pointer;
        }
        .barattolo:focus-visible { outline: 2px solid var(--moss); outline-offset: 2px; }
        .barattolo__tappo { fill: #9c7a4a; }
        .barattolo__vetro {
          fill: rgba(214, 236, 242, 0.12);
          stroke: currentColor; stroke-width: 1.1;
        }
        .barattolo__livello { fill: var(--amanita); opacity: 0.88; }
        .barattolo__riflesso {
          stroke: rgba(253, 248, 238, 0.5); stroke-width: 1; stroke-linecap: round; fill: none;
        }
        .barattolo__conta {
          position: absolute; top: -0.35rem; right: -0.35rem;
          min-width: 1.2rem; height: 1.2rem; padding: 0 0.25rem;
          border-radius: 999px;
          background: var(--amanita); color: var(--soil-deep);
          font-family: var(--font-body); font-size: 0.68rem; font-weight: 500;
          display: flex; align-items: center; justify-content: center;
        }
      `})]})}export{a as CartButton};