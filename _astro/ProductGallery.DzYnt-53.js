import{o as e,t}from"./react.BRNZa73l.js";import{f as n,t as r}from"./proxy.DC6z9cys.js";import{t as i}from"./AnimatePresence.DA4JTVXO.js";import{t as a}from"./CategoryGlyph.CybsYpya.js";import{t as o}from"./url.CAOiosgJ.js";var s=e(t(),1),c=n();function l({images:e,category:t}){let[n,l]=(0,s.useState)(0),u=e[n];return(0,c.jsxs)(`div`,{className:`gallery`,children:[(0,c.jsx)(`div`,{className:`gallery__main`,children:(0,c.jsx)(i,{mode:`wait`,children:(0,c.jsx)(r.div,{initial:{opacity:0},animate:{opacity:1},exit:{opacity:0},transition:{duration:.35},className:`gallery__frame`,children:u.placeholder?(0,c.jsxs)(c.Fragment,{children:[(0,c.jsx)(a,{category:t,className:`gallery__glyph`}),(0,c.jsx)(`span`,{className:`gallery__soon`,children:`Foto in arrivo`})]}):(0,c.jsx)(`img`,{src:o(u.src),alt:u.alt})},n)})}),e.length>1&&(0,c.jsx)(`div`,{className:`gallery__thumbs`,children:e.map((e,r)=>(0,c.jsx)(`button`,{className:`gallery__thumb ${r===n?`is-active`:``}`,onClick:()=>l(r),"aria-label":`Mostra immagine ${r+1}`,"aria-current":r===n,children:e.placeholder?(0,c.jsx)(a,{category:t,className:`gallery__thumb-glyph`}):(0,c.jsx)(`img`,{src:o(e.src),alt:``})},r))}),(0,c.jsx)(`style`,{children:`
        .gallery__main {
          aspect-ratio: 4 / 5;
          border-radius: var(--radius-lg);
          overflow: hidden;
          background: linear-gradient(135deg, #1c1f2e, #0c0f1a);
          margin-bottom: 0.75rem;
        }
        .gallery__frame {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.6rem;
        }
        .gallery__frame img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .gallery__glyph {
          width: 4rem;
          height: 4rem;
          color: var(--bone-cream);
          opacity: 0.5;
        }
        .gallery__soon {
          font-family: var(--font-body);
          font-size: 0.75rem;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: rgba(228, 217, 184, 0.45);
        }
        .gallery__thumbs {
          display: flex;
          gap: 0.6rem;
        }
        .gallery__thumb {
          width: 3.25rem;
          height: 3.25rem;
          border-radius: var(--radius-md);
          border: 1px solid rgba(90, 30, 38, 0.15);
          background: #fffdf9;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          overflow: hidden;
          padding: 0;
        }
        .gallery__thumb.is-active {
          border-color: var(--turquoise);
        }
        .gallery__thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .gallery__thumb-glyph {
          width: 1.4rem;
          height: 1.4rem;
          color: var(--bone-cream);
          opacity: 0.5;
        }
      `})]})}export{l as ProductGallery};