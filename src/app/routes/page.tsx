import type {Metadata} from "next";import {routes} from "@/lib/data";import {RouteCard} from "@/components/ui";
export const metadata:Metadata={title:"Rides & routes"};
export default function Routes(){return <main><section className="page-hero"><div className="container"><h1>Rides & routes</h1><p>Roads worth riding, with what to know before you leave.</p></div></section><section className="section"><div className="container route-grid">{routes.map(r=><RouteCard key={r.slug} route={r}/>)}</div></section></main>}
