import Image from "next/image";
/** Dark page header with ember glow and speed lines. `overlap` leaves room for a filter bar that rises into it. */
export function PageHero({eyebrow,title,intro,image,overlap,children}:{eyebrow?:string;title:React.ReactNode;intro?:React.ReactNode;image?:string;overlap?:boolean;children?:React.ReactNode}){
  return <section className={overlap?"page-hero overlap":"page-hero"}>{image&&<Image className="page-hero-bg" src={image} alt="" fill priority sizes="100vw"/>}<div className="speed-lines" aria-hidden="true"/>
    <div className="container">{eyebrow&&<span className="eyebrow">{eyebrow}</span>}<h1>{title}</h1>{intro&&<p>{intro}</p>}{children}</div></section>;
}
