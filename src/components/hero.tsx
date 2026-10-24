import Image from "next/image";
import {ArrowRight,Navigation,Phone,Search,Send} from "lucide-react";
import {THEME,type HeroPhoto} from "@/lib/theme";
import {IntentTiles} from "@/components/finder";

const rotating=["service centres","repair shops","riding gear","epic routes"];
export type HeroStats={listings:number|null;cities:number;routes:number;guides:number};

const Photo=({p,sizes,priority,className}:{p:HeroPhoto;sizes:string;priority?:boolean;className?:string})=><div className={className}><Image src={p.src} alt={p.alt} fill priority={priority} sizes={sizes}/></div>;
const fmt=(n:number|null)=>n!=null?n.toLocaleString("en-IN"):"—";

function Copy({stats,children}:{stats:HeroStats;children?:React.ReactNode}){
  return <div className="hero-content">
    <span className="eyebrow">For riders. By riders.</span>
    <h1>Ride more.<span>Worry less.</span></h1>
    <p className="hero-rotate">Find nearby <span className="rotator" aria-hidden="true"><span>{[...rotating,rotating[0]].map((w,i)=><b key={i}>{w}</b>)}</span></span><span className="sr-only">service centres, repair shops, riding gear and routes</span></p>
    <p className="hero-copy">India’s platform for bikers, with a community that rides with you.</p>
    <h2 className="hero-ask">What does your bike need?</h2>
    <IntentTiles/>
    <form action="/services" className="hero-mini-search" role="search"><Search aria-hidden="true"/><input name="q" placeholder="Or search: shop name, job or bike, e.g. Duke 390 service Noida" aria-label="Search BikeHub"/><button className="button small">Search <ArrowRight/></button></form>
    {children}
    <div className="hero-stats">{([[stats.listings,"Listings"],[stats.cities,"Cities"],[stats.routes,"Routes"],[stats.guides,"Guides"]] as const).map(([n,label])=><div key={label}><b data-count={n??undefined}>{fmt(n)}</b><small>{label}</small></div>)}</div>
  </div>;
}
const Credit=({photos}:{photos:HeroPhoto[]})=><p className="hero-credit">Photo{photos.length>1?"s":""}: {photos.map((p,i)=><span key={p.href}>{i>0&&", "}<a href={p.href} target="_blank" rel="noreferrer">{p.credit}</a></span>)} / Unsplash</p>;

/** Home hero. The layout and photos come from the active theme. */
export function Hero({stats}:{stats:HeroStats}){
  const {layout,photos}=THEME.hero;
  if(layout==="arch")return <section className="hero hero-arch"><div className="hero-sun" aria-hidden="true"/><div className="speed-lines" aria-hidden="true"/><div className="container hero-grid">
    <Copy stats={stats}/>
    <div className="arch" aria-hidden="true"><Photo className="arch-frame" p={photos[0]} sizes="(max-width:900px) 80vw, 34vw" priority/>
      <span className="float-chip c1"><Phone/> Call in one tap</span><span className="float-chip c2"><Navigation/> Directions</span><span className="float-chip c3"><Send/> Free enquiries</span></div>
  </div><Credit photos={photos}/></section>;
  return <section className="hero hero-studio"><span className="studio-word" aria-hidden="true">Ride</span><div className="container hero-grid">
    <Copy stats={stats}/>
    <div className="studio" aria-hidden="true"><span className="studio-stripe"/><Photo className="studio-photo" p={photos[0]} sizes="(max-width:900px) 100vw, 50vw" priority/></div>
  </div><div className="chequer" aria-hidden="true"/><Credit photos={photos}/></section>;
}
