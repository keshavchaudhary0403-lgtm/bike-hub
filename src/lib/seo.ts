// Site address and structured-data helpers for search engines.
// On Vercel the production domain is provided automatically, so a custom domain later needs no code change.
export const SITE_URL=(process.env.VERCEL_PROJECT_PRODUCTION_URL?`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`:process.env.NEXT_PUBLIC_SITE_URL||"http://localhost:3000").replace(/\/$/,"");
export const SITE_NAME="BikeHub";
export const absoluteUrl=(path:string)=>/^https?:\/\//.test(path)?path:`${SITE_URL}${path.startsWith("/")?"":"/"}${path}`;
export const PUBLISHER={"@type":"Organization",name:SITE_NAME,url:SITE_URL,logo:{"@type":"ImageObject",url:absoluteUrl("/icon-512.png")}};
/** Cuts text to a search-snippet length on a word boundary. */
export const snippet=(text:string|null|undefined,max=160)=>{const t=(text||"").replace(/\s+/g," ").trim();return t.length<=max?t:t.slice(0,t.lastIndexOf(" ",max-1)).replace(/[,.;:]$/,"")+"…"};
