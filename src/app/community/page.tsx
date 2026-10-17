import type {Metadata} from "next";import {posts} from "@/lib/data";import {PostCard} from "@/components/ui";
export const metadata:Metadata={title:"Community"};
export default function Community(){return <main><section className="page-hero"><div className="container"><h1>Rider knowledge</h1><p>Maintenance guides, ride stories and safety advice. Free to read, no login.</p></div></section><section className="section"><div className="container post-grid">{posts.map(p=><PostCard key={p.slug} post={p}/>)}</div></section></main>}
