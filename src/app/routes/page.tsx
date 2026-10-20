import type {Metadata} from "next";import {routes} from "@/lib/data";import {RouteCard} from "@/components/ui";import {PageHero} from "@/components/page-hero";
export const metadata:Metadata={title:"Rides & routes"};
export default function Routes(){return <main><PageHero eyebrow="Rides & events" title="Roads worth riding" intro="Routes across India, with what to know before you leave." image="/images/himalayan-route.jpg"/><section className="section"><div className="container route-grid" data-reveal="stagger">{routes.map(r=><RouteCard key={r.slug} route={r}/>)}</div></section></main>}
