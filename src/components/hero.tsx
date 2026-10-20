import Image from "next/image";import Link from "next/link";
import {ArrowRight,BadgeCheck,MapPin,Navigation,Phone,Route as RouteIcon,Search,Send,ShieldCheck,Wrench,CircleDot,HardHat} from "lucide-react";
import {THEME,type HeroPhoto} from "@/lib/theme";

const popular=["Service centre","Tyre change","Performance tuning","Riding gear fitting","Riding routes","Upcoming rides"];
const popularHref=(x:string)=>/route|ride/i.test(x)?"/routes":`/services?q=${encodeURIComponent(x)}`;
const rotating=["service centres","repair shops","riding gear","epic routes"];
const quick=[["Service & repair","/services?type=service_centre",Wrench],["Tyres & wheels","/services?q=Tyre",CircleDot],["Riding gear","/services?type=gear_shop",HardHat],["Routes","/routes",RouteIcon]] as const;
export type HeroStats={listings:number|null;cities:number;routes:number;guides:number};

const Photo=({p,sizes,priority,className}:{p:HeroPhoto;sizes:string;priority?:boolean;className?:string})=><div className={className}><Image src={p.src} alt={p.alt} fill priority={priority} sizes={sizes}/></div>;
const fmt=(n:number|null)=>n!=null?n.toLocaleString("en-IN"):"—";

function Copy({stats,children}:{stats:HeroStats;children?:React.ReactNode}){
  return <div className="hero-content">
    <span className="eyebrow">For riders. By riders.</span>
    <h1>Ride more.<span>Worry less.</span></h1>
    <p className="hero-rotate">Find nearby <span className="rotator" aria-hidden="true"><span>{[...rotating,rotating[0]].map((w,i)=><b key={i}>{w}</b>)}</span></span><span className="sr-only">service centres, repair shops, riding gear and routes</span></p>
    <p className="hero-copy">India’s platform for bikers, with a community that rides with you.</p>
    <form action="/services" className="hero-search" role="search"><label><MapPin/><input name="location" placeholder="City, e.g. Pune" aria-label="City"/></label><label><Search/><input name="q" placeholder="Services, garages, brands or gear" aria-label="Search BikeHub"/></label><button className="button">Search <ArrowRight/></button></form>
    {children??<div className="popular"><b>Popular:</b>{popular.map(x=><Link key={x} href={popularHref(x)}>{x}</Link>)}</div>}
    <div className="hero-stats">{([[stats.listings,"Listings"],[stats.cities,"Cities"],[stats.routes,"Routes"],[stats.guides,"Guides"]] as const).map(([n,label])=><div key={label}><b data-count={n??undefined}>{fmt(n)}</b><small>{label}</small></div>)}</div>
  </div>;
}
const Credit=({photos}:{photos:HeroPhoto[]})=><p className="hero-credit">Photo{photos.length>1?"s":""}: {photos.map((p,i)=><span key={p.href}>{i>0&&", "}<a href={p.href} target="_blank" rel="noreferrer">{p.credit}</a></span>)} / Unsplash</p>;

/** Home hero. The layout and photos come from the active theme. */
export function Hero({stats}:{stats:HeroStats}){
  const {layout,photos}=THEME.hero;
  if(layout==="mosaic")return <section className="hero hero-mosaic"><div className="container hero-grid">
    <Copy stats={stats}><nav className="quick" aria-label="Quick links">{quick.map(([label,href,Icon])=><Link key={label} href={href}><span><Icon/></span>{label}</Link>)}</nav></Copy>
    <div className="mosaic" aria-hidden="true"><Photo className="m-1" p={photos[0]} sizes="(max-width:900px) 60vw, 30vw" priority/><Photo className="m-2" p={photos[1]??photos[0]} sizes="(max-width:900px) 40vw, 22vw"/>
      <Link href="/services" className="m-card" tabIndex={-1}><b>{fmt(stats.listings)}</b><span>listings across {stats.cities} cities</span><ArrowRight/></Link>
      <span className="m-badge"><BadgeCheck/> Verified badges</span><span className="m-badge two"><Phone/> Call in one tap</span></div>
  </div><Credit photos={photos.slice(0,2)}/></section>;
  if(layout==="arch")return <section className="hero hero-arch"><div className="hero-sun" aria-hidden="true"/><div className="speed-lines" aria-hidden="true"/><div className="container hero-grid">
    <Copy stats={stats}/>
    <div className="arch" aria-hidden="true"><Photo className="arch-frame" p={photos[0]} sizes="(max-width:900px) 80vw, 34vw" priority/>
      <span className="float-chip c1"><Phone/> Call in one tap</span><span className="float-chip c2"><Navigation/> Directions</span><span className="float-chip c3"><Send/> Free enquiries</span></div>
  </div><Credit photos={photos}/></section>;
  return <section className="hero hero-studio"><span className="studio-word" aria-hidden="true">Ride</span><div className="container hero-grid">
    <Copy stats={stats}/>
    <div className="studio" aria-hidden="true"><span className="studio-stripe"/><Photo className="studio-photo" p={photos[0]} sizes="(max-width:900px) 100vw, 50vw" priority/><span className="studio-tag"><ShieldCheck/> Verified listings</span></div>
  </div><div className="chequer" aria-hidden="true"/><Credit photos={photos}/></section>;
}
