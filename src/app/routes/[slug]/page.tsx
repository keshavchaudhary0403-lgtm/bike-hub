import type {Metadata} from "next";import Image from "next/image";import Link from "next/link";import {notFound} from "next/navigation";import {cache} from "react";import {ArrowRight} from "lucide-react";import {getRoute,getRoutes,paragraphs} from "@/lib/content";
const load=cache(getRoute);
export const revalidate=3600;
export async function generateStaticParams(){return (await getRoutes()).map(r=>({slug:r.slug}))}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const r=await load((await params).slug);return r?{title:r.name,description:r.summary}:{title:"Route not found"}}
export default async function RouteDetail({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const r=await load(slug);if(!r)notFound();
const facts=([[r.distance,"Distance"],[r.duration,"Suggested time"],[r.season,"Best season"]] as const).filter(([v])=>v);const safety=paragraphs(r.safety);
return <main><section className="article-hero"><Image src={r.image} alt="" fill priority sizes="100vw"/><div className="container">{r.level&&<span className="chip">{r.level}</span>}<h1>{r.name}</h1><p>{[r.start&&r.end?`${r.start} → ${r.end}`:null,r.distance,r.duration].filter(Boolean).join(" · ")}</p></div></section><section className="section"><article className="container article"><p className="article-deck">{r.summary}</p>{facts.length>0&&<div className="facts">{facts.map(([v,label])=><div className="fact" key={label}><b>{v}</b><span>{label}</span></div>)}</div>}
{paragraphs(r.description).map((p,i)=><p key={i}>{p}</p>)}
<h2>Before you go</h2>{safety.length?safety.map((p,i)=><p key={i}>{p}</p>):<p>Check weather and road advisories, carry essential spares, confirm fuel stops and save service points along the route.</p>}
<p><Link className="link" href="/services">Find service centres on the way <ArrowRight size={16}/></Link></p></article></section></main>}
