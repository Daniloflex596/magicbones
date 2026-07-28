import{o as e,t}from"./react.BRNZa73l.js";import{t as n}from"./jsx-runtime.C8BoMr6r.js";import{t as r}from"./proxy.CKYU37Ej.js";import{t as i}from"./AnimatePresence.-l7QYcWE.js";import{t as a}from"./url.CAOiosgJ.js";var o=e(t(),1),s=n();function c({category:e,className:t}){let n={className:t,viewBox:`0 0 48 48`,fill:`none`,stroke:`currentColor`,strokeWidth:1.4,strokeLinecap:`round`,strokeLinejoin:`round`};switch(e){case`teschio-dipinto`:return(0,s.jsxs)(`svg`,{...n,"aria-hidden":`true`,children:[(0,s.jsx)(`path`,{d:`M24 8c-8 0-13 6-13 13 0 5 2 8 4 10v6h4v-4h3v4h4v-4h3v4h4v-6c2-2 4-5 4-10 0-7-5-13-13-13Z`}),(0,s.jsx)(`circle`,{cx:`18.5`,cy:`21`,r:`2.6`}),(0,s.jsx)(`circle`,{cx:`29.5`,cy:`21`,r:`2.6`}),(0,s.jsx)(`path`,{d:`M22 27h4l-2 3-2-3Z`})]});case`gioiello-osso`:return(0,s.jsxs)(`svg`,{...n,"aria-hidden":`true`,children:[(0,s.jsx)(`circle`,{cx:`18`,cy:`14`,r:`4`}),(0,s.jsx)(`path`,{d:`M20.8 16.8 27.2 31.2`}),(0,s.jsx)(`circle`,{cx:`30`,cy:`34`,r:`4`})]});case`candele`:return(0,s.jsxs)(`svg`,{...n,"aria-hidden":`true`,children:[(0,s.jsx)(`path`,{d:`M24 8c2 3 3 5 3 7a3 3 0 1 1-6 0c0-2 1-4 3-7Z`}),(0,s.jsx)(`rect`,{x:`19`,y:`18`,width:`10`,height:`20`,rx:`1.5`})]});case`cristalli-muschio`:return(0,s.jsxs)(`svg`,{...n,"aria-hidden":`true`,children:[(0,s.jsx)(`path`,{d:`M24 6 33 18 24 42 15 18Z`}),(0,s.jsx)(`path`,{d:`M15 18h18M24 6 19 18M24 6l5 12`})]});case`tarocchi-zodiaco`:return(0,s.jsxs)(`svg`,{...n,"aria-hidden":`true`,children:[(0,s.jsx)(`circle`,{cx:`24`,cy:`24`,r:`16`}),Array.from({length:12}).map((e,t)=>{let n=t/12*Math.PI*2;return(0,s.jsx)(`line`,{x1:24+Math.cos(n)*13,y1:24+Math.sin(n)*13,x2:24+Math.cos(n)*16,y2:24+Math.sin(n)*16},t)})]});default:return(0,s.jsx)(`svg`,{...n,"aria-hidden":`true`,children:(0,s.jsx)(`path`,{d:`M24 8v32M8 24h32M14 14l20 20M34 14 14 34`})})}}function l({images:e,category:t}){let[n,l]=(0,o.useState)(0),u=e[n];return(0,s.jsxs)(`div`,{className:`gallery`,children:[(0,s.jsx)(`div`,{className:`gallery__main`,children:(0,s.jsx)(i,{mode:`wait`,children:(0,s.jsx)(r.div,{initial:{opacity:0},animate:{opacity:1},exit:{opacity:0},transition:{duration:.35},className:`gallery__frame`,children:u.placeholder?(0,s.jsxs)(s.Fragment,{children:[(0,s.jsx)(c,{category:t,className:`gallery__glyph`}),(0,s.jsx)(`span`,{className:`gallery__soon`,children:`Foto in arrivo`})]}):(0,s.jsx)(`img`,{src:a(u.src),alt:u.alt})},n)})}),e.length>1&&(0,s.jsx)(`div`,{className:`gallery__thumbs`,children:e.map((e,r)=>(0,s.jsx)(`button`,{className:`gallery__thumb ${r===n?`is-active`:``}`,onClick:()=>l(r),"aria-label":`Mostra immagine ${r+1}`,"aria-current":r===n,children:e.placeholder?(0,s.jsx)(c,{category:t,className:`gallery__thumb-glyph`}):(0,s.jsx)(`img`,{src:a(e.src),alt:``})},r))}),(0,s.jsx)(`style`,{children:`
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