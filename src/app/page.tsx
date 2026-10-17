import Image from "next/image";
import Link from "next/link";
import {Search,MapPin,ArrowRight} from "lucide-react";
import {services,posts} from "@/lib/data";
import {CentreCard,PostCard,ServiceIcon} from "@/components/ui";
import {getCentres,getListingCounts} from "@/lib/supabase-data";

const popular=["Service centre","Tyre change","Riding gear","Royal Enfield","Performance tuning"];
const miniRoutes=["Delhi → Spiti","Manali Loop","Leh Ladakh","Valley of Flowers"];

export const revalidate=3600;

export default async function Home(){
  const [{items:liveCentres},counts]=await Promise.all([getCentres({},4),getListingCounts()]);
  const countFor=(name:string)=>!counts?null:name==="Service & Repair"?`${(counts.service_centre+counts.repair_shop).toLocaleString("en-IN")} listings`:name==="Gear & Accessories"?`${counts.gear_shop.toLocaleString("en-IN")} shops`:null;
  return <main>
    <section className="hero"><Image className="hero-bg" src="/images/bikehub-hero-v2.jpg" alt="" fill priority sizes="100vw"/><div className="container hero-content">
      <h1>Ride more.<span>Worry less.</span></h1>
      <p className="hero-copy">Find motorcycle service centres, repair shops and riding gear across India.</p>
      <form action="/services" className="hero-search" role="search"><label><MapPin/><input name="location" placeholder="City, e.g. Pune" aria-label="City"/></label><label><Search/><input name="q" placeholder="Shop, brand or service" aria-label="Search BikeHub"/></label><button className="button">Search</button></form>
      <div className="popular">{popular.map(x=><Link key={x} href={`/services?q=${encodeURIComponent(x)}`}>{x}</Link>)}</div>
    </div></section>

    <div className="container"><nav className="category-grid" aria-label="Explore BikeHub">{services.map(s=>{const count=countFor(s.name);return <Link className="category" href={s.name.includes("Route")||s.name.includes("Rides")?"/routes":s.name.includes("Advice")?"/community":`/services?q=${encodeURIComponent(s.name)}`} key={s.name}><span className="category-icon"><ServiceIcon name={s.icon}/></span><span><b>{s.name}</b>{count&&<small>{count}</small>}</span></Link>})}</nav></div>

    <section className="section"><div className="container">
      <div className="section-head"><div><h2>Service centres & repair shops</h2><p>Motorcycle specialists across India</p></div><Link className="link" href="/services">View all <ArrowRight size={16}/></Link></div>
      <div className="cards">{liveCentres.map(c=><CentreCard key={c.slug} centre={c}/>)}</div>
    </div></section>

    <section className="section soft"><div className="container promo-grid">
      <article className="promo"><Image src="/images/workshop-generated.jpg" alt="" fill sizes="(max-width:900px) 100vw, 50vw"/><h2>Find a service centre near you</h2><p>Search by city, brand or the work you need done.</p><Link className="button" href="/services">Find a service centre <ArrowRight/></Link></article>
      <article className="promo"><Image src="/images/himalayan-route-generated.jpg" alt="" fill sizes="(max-width:900px) 100vw, 50vw"/><h2>Discover rides & routes</h2><div className="mini-routes">{miniRoutes.map(r=><Link key={r} href="/routes">{r}</Link>)}</div><Link className="button" href="/routes">Explore routes <ArrowRight/></Link></article>
    </div></section>

    <section className="section"><div className="container">
      <div className="section-head"><div><h2>From the community</h2><p>Ride stories, maintenance and safety advice</p></div><Link className="link" href="/community">View all <ArrowRight size={16}/></Link></div>
      <div className="post-grid">{posts.slice(0,4).map(p=><PostCard key={p.slug} post={p}/>)}</div>
    </div></section>
  </main>
}
