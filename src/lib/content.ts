// Routes, articles, comments and reviews, read with the public client so only published rows come back.
// Without Supabase the launch content in data.ts is shown instead.
import {posts as demoPosts,routes as demoRoutes} from "@/lib/data";
import {publicClient} from "@/lib/supabase-data";

export type Route={id?:string;slug:string;name:string;distance:string;duration:string;level:string;image:string;season:string;summary:string;description?:string|null;start?:string|null;end?:string|null;safety?:string|null};
export type Source={label:string;url:string};
export type Post={id?:string;slug:string;category:string;title:string;author:string;read:string;image:string;excerpt:string;body:string[];sources:Source[];expert:boolean;publishedAt?:string|null};
export type Comment={id:string;name:string;body:string;createdAt:string};
export type Review={id:string;name:string;rating:number;body:string|null;service:string|null;createdAt:string};

const FALLBACK_IMAGE="/images/himalayan-route.jpg";

/** Blank-line separated text → paragraphs. */
export const paragraphs=(text:string|null|undefined)=>(text||"").split(/\n\s*\n/).map(p=>p.trim()).filter(Boolean);
/** About 200 words a minute, never less than a minute. */
export const readTime=(text:string)=>`${Math.max(1,Math.round(text.split(/\s+/).filter(Boolean).length/200))} min`;

type RouteRow={id:string;slug:string;name:string;summary:string|null;description:string|null;start_location:string|null;end_location:string|null;distance_km:number|null;duration_text:string|null;difficulty:string|null;best_season:string|null;safety_notes:string|null;hero_image_url:string|null};
const ROUTE_FIELDS="id,slug,name,summary,description,start_location,end_location,distance_km,duration_text,difficulty,best_season,safety_notes,hero_image_url";
const toRoute=(r:RouteRow):Route=>({id:r.id,slug:r.slug,name:r.name,distance:r.distance_km?`${r.distance_km.toLocaleString("en-IN")} km`:"",duration:r.duration_text||"",level:r.difficulty||"",
  image:r.hero_image_url||FALLBACK_IMAGE,season:r.best_season||"",summary:r.summary||"",description:r.description,start:r.start_location,end:r.end_location,safety:r.safety_notes});

type PostRow={id:string;slug:string;title:string;category:string;excerpt:string|null;body:string;hero_image_url:string|null;author_name:string|null;sources:Source[]|null;is_expert_content:boolean;published_at:string|null};
const POST_FIELDS="id,slug,title,category,excerpt,body,hero_image_url,author_name,sources,is_expert_content,published_at";
const toPost=(p:PostRow):Post=>({id:p.id,slug:p.slug,category:p.category,title:p.title,author:p.author_name||"Team BikeHub",read:readTime(p.body),image:p.hero_image_url||FALLBACK_IMAGE,
  excerpt:p.excerpt||"",body:paragraphs(p.body),sources:Array.isArray(p.sources)?p.sources:[],expert:p.is_expert_content,publishedAt:p.published_at});
const demoPost=(p:(typeof demoPosts)[number]):Post=>({...p,read:readTime(p.body.join(" ")),expert:p.category!=="Ride story"});

export async function getRoutes():Promise<Route[]>{
  const supabase=publicClient();if(!supabase)return demoRoutes;
  const {data,error}=await supabase.from("routes").select(ROUTE_FIELDS).order("is_featured",{ascending:false}).order("created_at");
  if(error){console.error("getRoutes",error.message);return []}
  return (data as RouteRow[]).map(toRoute);
}
export async function getRoute(slug:string):Promise<Route|null>{
  const supabase=publicClient();if(!supabase)return demoRoutes.find(r=>r.slug===slug)||null;
  const {data}=await supabase.from("routes").select(ROUTE_FIELDS).eq("slug",slug).maybeSingle();
  return data?toRoute(data as RouteRow):null;
}

export async function getPosts():Promise<Post[]>{
  const supabase=publicClient();if(!supabase)return demoPosts.map(demoPost);
  const {data,error}=await supabase.from("posts").select(POST_FIELDS).order("published_at",{ascending:false,nullsFirst:false}).limit(300);
  if(error){console.error("getPosts",error.message);return []}
  return (data as PostRow[]).map(toPost);
}
export async function getPost(slug:string):Promise<Post|null>{
  const supabase=publicClient();if(!supabase){const p=demoPosts.find(x=>x.slug===slug);return p?demoPost(p):null}
  const {data}=await supabase.from("posts").select(POST_FIELDS).eq("slug",slug).maybeSingle();
  return data?toPost(data as PostRow):null;
}

export async function getComments(postId:string):Promise<Comment[]>{
  const supabase=publicClient();if(!supabase)return [];
  const {data}=await supabase.from("comments").select("id,display_name,body,created_at").eq("post_id",postId).order("created_at");
  return (data||[]).map(c=>({id:c.id,name:c.display_name,body:c.body,createdAt:c.created_at}));
}
export async function getReviews(centreId:string):Promise<Review[]>{
  const supabase=publicClient();if(!supabase)return [];
  const {data}=await supabase.from("reviews").select("id,reviewer_name,overall_rating,body,service_used,created_at").eq("centre_id",centreId).order("created_at",{ascending:false}).limit(50);
  return (data||[]).map(r=>({id:r.id,name:r.reviewer_name,rating:r.overall_rating,body:r.body,service:r.service_used,createdAt:r.created_at}));
}

export type SiteCounts={serviceCentres:number;repairShops:number;gearShops:number;listings:number;routes:number;guides:number;expertGuides:number;reviews:number};
/** Live totals for the homepage. Null without Supabase, so nothing made-up is shown. */
export async function getSiteCounts():Promise<SiteCounts|null>{
  const supabase=publicClient();if(!supabase)return null;
  const centres=(type:string)=>supabase.from("service_centres").select("id",{count:"exact",head:true}).eq("is_active",true).eq("listing_type",type).then(r=>r.count||0);
  const count=(table:string)=>supabase.from(table).select("id",{count:"exact",head:true}).then(r=>r.count||0);
  const [serviceCentres,repairShops,gearShops,routes,guides,expertGuides,reviews]=await Promise.all([centres("service_centre"),centres("repair_shop"),centres("gear_shop"),
    count("routes"),count("posts"),supabase.from("posts").select("id",{count:"exact",head:true}).eq("is_expert_content",true).then(r=>r.count||0),count("reviews")]);
  return {serviceCentres,repairShops,gearShops,listings:serviceCentres+repairShops+gearShops,routes,guides,expertGuides,reviews};
}
