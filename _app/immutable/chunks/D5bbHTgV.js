import{a as F,d as I,b as k,c as M}from"./GDIX7m7e.js";import{b as E,E as S,g as A,M as C,al as W,h as i,i as v,a as w,am as R,k as j,w as B,e as y,s as N,z as G,p as J,f as K,x as V,A as q,J as D,N as H,K as L,a8 as O,P as p,an as Q,ao as U}from"./DEcZrnr0.js";import{a as x,e as X,i as Y}from"./CD1p3DkI.js";import{b as Z}from"./cDCz6TXU.js";import{p as u,r as $}from"./MeOtniJd.js";function ee(d,e,...m){var r=d,o=C,l;E(()=>{o!==(o=e())&&(l&&(W(l),l=null),l=A(()=>o(r,...m)))},S),i&&(r=v)}function te(d,e,m,r,o,l){let g=i;i&&w();var c,n,t=null;i&&v.nodeType===1&&(t=v,w());var h=i?v:d,a;E(()=>{const s=e()||null;var _=R;s!==c&&(a&&(s===null?J(a,()=>{a=null,n=null}):s===n?K(a):W(a)),s&&s!==n&&(a=A(()=>{if(t=i?t:document.createElementNS(_,s),F(t,t),r){i&&Z(s)&&t.append(document.createComment(""));var f=i?j(t):t.appendChild(B());i&&(f===null?y(!1):N(f)),r(t,f)}G.nodes_end=t,h.before(t)})),c=s,c&&(n=c))},S),g&&(y(!0),N(h))}/**
 * @license @lucide/svelte v0.525.0 - ISC
 *
 * ISC License
 * 
 * Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2022.
 * 
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 * 
 */const ae={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":2,"stroke-linecap":"round","stroke-linejoin":"round"};var se=I("<svg><!><!></svg>");function de(d,e){V(e,!0);const m=u(e,"color",3,"currentColor"),r=u(e,"size",3,24),o=u(e,"strokeWidth",3,2),l=u(e,"absoluteStrokeWidth",3,!1),g=u(e,"iconNode",19,()=>[]),c=$(e,["$$slots","$$events","$$legacy","name","color","size","strokeWidth","absoluteStrokeWidth","iconNode","children"]);var n=se();x(n,a=>({...ae,...c,width:r(),height:r(),stroke:m(),"stroke-width":a,class:["lucide-icon lucide",e.name&&`lucide-${e.name}`,e.class]}),[()=>l()?Number(o())*24/Number(r()):o()]);var t=D(n);X(t,17,g,Y,(a,s)=>{var _=Q(()=>U(p(s),2));let f=()=>p(_)[0],z=()=>p(_)[1];var b=M(),T=O(b);te(T,f,!0,(P,re)=>{x(P,()=>({...z()}))}),k(a,b)});var h=H(t);ee(h,()=>e.children??C),L(n),k(d,n),q()}export{de as I,ee as s};
