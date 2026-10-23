import type {Post} from "@/lib/content";
// Shared with client components, so no server imports here.
export const POST_CATEGORIES=["Ride story","Touring","Maintenance","Riding tips","Expert advice","Community"];
export const ROUTE_LEVELS=["Beginner","Intermediate","Advanced"];
export const COMMUNITY_TOPICS=[
 {value:"rides",label:"Rides",categories:["Ride story","Touring"]},
 {value:"maintenance",label:"Maintenance",categories:["Maintenance"]},
 {value:"tips",label:"Riding tips",categories:["Riding tips","Expert advice"]},
 {value:"stories",label:"Stories",categories:["Ride story","Community"]}
];
/** Filters posts by topic and free text; `sort=quick` puts the shortest reads first. */
export function filterPosts(posts:Post[],{q,topic,sort}:{q?:string;topic?:string;sort?:string}){
 const t=COMMUNITY_TOPICS.find(x=>x.value===topic);const terms=q?.toLowerCase().split(/\s+/).filter(Boolean)||[];
 const list=posts.filter(p=>(!t||t.categories.includes(p.category))&&terms.every(term=>[p.title,p.excerpt,p.category,p.author].join(" ").toLowerCase().includes(term)));
 return sort==="quick"?[...list].sort((a,b)=>parseInt(a.read)-parseInt(b.read)):list;
}
