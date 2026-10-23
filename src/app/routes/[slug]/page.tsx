import type {Metadata} from "next";import Image from "next/image";import Link from "next/link";import {notFound} from "next/navigation";import {cache} from "react";import {ArrowRight} from "lucide-react";import {getRoute,getRoutes,paragraphs} from "@/lib/content";import {JsonLd} from "@/components/json-ld";import {RichText} from "@/components/rich-text";import {PUBLISHER,absoluteUrl,snippet} from "@/lib/seo";
const load=cache(getRoute);
export const revalidate=3600;
export async function generateStaticParams(){return (await getRoutes()).map(r=>({slug:r.slug}))}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const r=await load((await params).slug);if(!r)return {title:"Route not found"};const url=`/routes/${r.slug}`;const description=snippet(r.summary||r.description);const title=`${r.name} motorcycle route${r.distance?`: ${r.distance}`:""}`;
  return {title,description,alternates:{canonical:url},openGraph:{type:"article",url,title,description,images:[{url:r.image,alt:r.name}],modifiedTime:r.updatedAt||undefined}}}
export default async function RouteDetail({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const r=await load(slug);if(!r)notFound();
const facts=([[r.distance,"Distance"],[r.duration,"Suggested time"],[r.season,"Best season"]] as const).filter(([v])=>v);const safety=paragraphs(r.safety);
const sources=r.sources||[];
return <main><JsonLd data={{"@type":"TouristTrip",name:r.name,description:snippet(r.summary||r.description,300),url:absoluteUrl(`/routes/${r.slug}`),image:absoluteUrl(r.image),touristType:"Motorcycle riders",provider:PUBLISHER,
  ...(r.start&&r.end?{itinerary:{"@type":"ItemList",itemListElement:[r.start,r.end].map((name,i)=>({"@type":"ListItem",position:i+1,item:{"@type":"Place",name}}))}}:{})}}/><section className="article-hero"><Image src={r.image} alt="" fill priority sizes="100vw"/><div className="container">{r.level&&<span className="chip">{r.level}</span>}<h1>{r.name}</h1><p>{[r.start&&r.end?`${r.start} → ${r.end}`:null,r.distance,r.duration].filter(Boolean).join(" · ")}</p></div></section><section className="section"><article className="container article"><p className="article-deck">{r.summary}</p>{facts.length>0&&<div className="facts">{facts.map(([v,label])=><div className="fact" key={label}><b>{v}</b><span>{label}</span></div>)}</div>}
<RichText text={r.description}/>
<h2>Before you go</h2>{safety.length?<RichText text={safety}/>:<p>Check weather and road advisories, carry essential spares, confirm fuel stops and save service points along the route.</p>}
<p><Link className="link" href="/services">Find service centres on the way <ArrowRight size={16}/></Link></p>
{sources.length>0&&<div className="article-sources"><h2>Sources</h2>{sources.map(s=><a key={s.url} href={s.url} target="_blank" rel="noreferrer">{s.label} ↗</a>)}</div>}</article></section></main>}
