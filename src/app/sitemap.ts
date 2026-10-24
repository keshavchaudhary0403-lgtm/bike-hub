import type {MetadataRoute} from "next";import {getPosts,getRoutes} from "@/lib/content";import {publicClient} from "@/lib/supabase-data";import {SITE_URL} from "@/lib/seo";
export const revalidate=3600;
/** Every public page: fixed pages, routes, articles and active listings. */
export default async function sitemap():Promise<MetadataRoute.Sitemap>{
  const page=(path:string,changeFrequency:"daily"|"weekly"|"monthly",priority:number,lastModified?:string|null)=>({url:`${SITE_URL}${path}`,changeFrequency,priority,...(lastModified?{lastModified}:{})});
  const fixed=[page("/","daily",1),page("/services","daily",.9),page("/find","monthly",.8),page("/routes","weekly",.8),page("/community","daily",.8),page("/experts","weekly",.7),page("/community/share","monthly",.4),page("/partner","monthly",.5),page("/about","monthly",.4),page("/contact","monthly",.3),page("/trust","monthly",.3)];
  const [routes,posts,listings]=await Promise.all([getRoutes(),getPosts(),listingSlugs()]);
  return [...fixed,...routes.map(r=>page(`/routes/${r.slug}`,"monthly",.7,r.updatedAt)),...posts.map(p=>page(`/community/${p.slug}`,"monthly",.7,p.updatedAt||p.publishedAt)),...listings.map(l=>page(`/services/${l.slug}`,"weekly",.6,l.updated_at))];
}
/** All active listing slugs, read 1,000 at a time (the API's page limit). */
async function listingSlugs(){
  const supabase=publicClient();if(!supabase)return [];
  const all:{slug:string;updated_at:string|null}[]=[];
  for(let from=0;from<50000;from+=1000){
    const {data,error}=await supabase.from("service_centres").select("slug,updated_at").eq("is_active",true).order("slug").range(from,from+999);
    if(error||!data?.length)break;all.push(...data);if(data.length<1000)break;
  }
  return all;
}
