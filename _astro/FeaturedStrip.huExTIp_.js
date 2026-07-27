import{f as e,t}from"./proxy.DC6z9cys.js";import{t as n}from"./use-reduced-motion.B_3tVrLW.js";import{i as r,o as i}from"./sigil.CjSgADiY.js";import{t as a}from"./ProductCard.rUiQS2JS.js";var o=e();function s({products:e}){let s=n();return(0,o.jsxs)(`div`,{className:`featured-grid`,children:[e.map((e,n)=>(0,o.jsx)(t.div,{initial:!s&&{opacity:0,y:42,rotate:(i(r(e.id))-.5)*7,scale:.94},whileInView:{opacity:1,y:0,rotate:0,scale:1},viewport:{once:!0,margin:`-40px`},transition:{duration:.55,delay:Math.min(n*.07,.56),ease:[.22,.85,.32,1]},children:(0,o.jsx)(a,{product:e})},e.id)),(0,o.jsx)(`style`,{children:`
        .featured-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 1.4rem;
        }
      `})]})}export{s as FeaturedStrip};