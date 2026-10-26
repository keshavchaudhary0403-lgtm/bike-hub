import Image from "next/image";
import Link from "next/link";
import {ArrowRight,ShieldCheck,Phone,Navigation,Send,MessageCircle,Trophy,Users,Milestone,PenLine} from "lucide-react";
import {CentreCard,PostCard} from "@/components/ui";
import {getCentres} from "@/lib/supabase-data";
import {getPosts,getRoutes,getSiteCounts} from "@/lib/content";
import {CITIES,REGION} from "@/lib/listings";
import {COMMUNITY_TOPICS} from "@/lib/community";
import {Hero} from "@/components/hero";
import {JsonLd} from "@/components/json-ld";
import {PUBLISHER,SITE_NAME,SITE_URL} from "@/lib/seo";

export const revalidate=3600;

export default async function Home(){
  const [{items:liveCentres},counts,routes,posts]=await Promise.all([getCentres({},4),getSiteCounts(),getRoutes(),getPosts()]);
  const totalListings=counts?.listings??null;
  // "Guides" means the expert guides listed on /experts, counted from the same data.
  const guides=counts?.expertGuides??posts.filter(p=>p.expert).length;
  return <main>
    <JsonLd data={{"@graph":[{...PUBLISHER,"@id":`${SITE_URL}/#org`},{"@type":"WebSite",name:SITE_NAME,url:SITE_URL,publisher:{"@id":`${SITE_URL}/#org`},
      potentialAction:{"@type":"SearchAction",target:{"@type":"EntryPoint",urlTemplate:`${SITE_URL}/services?q={search_term_string}`},"query-input":"required name=search_term_string"}}]}}/>
    <Hero stats={{listings:totalListings,cities:CITIES.length,routes:counts?.routes??routes.length,guides}}/>

    <nav className="marquee" aria-label="Browse by city"><div className="marquee-track">{[0,1].map(copy=><div key={copy} className="marquee-set" aria-hidden={copy===1||undefined}>{CITIES.map(c=><Link key={c} href={`/services?location=${encodeURIComponent(c)}`} tabIndex={copy===1?-1:undefined}>{c}</Link>)}</div>)}</div></nav>

    <section className="section tight"><div className="container promo-grid" data-reveal="stagger">
      <article className="promo service-promo"><Image src="/images/workshop-generated.jpg" alt="" fill sizes="(max-width:900px) 100vw, 50vw"/><span className="eyebrow">Service & repair</span><h2>Workshops that can handle your bike</h2><p>Tell us your bike and the job. We show the shops that can do it, across {REGION}.</p><Link className="button" href="/find">Find the right workshop <ArrowRight/></Link>
        <div className="promo-features"><span><ShieldCheck/>Matched to your bike</span><span><Phone/>Call in one tap</span><span><Navigation/>Directions</span><span><Send/>Free enquiries</span></div></article>
      <div className="route-promo-wrap"><article className="promo"><Image src="/images/himalayan-route-generated.jpg" alt="" fill sizes="(max-width:900px) 100vw, 50vw"/><span className="eyebrow">Routes</span><h2>Discover epic rides</h2><p>Scenic routes, weekend getaways and riding stories from across India.</p><Link className="button" href="/routes">Explore routes <ArrowRight/></Link></article>
        {routes.length>0&&<div className="mini-routes">{routes.slice(0,4).map(r=><Link href={`/routes/${r.slug}`} className="mini-route" key={r.slug}><Image src={r.image} alt="" fill sizes="160px"/><b>{r.name}</b><span>{r.distance}</span></Link>)}</div>}</div>
    </div></section>

    <div className="road" aria-hidden="true"/>
    <section className="section white"><div className="container">
      <div className="section-head" data-reveal><div><span className="eyebrow">Featured</span><h2>Service centres</h2><p>Motorcycle specialists across {REGION}.</p></div><Link className="link" href="/services">View all <ArrowRight size={16}/></Link></div>
      <div className="cards" data-reveal="stagger">{liveCentres.map(c=><CentreCard key={c.slug} centre={c}/>)}</div>
    </div></section>

    <section className="section soft"><div className="container">
      <div className="section-head" data-reveal><div><span className="eyebrow">Community</span><h2>Latest from riders</h2><p>Ride stories, maintenance and safety advice.</p></div><nav className="topic-tabs" aria-label="Community topics"><Link className="active" href="/community">All posts</Link>{COMMUNITY_TOPICS.map(t=><Link key={t.value} href={`/community?topic=${t.value}`}>{t.label}</Link>)}</nav></div>
      <div className="community-layout" data-reveal="stagger"><div className="post-grid three">{posts.slice(0,3).map(p=><PostCard key={p.slug} post={p}/>)}</div>
        <aside className="join-card"><h3><MessageCircle/> Join the conversation</h3><p>Read rider stories, share what you’ve learned and comment on guides. Free, no account needed.</p><div className="join-actions"><Link className="button" href="/community/share"><PenLine/> Share your story</Link><Link className="button ghost" href="/community">Read stories <ArrowRight/></Link></div>
          <div className="join-stats"><span><b>{totalListings?totalListings.toLocaleString("en-IN"):"—"}</b><small>Listings</small></span><span><b>{CITIES.length}</b><small>Cities</small></span><span><b>{guides.toLocaleString("en-IN")}</b><small>Guides</small></span></div></aside></div>
    </div></section>

    <section className="section soft" style={{paddingTop:0}}><div className="container"><div className="cta-band" data-reveal>
      <div><span className="eyebrow">For workshops & gear stores</span><h2>Own a bike business?</h2><p>Claim your listing, add photos, keep your details right and get enquiries from riders near you.</p></div>
      <div className="actions"><Link className="button" href="/partner">Partner with us <ArrowRight/></Link><Link className="button ghost" href="/partner/login">Partner login</Link></div>
    </div></div></section>

    <section className="trust-strip"><div className="container trust-grid" data-reveal="stagger">
      <div className="trust-item"><span className="trust-icon"><Trophy/></span><div><b>Trusted listings</b><span>Verified badges only after BikeHub checks the business.</span></div></div>
      <div className="trust-item"><span className="trust-icon"><Users/></span><div><b>Rider community</b><span>Connect with passionate riders across India.</span></div></div>
      <div className="trust-item"><span className="trust-icon"><ShieldCheck/></span><div><b>Expert guidance</b><span>Maintenance and safety advice from specialists.</span></div></div>
      <div className="trust-item"><span className="trust-icon"><Milestone/></span><div><b>Ride better</b><span>Routes and everything for the road.</span></div></div>
    </div><p className="container trust-signoff" data-reveal>It’s not just a ride. <span>It’s a lifestyle.</span></p></section>
  </main>
}
