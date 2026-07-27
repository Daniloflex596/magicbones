import{o as e,t}from"./react.BRNZa73l.js";import{f as n,t as r}from"./proxy.DC6z9cys.js";import{t as i}from"./AnimatePresence.DA4JTVXO.js";import{t as a}from"./use-reduced-motion.B_3tVrLW.js";import{t as o}from"./types.YEXlas1N.js";import{i as s,o as c}from"./sigil.CjSgADiY.js";import{t as l}from"./ProductCard.rUiQS2JS.js";var u=e(t(),1),d=n(),f=Object.keys(o);function p({products:e,initialCategory:t}){let[n,p]=(0,u.useState)(f.includes(t)?t:null),m=a(),h=(0,u.useMemo)(()=>n?e.filter(e=>e.data.category===n):e,[n,e]);function g(e){p(e);let t=new URL(window.location.href);e?t.searchParams.set(`categoria`,e):t.searchParams.delete(`categoria`),window.history.replaceState({},``,t)}return(0,d.jsxs)(`div`,{children:[(0,d.jsxs)(`div`,{className:`filters`,role:`group`,"aria-label":`Filtra per categoria`,children:[(0,d.jsx)(`button`,{className:`chip ${n===null?`is-active`:``}`,onClick:()=>g(null),children:`Tutto`}),f.map(e=>(0,d.jsx)(`button`,{className:`chip ${n===e?`is-active`:``}`,onClick:()=>g(e),children:o[e]},e))]}),(0,d.jsx)(r.div,{layout:!0,className:`grid`,children:(0,d.jsx)(i,{mode:`popLayout`,children:h.map((e,t)=>(0,d.jsx)(r.div,{layout:!0,initial:!m&&{opacity:0,y:42,rotate:(c(s(e.id))-.5)*7,scale:.94},animate:{opacity:1,y:0,rotate:0,scale:1},exit:{opacity:0,scale:.94},transition:{duration:.55,delay:Math.min(t*.07,.56),ease:[.22,.85,.32,1]},children:(0,d.jsx)(l,{product:e})},e.id))})}),h.length===0&&(0,d.jsx)(`p`,{className:`empty`,children:`Nessun pezzo in questa categoria per ora — torna presto a controllare.`}),(0,d.jsx)(`style`,{children:`
        .filters {
          display: flex;
          flex-wrap: wrap;
          gap: 0.6rem;
          margin-bottom: 2.5rem;
        }
        .chip {
          font-family: var(--font-body);
          font-size: 0.85rem;
          padding: 0.65rem 1.1rem;
          border-radius: 999px;
          border: 1px solid rgba(90, 30, 38, 0.2);
          background: transparent;
          color: var(--bordeaux);
          cursor: pointer;
          transition: background 0.2s ease, border-color 0.2s ease;
        }
        .chip:hover {
          border-color: var(--turquoise);
        }
        .chip.is-active {
          background: var(--turquoise);
          border-color: var(--turquoise);
          color: var(--night-deep);
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 1.5rem;
        }
        .empty {
          font-family: var(--font-body);
          color: rgba(90, 30, 38, 0.7);
          padding: 2rem 0;
        }
      `})]})}export{p as ProductGrid};