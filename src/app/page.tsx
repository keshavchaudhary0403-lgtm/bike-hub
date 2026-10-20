import Image from "next/image";
import Link from "next/link";
import {ArrowRight,ShieldCheck,Phone,Navigation,Send,MessageCircle,Trophy,Users,Milestone} from "lucide-react";
import {services,posts,routes} from "@/lib/data";
import {CentreCard,PostCard,ServiceIcon} from "@/components/ui";
import {getCentres,getListingCounts} from "@/lib/supabase-data";
import {CITIES} from "@/lib/listings";
import {COMMUNITY_TOPICS} from "@/lib/community";
import {Hero} from "@/components/hero";

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
    <Hero stats={{listings:totalListings,cities:CITIES.length,routes:routes.length,guides:posts.length}}/>

    <nav className="marquee" aria-label="Browse by city"><div className="marquee-track">{[0,1].map(copy=><div key={copy} className="marquee-set" aria-hidden={copy===1||undefined}>{CITIES.map(c=><Link key={c} href={`/services?location=${encodeURIComponent(c)}`} tabIndex={copy===1?-1:undefined}>{c}</Link>)}</div>)}</div></nav>

    <section className="section"><div className="container">
      <div className="section-head" data-reveal><div><span className="eyebrow">Everything for the road</span><h2>What do you need today?</h2></div><Link className="link" href="/services">Browse all listings <ArrowRight size={16}/></Link></div>
      <nav className="category-grid" aria-label="Explore BikeHub" data-reveal="stagger">{services.map(s=>{const count=countFor(s.name);return <Link className="category" href={s.name.includes("Route")||s.name.includes("Rides")?"/routes":s.name.includes("Advice")?"/experts":`/services?q=${encodeURIComponent(s.name)}`} key={s.name}><span className="category-icon"><ServiceIcon name={s.icon}/></span><span><b>{s.name}</b><small>{s.description}</small>{count&&<small className="count">{count}</small>}</span></Link>})}</nav>
    </div></section>

    <section className="section tight" style={{paddingTop:0}}><div className="container promo-grid" data-reveal="stagger">
      <article className="promo service-promo"><Image src="/images/workshop-generated.jpg" alt="" fill sizes="(max-width:900px) 100vw, 50vw"/><span className="eyebrow">Service & repair</span><h2>Trusted service centres near you</h2><p>Service centres, repair shops and riding gear across {CITIES.length} cities.</p><Link className="button" href="/services">Find a service centre <ArrowRight/></Link>
        <div className="promo-features"><span><ShieldCheck/>Verified listings</span><span><Phone/>Call in one tap</span><span><Navigation/>Directions</span><span><Send/>Free enquiries</span></div></article>
      <div className="route-promo-wrap"><article className="promo"><Image src="/images/himalayan-route-generated.jpg" alt="" fill sizes="(max-width:900px) 100vw, 50vw"/><span className="eyebrow">Rides & routes</span><h2>Discover epic rides</h2><p>Scenic routes, weekend getaways and riding stories from across India.</p><Link className="button" href="/routes">Explore routes <ArrowRight/></Link></article>
        <div className="mini-routes">{miniRoutes.map(r=><Link href="/routes" className="mini-route" key={r.name}><Image src={r.image} alt="" fill sizes="160px"/><b>{r.name}</b><span>{r.distance}</span></Link>)}</div></div>
    </div></section>

    <div className="road" aria-hidden="true"/>
    <section className="section white"><div className="container">
      <div className="section-head" data-reveal><div><span className="eyebrow">Featured</span><h2>Service centres</h2><p>Motorcycle specialists across India.</p></div><Link className="link" href="/services">View all <ArrowRight size={16}/></Link></div>
      <div className="cards" data-reveal="stagger">{liveCentres.map(c=><CentreCard key={c.slug} centre={c}/>)}</div>
    </div></section>

    <section className="section soft"><div className="container">
      <div className="section-head" data-reveal><div><span className="eyebrow">Community</span><h2>Latest from riders</h2><p>Ride stories, maintenance and safety advice.</p></div><nav className="topic-tabs" aria-label="Community topics"><Link className="active" href="/community">All posts</Link>{COMMUNITY_TOPICS.map(t=><Link key={t.value} href={`/community?topic=${t.value}`}>{t.label}</Link>)}</nav></div>
      <div className="community-layout" data-reveal="stagger"><div className="post-grid three">{posts.slice(0,3).map(p=><PostCard key={p.slug} post={p}/>)}</div>
        <aside className="join-card"><h3><MessageCircle/> Join the conversation</h3><p>Read rider stories, share what you’ve learned and get advice from experienced riders. Free, no login needed to read.</p><Link className="button" href="/community">Join BikeHub <ArrowRight/></Link>
          <div className="join-stats"><span><b>{totalListings?totalListings.toLocaleString("en-IN"):"—"}</b><small>Listings</small></span><span><b>{CITIES.length}</b><small>Cities</small></span><span><b>{posts.length}</b><small>Guides</small></span></div></aside></div>
    </div></section>

    <section className="section soft" style={{paddingTop:0}}><div className="container"><div className="cta-band" data-reveal>
      <div><span className="eyebrow">For workshops & gear stores</span><h2>Own a bike business?</h2><p>Claim your listing, add photos, keep your details right and get enquiries from riders near you.</p></div>
      <div className="actions"><Link className="button" href="/partner">Partner with us <ArrowRight/></Link><Link className="button ghost" href="/partner/login">Partner login</Link></div>
    </div></div></section>

    <section className="trust-strip"><div className="container trust-grid" data-reveal="stagger">
      <div className="trust-item"><span className="trust-icon"><Trophy/></span><div><b>Trusted listings</b><span>Verified badges only after BikeHub checks the business.</span></div></div>
      <div className="trust-item"><span className="trust-icon"><Users/></span><div><b>Rider community</b><span>Connect with passionate riders across India.</span></div></div>
      <div className="trust-item"><span className="trust-icon"><ShieldCheck/></span><div><b>Expert guidance</b><span>Maintenance and safety advice from specialists.</span></div></div>
      <div className="trust-item"><span className="trust-icon"><Milestone/></span><div><b>Ride better</b><span>Routes, events and everything for the road.</span></div></div>
    </div><p className="container trust-signoff" data-reveal>It’s not just a ride. <span>It’s a lifestyle.</span></p></section>
  </main>
}
