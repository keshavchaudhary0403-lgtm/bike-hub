import type {Metadata} from "next";import Link from "next/link";import {Suspense} from "react";import {CentreCard} from "@/components/ui";import {PageHero} from "@/components/page-hero";import {ArrowRight,Info,List,Map as MapIcon} from "lucide-react";import {ListingsMap} from "@/components/listings-map";import {BikeBar} from "@/components/bike-bar";import {getCentres,getMapPoints,PAGE_SIZE} from "@/lib/supabase-data";import {CITIES,LISTING_TYPES,matchCity} from "@/lib/listings";
import {getMatrixView,isMatrixRequest,readContext,type CardView,type Params,type RiderContext} from "@/lib/matrix/data";
import {BIKE_LEVELS,LEVEL_INFO,LEVEL_SLUGS,SERVICE_INFO,SERVICE_LEVELS,SERVICE_SLUGS} from "@/lib/matrix/config";
export const metadata:Metadata={title:"Service centres, repair shops & riding gear",description:"Find motorcycle service centres, repair workshops and riding-gear shops across India's major cities."};

const KEEP=["bike","brand","size","warranty","lat","lng","area"] as const;
const Cards=({items}:{items:CardView[]})=><div className="cards" data-reveal="stagger">{items.map(v=><CentreCard key={v.listing.slug} centre={v.listing} lines={v.lines} kind={v.kind}/>)}</div>;

function FilterBar({p,ctx,isMap}:{p:Params;ctx:RiderContext;isMap:boolean}){
  const classDefault=p.class||(ctx.level&&!p.bike&&!p.brand?LEVEL_SLUGS[ctx.level]:"");
  return <form className="filterbar matrix-filters" role="search">
    <input name="q" defaultValue={p.q} placeholder="Shop name, job or bike, e.g. Duke 390 service" aria-label="Search"/>
    <input name="location" defaultValue={p.location} list="city-list" placeholder="City" aria-label="City"/><datalist id="city-list">{CITIES.map(c=><option key={c} value={c}/>)}</datalist>
    <select name="class" aria-label="Bike type" defaultValue={classDefault}><option value="">Any bike type</option>{BIKE_LEVELS.map(l=><option key={l} value={LEVEL_SLUGS[l]}>{LEVEL_INFO[l].name}</option>)}</select>
    <select name="job" aria-label="Job" defaultValue={ctx.service?SERVICE_SLUGS[ctx.service]:""}><option value="">Any job</option>{SERVICE_LEVELS.map(s=><option key={s} value={SERVICE_SLUGS[s]}>{SERVICE_INFO[s].name}</option>)}</select>
    <select name="type" aria-label="Listing type" defaultValue={p.type||""}><option value="">All listings</option>{LISTING_TYPES.map(t=><option key={t.value} value={t.value}>{t.plural}</option>)}</select>
    <select name="status" aria-label="Show only" defaultValue={p.status||""}><option value="">Any listing</option><option value="official">Official service centres</option><option value="phone">Has phone number</option><option value="hours">Opening hours listed</option><option value="reviewed">Has reviews</option></select>
    {KEEP.map(k=>p[k]?<input key={k} type="hidden" name={k} value={p[k]}/>:null)}
    {isMap&&<input type="hidden" name="view" value="map"/>}<button className="button dark">Search</button></form>;
}

