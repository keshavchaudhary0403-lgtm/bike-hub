import type {Metadata} from "next";import {Finder,type FinderStart} from "@/components/finder";import {PageHero} from "@/components/page-hero";
export const metadata:Metadata={title:"Find the right workshop for your bike",description:"Tell us what your bike needs and which bike you ride. BikeHub shows the workshops that can handle it, near you.",alternates:{canonical:"/find"}};
export default async function Find({searchParams}:{searchParams:Promise<FinderStart>}){const start=await searchParams;
return <main><PageHero overlap eyebrow="Find the right workshop" title="Find a shop that can handle your bike" intro="Three quick questions. No account needed."/>
<section className="section" style={{paddingTop:0}}><div className="container narrow"><Finder start={start}/></div></section></main>}
