import{f as e,t}from"./proxy.DC6z9cys.js";import{t as n}from"./use-reduced-motion.B_3tVrLW.js";import{t as r}from"./types.YEXlas1N.js";import{t as i}from"./CategoryGlyph.CybsYpya.js";import{t as a}from"./url.CAOiosgJ.js";var o=e(),s=Object.keys(r),c={"teschio-dipinto":`linear-gradient(150deg, #1c1f2e, #3a2418)`,"gioiello-osso":`linear-gradient(150deg, #0c0f1a, #1a2a2c)`,"arredo-rituale":`linear-gradient(150deg, #2a1418, #1c1f2e)`,candele:`linear-gradient(150deg, #2a1210, #3a1a12)`,"cristalli-muschio":`linear-gradient(150deg, #17241a, #0c0f1a)`,"tarocchi-zodiaco":`linear-gradient(150deg, #241830, #0c0f1a)`};function l(){let e=n();return(0,o.jsxs)(`div`,{className:`tiles`,children:[s.map((n,s)=>(0,o.jsxs)(t.a,{href:a(`/negozio?categoria=${n}`),"data-astro-reload":``,className:`tile`,style:{background:c[n]},initial:!e&&{opacity:0,y:20},whileInView:{opacity:1,y:0},viewport:{once:!0,margin:`-40px`},transition:{duration:.5,delay:s*.06,ease:`easeOut`},whileHover:{y:-4},whileTap:{scale:.97},children:[(0,o.jsx)(i,{category:n,className:`tile__glyph`}),(0,o.jsx)(`span`,{className:`tile__label`,children:r[n]}),(0,o.jsx)(`span`,{className:`tile__arrow`,children:`→`})]},n)),(0,o.jsx)(`style`,{children:`
        .tiles {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1rem;
        }
        .tile {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: flex-end;
          gap: 0.5rem;
          padding: 1.5rem 1.25rem;
          border-radius: var(--radius-lg);
          min-height: 9.5rem;
          text-decoration: none;
          border: 1px solid rgba(228, 217, 184, 0.1);
          overflow: hidden;
        }
        .tile__glyph {
          width: 1.9rem;
          height: 1.9rem;
          color: var(--bone-cream);
          opacity: 0.7;
        }
        .tile__label {
          font-family: var(--font-display);
          font-size: 1.05rem;
          color: var(--bone-cream);
          line-height: 1.2;
        }
        .tile__arrow {
          position: absolute;
          top: 1.1rem;
          right: 1.2rem;
          color: var(--turquoise);
          font-size: 0.9rem;
          opacity: 0.8;
        }
      `})]})}export{l as CategoryTiles};