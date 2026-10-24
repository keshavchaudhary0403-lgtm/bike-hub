import type {Metadata} from "next";import {Finder,type FinderStart} from "@/components/finder";
export const metadata:Metadata={title:"Find the right workshop for your bike",description:"Tell us what your bike needs and which bike you ride. BikeHub shows the workshops that can handle it, near you.",alternates:{canonical:"/find"}};
/** One question per screen: the page itself never needs scrolling. */
export default async function Find({searchParams}:{searchParams:Promise<FinderStart>}){const start=await searchParams;
return <main className="finder-page"><div className="speed-lines" aria-hidden="true"/><div className="container narrow"><p className="eyebrow">Find the right workshop</p><Finder start={start}/></div></main>}
