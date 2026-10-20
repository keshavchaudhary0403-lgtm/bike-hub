// Regenerates the BikeHub wheel logo, favicons and app icons in the brand colours.
// Usage: node scripts/generate-icons.mjs
import sharp from "sharp";import {writeFileSync} from "node:fs";

// Theme colours: tile background, gradient start (light), middle and end (deep), tile glow.
const BG="#0f1114",AMBER="#ffb020",EMBER="#ff5a1f",DEEP="#e23d0b",GLOW="#22262c";
const spokes=[0,72,144,216,288].map(a=>`<rect x="244" y="98" width="24" height="120" rx="6" transform="rotate(${a} 256 256)"/>`).join("");
// `bleed` fills the whole square (maskable icons); otherwise a rounded tile.
const svg=({bleed=false,scale=1}={})=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
<defs><linearGradient id="e" gradientUnits="userSpaceOnUse" x1="80" y1="80" x2="432" y2="432"><stop offset="0" stop-color="${AMBER}"/><stop offset=".55" stop-color="${EMBER}"/><stop offset="1" stop-color="${DEEP}"/></linearGradient>
<radialGradient id="g" cx=".5" cy=".42" r=".7"><stop offset="0" stop-color="${GLOW}"/><stop offset="1" stop-color="${BG}"/></radialGradient></defs>
${bleed?`<rect width="512" height="512" fill="url(#g)"/>`:`<rect width="512" height="512" rx="104" fill="url(#g)"/>`}
<g transform="translate(256 256) scale(${scale}) translate(-256 -256)" fill="url(#e)">
<circle cx="256" cy="256" r="172" fill="none" stroke="url(#e)" stroke-width="34"/>${spokes}
<circle cx="256" cy="256" r="56"/><circle cx="256" cy="256" r="20" fill="${BG}"/></g></svg>`;

const png=(s,size)=>sharp(Buffer.from(s)).resize(size,size).png().toBuffer();
const out=async(path,s,size)=>writeFileSync(path,await png(s,size));
await out("public/icon-192.png",svg(),192);
await out("public/icon-512.png",svg(),512);
await out("public/logo-mark.png",svg(),128);
await out("public/icon-maskable-512.png",svg({bleed:true,scale:.78}),512);
await out("src/app/icon.png",svg(),512);
await out("src/app/apple-icon.png",svg({bleed:true,scale:.86}),180);
// favicon.ico: PNG-compressed ICO with 16, 32 and 48px images.
const sizes=[16,32,48];const images=await Promise.all(sizes.map(n=>png(svg(),n)));
const header=Buffer.alloc(6);header.writeUInt16LE(0,0);header.writeUInt16LE(1,2);header.writeUInt16LE(sizes.length,4);
let offset=6+16*sizes.length;const dir=images.map((img,i)=>{const e=Buffer.alloc(16);e.writeUInt8(sizes[i],0);e.writeUInt8(sizes[i],1);e.writeUInt16LE(1,4);e.writeUInt16LE(32,6);e.writeUInt32LE(img.length,8);e.writeUInt32LE(offset,12);offset+=img.length;return e});
writeFileSync("src/app/favicon.ico",Buffer.concat([header,...dir,...images]));
writeFileSync("public/logo.svg",svg());
console.log("Icons written");
