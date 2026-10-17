import Link from "next/link";
import {Search,MapPin,ArrowRight,ShieldCheck,Settings,IndianRupee,Wrench,MessageCircle} from "lucide-react";
import {services,posts} from "@/lib/data";
import {CentreCard,PostCard,TrustItem,ServiceIcon} from "@/components/ui";
import {getCentres,getListingCounts} from "@/lib/supabase-data";

const popular=["Service centre","Tyre change","Performance tuning","Riding gear fitting","Riding routes","Upcoming rides"];
const miniRoutes=[
  {name:"Delhi → Spiti",distance:"760 km",image:"/images/himalayan-route-generated.jpg"},
  {name:"Manali Loop",distance:"320 km",image:"/images/himalayan-route.jpg"},
  {name:"Leh Ladakh",distance:"1,050 km",image:"/images/community-post-1.jpg"},
  {name:"Valley of Flowers",distance:"540 km",image:"/images/community-post-4.jpg"}
];

export const revalidate=3600;

export default async function Home(){
  const [{items:liveCentres},counts]=await Promise.all([getCentres({},4),getListingCounts()]);
  const countFor=(name:string,fallback:string)=>!counts?fallback:name==="Service & Repair"?`${(counts.service_centre+counts.repair_shop).toLocaleString("en-IN")} listings`:name==="Gear & Accessories"?`${counts.gear_shop.toLocaleString("en-IN")} shops`:fallback;
  return <main className="mockup-home">
    <section className="hero"><div className="container hero-content"><h1>Ride More.<span>Worry Less.</span></h1><p className="hero-copy">India’s trusted platform for premium bikers.<br/>Find the best service centres, expert advice, riding routes, events and a community that rides with you.</p><form action="/services" className="hero-search"><label><MapPin/><input name="location" placeholder="City, e.g. Noida" aria-label="Location"/></label><label><Search/><input name="q" placeholder="Search for services, garages, routes, events, or topics…" aria-label="Search BikeHub"/></label><button className="button">Search</button></form><div className="popular"><b>Popular:</b>{popular.map(x=><Link key={x} href={`/services?q=${encodeURIComponent(x)}`}>{x}</Link>)}</div></div><div className="hero-notes"><span>△ &nbsp; EXPLORE</span><span>● &nbsp; CONNECT</span><span>⚒ &nbsp; MAINTAIN</span><span>◉ &nbsp; RIDE BETTER</span></div></section>

    <section className="home-categories" aria-label="Explore BikeHub"><div className="container category-grid">{services.map(s=><Link className="category" href={s.name.includes("Route")||s.name.includes("Rides")?"/routes":s.name.includes("Advice")?"/community":`/services?q=${encodeURIComponent(s.name)}`} key={s.name}><div className="category-icon"><ServiceIcon name={s.icon}/></div><b>{s.name}</b><small>{s.description}</small>{counts&&countFor(s.name,"")&&<small>{countFor(s.name,"")}</small>}</Link>)}</div></section>

    <div className="container home-body"><section className="home-promos"><article className="promo service-promo"><div><h2>Find Trusted<br/>Service Centres<br/>Near You</h2><p>Service centres, repair shops and riding gear across India.</p><Link className="button" href="/services">Find a Service Centre <ArrowRight/></Link></div><div className="promo-trust"><span><ShieldCheck/>Verified Listings</span><span><Settings/>Rider Reviews</span><span><IndianRupee/>Transparent Pricing</span><span><Wrench/>Premium Specialists</span></div></article><div className="route-promo-wrap"><article className="promo route"><div><h2>Discover<br/>Epic Rides & Routes</h2><p>Scenic routes, weekend getaways and riding stories from across India.</p><Link className="button" href="/routes">Explore Routes <ArrowRight/></Link></div></article><div className="mini-routes">{miniRoutes.map(r=><Link href="/routes" className="mini-route" style={{backgroundImage:`linear-gradient(rgba(2,22,42,.18),rgba(2,22,42,.84)),url('${r.image}')`}} key={r.name}><b>{r.name}</b><span>{r.distance}</span></Link>)}</div></div></section>

    <section className="home-section"><div className="home-heading"><div><h2>Service Centres & Repair Shops</h2><p>Motorcycle specialists across India</p></div><Link className="view-all" href="/services">View All →</Link></div><div className="cards">{liveCentres.slice(0,4).map(c=><CentreCard key={c.slug} centre={c}/>)}</div></section>

    <section className="home-community"><div className="home-heading community-heading"><h2>Latest from Our Community</h2><nav className="community-tabs" aria-label="Community topics"><Link className="active" href="/community">All Posts</Link><Link href="/community?category=rides">Rides</Link><Link href="/community?category=maintenance">Maintenance</Link><Link href="/community?category=modifications">Modifications</Link><Link href="/community?category=stories">Stories</Link></nav><Link className="view-all" href="/community">View All →</Link></div><div className="mockup-community-grid"><div className="post-grid">{posts.slice(0,4).map(p=><PostCard key={p.slug} post={p}/>)}</div><aside className="mockup-join"><h3><MessageCircle/> Join the Conversation</h3><p>Connect with fellow riders, share experiences, get expert advice and be part of India’s premium biking community.</p><Link className="button" href="/community">Join BikeHub <ArrowRight/></Link><div className="mockup-stats"><span><b>50K+</b><small>Riders</small></span><span><b>2K+</b><small>Discussions</small></span><span><b>300+</b><small>Expert Members</small></span></div></aside></div></section></div>

    <section className="trust-strip"><div className="container trust-grid"><TrustItem icon="Trophy" title="Trusted by Riders" text="Verified reviews from real bikers like you."/><TrustItem icon="Users" title="Premium Community" text="Connect with passionate riders across India."/><TrustItem icon="ShieldCheck" title="Expert Guidance" text="Articles, videos and tips from trusted specialists."/><TrustItem icon="Milestone" title="Ride Better" text="Discover routes, events and everything for the road."/></div><p className="trust-signoff">It’s not just a ride.<br/>It’s a lifestyle.</p></section>
  </main>
}
