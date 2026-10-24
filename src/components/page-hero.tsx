import Image from "next/image";
/** Light page header; an optional photo sits in a theme-styled frame on the right. `overlap` leaves room for a filter bar that rises into it. */
/** `compact` is a short header for result pages, so results show without scrolling. */
export function PageHero({eyebrow,title,intro,image,overlap,compact,children}:{eyebrow?:string;title:React.ReactNode;intro?:React.ReactNode;image?:string;overlap?:boolean;compact?:boolean;children?:React.ReactNode}){
  return <section className={`page-hero${overlap?" overlap":""}${compact?" compact":""}${image?" has-media":""}`}>{image&&<div className="page-hero-media" aria-hidden="true"><Image src={image} alt="" fill priority sizes="(max-width:900px) 100vw, 45vw"/></div>}<div className="speed-lines" aria-hidden="true"/>
    <div className="container">{eyebrow&&<span className="eyebrow">{eyebrow}</span>}<h1>{title}</h1>{intro&&<p>{intro}</p>}{children}</div></section>;
}