export default async function Services({searchParams}:{searchParams:Promise<Params>}){const p=await searchParams;const ctx=readContext(p);
if(isMatrixRequest(ctx)&&p.view!=="map"){const view=await getMatrixView(ctx);return <MatrixResults p={p} ctx={ctx} view={view}/>}
const isMap=p.view==="map";
// Gear words ("helmet near me") go to gear shops; a typed city becomes the location.
const filters={...p,type:p.type||(ctx.gear?"gear_shop":undefined),q:ctx.gear?ctx.leftover:p.q,location:p.location||(ctx.city&&!p.location?ctx.city:undefined)};
if(ctx.city&&p.q&&!p.location)filters.q=ctx.leftover||undefined;
const [{items,total,live},points]=await Promise.all([getCentres(filters,PAGE_SIZE,ctx.origin),isMap?getMapPoints(filters):[]]);const page=Math.max(1,Number(p.page)||1);const pages=Math.ceil(total/PAGE_SIZE);const city=matchCity(filters.location);const href=(n:number)=>`/services?${new URLSearchParams({...p,page:String(n)} as Record<string,string>)}`;
const {page:_page,view:_view,...rest}=p;const viewHref=(view?:string)=>`/services?${new URLSearchParams({...rest,...(view?{view}:{})} as Record<string,string>)}`;
return <main><PageHero overlap eyebrow={`${CITIES.length} cities`} title="Find motorcycle services" intro="Service centres, repair shops and riding gear across India." image="/images/workshop.jpg"/><section className="section" style={{paddingTop:0}}><div className="container">
<FilterBar p={p} ctx={ctx} isMap={isMap}/>
<Suspense><BikeBar/></Suspense>
<p className="finder-cta"><Link className="link" href="/find">Not sure where to go? Tell us what your bike needs <ArrowRight size={15}/></Link></p>
<div className="results-bar">{live?<p className="results-count"><b>{total.toLocaleString("en-IN")}</b> {total===1?"listing":"listings"}{city?` in ${city}`:""}{ctx.origin?", nearest first":""}</p>:<span/>}{live&&<nav className="view-toggle" aria-label="View"><Link href={viewHref()} aria-current={!isMap?"page":undefined}><List/> List</Link><Link href={viewHref("map")} aria-current={isMap?"page":undefined}><MapIcon/> Map</Link></nav>}</div>
{isMap?<ListingsMap points={points}/>:<>{items.length?<div className="cards" data-reveal="stagger">{items.map(c=><CentreCard key={c.slug} centre={c}/>)}</div>:<div className="panel empty-state"><h2>No matches</h2><p className="muted">Try a broader search or another city.</p></div>}
{pages>1&&<nav className="pagination" aria-label="Pages">{page>1&&<Link className="button secondary small" href={href(page-1)}>← Previous</Link>}<span>Page {page} of {pages}</span>{page<pages&&<Link className="button secondary small" href={href(page+1)}>Next →</Link>}</nav>}</>}
</div></section></main>}

function MatrixResults({p,ctx,view}:{p:Params;ctx:RiderContext;view:Awaited<ReturnType<typeof getMatrixView>>}){
  const what=ctx.summary||"Workshops";const forBike=ctx.model||ctx.brand?` for your ${ctx.bikeLabel}`:ctx.level?` for ${LEVEL_INFO[ctx.level].handles}`:"";
  const where=ctx.originLabel?` ${ctx.originLabel.startsWith("near")?ctx.originLabel:`in ${ctx.originLabel}`}`:"";
  const changeNeed=ctx.need?`/find?need=${ctx.need.intent}`:"/find";
  const mapParams=new URLSearchParams({...(ctx.city?{location:ctx.city}:{}),view:"map"});
  return <main><PageHero overlap compact eyebrow="Matches for your bike" title={<>{what}{forBike}</>} intro={<>{where?`Shops${where}.`:"Shops across India."} <Link className="link" href={changeNeed}>Change what you need</Link></>}/>
  <section className="section" style={{paddingTop:0}}><div className="container">
    <details className="refine"><summary className="button secondary small">Refine results</summary><FilterBar p={p} ctx={ctx} isMap={false}/></details>
    <Suspense><BikeBar label={ctx.bikeLabel}/></Suspense>
    {!view?<div className="panel empty-state"><h2>Matches aren’t available right now</h2><p className="muted">Please try again in a moment, or <Link className="link" href="/services">browse all listings</Link>.</p></div>:<>
      {view.note&&<p className="widen-note" role="status"><Info aria-hidden="true"/>{view.note}</p>}
      {view.best.length>0&&<><div className="section-head compact"><h2>{view.widened==="official"?`Official ${ctx.brand} service centres`:view.widened==="unverified"?"Shops that say they can help":"Best matches for your bike"}</h2>{view.total>0&&<p className="muted">{view.total} {view.total===1?"shop":"shops"}</p>}</div><Cards items={view.best}/></>}
      {view.rest.length>0&&<details className="see-all"><summary className="button secondary">See all {view.total} matches</summary><Cards items={view.rest}/></details>}
      {ctx.touringKit&&<p className="finder-cta"><Link className="link" href={`/services?type=gear_shop${ctx.city?`&location=${encodeURIComponent(ctx.city)}`:""}`}>Touring kit: luggage, crash guards and riding gear shops <ArrowRight size={15}/></Link></p>}
      {view.unchecked.length>0&&<><div className="section-head compact"><div><h2>Nearby, not yet checked</h2><p className="muted">These workshops are close by, but BikeHub hasn’t checked what bikes they handle yet. Call to ask about your bike.</p></div></div><Cards items={view.unchecked}/></>}
      <p className="finder-cta"><Link className="link" href={`/services?${mapParams}`}>See every listing on the map <ArrowRight size={15}/></Link></p>
    </>}
  </div></section></main>;
}
