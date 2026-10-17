import Image from "next/image";
import Link from "next/link";
import {Search,MapPin,ArrowRight,ShieldCheck,Phone,Navigation,Send,MessageCircle,Trophy,Users,Milestone,Compass,Wrench,Bike} from "lucide-react";
import {services,posts,routes} from "@/lib/data";
import {CentreCard,PostCard,ServiceIcon} from "@/components/ui";
import {getCentres,getListingCounts} from "@/lib/supabase-data";
import {CITIES} from "@/lib/listings";
import {COMMUNITY_TOPICS} from "@/lib/community";

const popular=["Service centre","Tyre change","Performance tuning","Riding gear fitting","Riding routes","Upcoming rides"];
const popularHref=(x:string)=>/route|ride/i.test(x)?"/routes":`/services?q=${encodeURIComponent(x)}`;
const miniRoutes=[
  {name:"Delhi → Spiti",distance:"760 km",image:"/images/himalayan-route-generated.jpg"},
  {name:"Manali Loop",distance:"320 km",image:"/images/himalayan-route.jpg"},
  {name:"Leh Ladakh",distance:"1,050 km",image:"/images/community-post-1.jpg"},
  {name:"Valley of Flowers",distance:"540 km",image:"/images/community-post-4.jpg"}
];

export const revalidate=3600;

export default async function Home(){
  const [{items:liveCentres},counts]=await Promise.all([getCentres({},4),getListingCounts()]);
  const countFor=(name:string)=>!counts?null:name==="Service & Repair"?`${(counts.service_centre+counts.repair_shop).toLocaleString("en-IN")} listings`:name==="Gear & Accessories"?`${counts.gear_shop.toLocaleString("en-IN")} shops`:name==="Riding Routes"?`${routes.length} routes`:name==="Expert Advice"?`${posts.length} guides`:null;
  const totalListings=counts?counts.service_centre+counts.repair_shop+counts.gear_shop:null;
  return <main>
    <section className="hero"><Image className="hero-bg" src="/images/bikehub-hero-v2.jpg" alt="" fill priority sizes="100vw"/><div className="container hero-content">
      <h1>Ride more.<span>Worry less.</span></h1>
      <p className="hero-copy">India’s platform for bikers. Find service centres, repair shops, riding gear, routes and a community that rides with you.</p>
      <form action="/services" className="hero-search" role="search"><label><MapPin/><input name="location" placeholder="City, e.g. Pune" aria-label="City"/></label><label><Search/><input name="q" placeholder="Search services, garages, brands or gear…" aria-label="Search BikeHub"/></label><button className="button">Search</button></form>
      <div className="popular"><b>Popular:</b>{popular.map(x=><Link key={x} href={popularHref(x)}>{x}</Link>)}</div>
    </div><div className="container hero-notes" aria-hidden="true"><span><Compass/> Explore</span><span><Users/> Connect</span><span><Wrench/> Maintain</span><span><Bike/> Ride better</span></div></section>

    <div className="container"><nav className="category-grid" aria-label="Explore BikeHub">{services.map(s=>{const count=countFor(s.name);return <Link className="category" href={s.name.includes("Route")||s.name.includes("Rides")?"/routes":s.name.includes("Advice")?"/experts":`/services?q=${encodeURIComponent(s.name)}`} key={s.name}><span className="category-icon"><ServiceIcon name={s.icon}/></span><span><b>{s.name}</b><small>{s.description}</small>{count&&<small className="count">{count}</small>}</span></Link>})}</nav></div>

    <section className="section tight"><div className="container promo-grid">
      <article className="promo service-promo"><Image src="/images/workshop-generated.jpg" alt="" fill sizes="(max-width:900px) 100vw, 50vw"/><h2>Find trusted service centres near you</h2><p>Service centres, repair shops and riding gear across {CITIES.length} cities.</p><Link className="button" href="/services">Find a service centre <ArrowRight/></Link>
        <div className="promo-features"><span><ShieldCheck/>Verified listings</span><span><Phone/>Call in one tap</span><span><Navigation/>Directions</span><span><Send/>Free enquiries</span></div></article>
      <div className="route-promo-wrap"><article className="promo"><Image src="/images/himalayan-route-generated.jpg" alt="" fill sizes="(max-width:900px) 100vw, 50vw"/><h2>Discover epic rides & routes</h2><p>Scenic routes, weekend getaways and riding stories from across India.</p><Link className="button" href="/routes">Explore routes <ArrowRight/></Link></article>
        <div className="mini-routes">{miniRoutes.map(r=><Link href="/routes" className="mini-route" key={r.name}><Image src={r.image} alt="" fill sizes="160px"/><b>{r.name}</b><span>{r.distance}</span></Link>)}</div></div>
    </div></section>

    <section className="section"><div className="container">
      <div className="section-head"><div><h2>Featured service centres</h2><p>Motorcycle specialists across India</p></div><Link className="link" href="/services">View all <ArrowRight size={16}/></Link></div>
      <div className="cards">{liveCentres.map(c=><CentreCard key={c.slug} centre={c}/>)}</div>
    </div></section>

    <section className="section soft"><div className="container">
      <div className="section-head"><div><h2>Latest from our community</h2><p>Ride stories, maintenance and safety advice</p></div><nav className="topic-tabs" aria-label="Community topics"><Link className="active" href="/community">All posts</Link>{COMMUNITY_TOPICS.map(t=><Link key={t.value} href={`/community?topic=${t.value}`}>{t.label}</Link>)}</nav></div>
      <div className="community-layout"><div className="post-grid three">{posts.slice(0,3).map(p=><PostCard key={p.slug} post={p}/>)}</div>
        <aside className="join-card"><h3><MessageCircle/> Join the conversation</h3><p>Read rider stories, share what you’ve learned and get advice from experienced riders. Free, no login needed to read.</p><Link className="button" href="/community">Join BikeHub <ArrowRight/></Link>
          <div className="join-stats"><span><b>{totalListings?totalListings.toLocaleString("en-IN"):"—"}</b><small>Listings</small></span><span><b>{CITIES.length}</b><small>Cities</small></span><span><b>{posts.length}</b><small>Guides</small></span></div></aside></div>
    </div></section>

    <section className="trust-strip"><div className="container trust-grid">
      <div className="trust-item"><span className="trust-icon"><Trophy/></span><div><b>Trusted listings</b><span>Verified badges only after BikeHub checks the business.</span></div></div>
      <div className="trust-item"><span className="trust-icon"><Users/></span><div><b>Rider community</b><span>Connect with passionate riders across India.</span></div></div>
      <div className="trust-item"><span className="trust-icon"><ShieldCheck/></span><div><b>Expert guidance</b><span>Maintenance and safety advice from specialists.</span></div></div>
      <div className="trust-item"><span className="trust-icon"><Milestone/></span><div><b>Ride better</b><span>Routes, events and everything for the road.</span></div></div>
    </div><p className="container trust-signoff">It’s not just a ride. It’s a lifestyle.</p></section>
  </main>
}
