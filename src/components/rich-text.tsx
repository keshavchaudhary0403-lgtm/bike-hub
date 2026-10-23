import {paragraphs} from "@/lib/content";
/** Article and route text. Blocks are separated by a blank line; a block starting "## " is a sub-heading,
 *  and a block whose lines all start "- " is a bullet list. Everything else is a paragraph. */
export function RichText({text}:{text:string|string[]|null|undefined}){
  const blocks=Array.isArray(text)?text:paragraphs(text);
  return <>{blocks.map((b,i)=>{
    if(b.startsWith("## "))return <h2 key={i}>{b.slice(3).trim()}</h2>;
    const lines=b.split("\n").map(l=>l.trim()).filter(Boolean);
    if(lines.length&&lines.every(l=>/^[-•] /.test(l)))return <ul key={i}>{lines.map((l,j)=><li key={j}>{l.slice(2)}</li>)}</ul>;
    return <p key={i}>{b}</p>;
  })}</>;
}
