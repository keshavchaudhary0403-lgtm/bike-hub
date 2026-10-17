import {createClient} from "@supabase/supabase-js";
import {centres} from "@/lib/data";
import {detectBrand,inferType,listingImage,matchCity,typeLabel,type Listing,type ListingDetail,type ListingType} from "@/lib/listings";

export const PAGE_SIZE=24;
const CARD_FIELDS="slug,name,listing_type,centre_type,locality,city,phone,opening_hours_text,brands";

function publicClient(){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url&&key?createClient(url,key,{auth:{persistSession:false}}):null;
}

type Row={slug:string;name:string;listing_type:ListingType;centre_type:string|null;locality:string|null;city:string;phone:string|null;opening_hours_text:string|null;brands:string[]|null};
function toListing(r:Row):Listing{
  const brands=(r.brands||[]).slice(0,3);
  return {slug:r.slug,name:r.name,listingType:r.listing_type,type:r.centre_type||typeLabel(r.listing_type),location:[r.locality,r.city].filter(Boolean).join(", "),
    image:listingImage(r.listing_type,r.slug),tags:brands.length?brands:[typeLabel(r.listing_type)],brand:detectBrand(r.brands||[],r.name),phone:r.phone,open:r.opening_hours_text};
}
const demoListings=():Listing[]=>centres.map(c=>({...c,listingType:"service_centre" as const}));

export type CentreFilters={q?:string;location?:string;type?:string;status?:string;page?:string|number};

/** Searches active listings. `location` matching a known city filters by city; other text is matched against the listing's search text. */
export async function getCentres(filters:CentreFilters={},limit=PAGE_SIZE):Promise<{items:Listing[];total:number;live:boolean}>{
  const supabase=publicClient();
  if(!supabase){const items=filterDemo(demoListings(),filters);return {items,total:items.length,live:false}}
  const page=Math.max(1,Number(filters.page)||1);
  const type=(["service_centre","repair_shop","gear_shop"].includes(filters.type||"")?filters.type:undefined)||inferType(filters.q);
  const city=matchCity(filters.location);
  let query=supabase.from("service_centres").select(CARD_FIELDS,{count:"exact"}).eq("is_active",true);
  if(type)query=query.eq("listing_type",type);
  if(filters.status==="verified")query=query.eq("verification_status","verified");
  else if(filters.status==="phone")query=query.not("phone","is",null);
  else if(filters.status==="hours")query=query.not("opening_hours_text","is",null);
  if(city)query=query.eq("city",city);
  else if(filters.location?.trim())query=query.ilike("search_text",`%${escapeLike(filters.location.trim().toLowerCase())}%`);
  // Category phrases ("Riding gear fitting") are handled by the type filter; anything else is a text search.
  if(filters.q?.trim()&&!inferType(filters.q)&&!/service\s*(&|and)\s*repair/i.test(filters.q)){
    for(const term of filters.q.toLowerCase().split(/\s+/).filter(t=>t.length>2).slice(0,5))query=query.ilike("search_text",`%${escapeLike(term)}%`);
  }
  const from=(page-1)*limit;
  const {data,count,error}=await query.order("is_featured",{ascending:false}).order("phone",{ascending:true,nullsFirst:false}).order("name").range(from,from+limit-1);
  if(error){console.error("getCentres",error.message);return {items:[],total:0,live:true}}
  return {items:(data as Row[]).map(toListing),total:count||0,live:true};
}

export async function getCentre(slug:string):Promise<ListingDetail|null>{
  const supabase=publicClient();
  if(!supabase){const c=centres.find(x=>x.slug===slug);return c?{...c,listingType:"service_centre",city:c.location.split(",").pop()!.trim(),brands:[],source:"demo",verification:"unverified"}:null}
  const {data:r,error}=await supabase.from("service_centres").select("*").eq("slug",slug).eq("is_active",true).maybeSingle();
  if(error||!r)return null;
  return {...toListing(r as Row),id:r.id,description:r.description,address:r.address_line,locality:r.locality,city:r.city,state:r.state,postalCode:r.postal_code,
    latitude:r.latitude==null?null:Number(r.latitude),longitude:r.longitude==null?null:Number(r.longitude),website:r.website,email:r.email,
    brands:r.brands||[],source:r.source,sourceId:r.source_id,verification:r.verification_status};
}

export async function getNearby(c:ListingDetail,limit=4){
  const supabase=publicClient();if(!supabase)return [];
  const {data}=await supabase.from("service_centres").select(CARD_FIELDS).eq("is_active",true).eq("city",c.city).eq("listing_type",c.listingType).neq("slug",c.slug).order("phone",{ascending:true,nullsFirst:false}).limit(limit);
  return ((data||[]) as Row[]).map(toListing);
}

/** Active listing counts per type, for homepage categories. */
export async function getListingCounts():Promise<Record<ListingType,number>|null>{
  const supabase=publicClient();if(!supabase)return null;
  const types:ListingType[]=["service_centre","repair_shop","gear_shop"];
  const counts=await Promise.all(types.map(t=>supabase.from("service_centres").select("id",{count:"exact",head:true}).eq("is_active",true).eq("listing_type",t)));
  return Object.fromEntries(types.map((t,i)=>[t,counts[i].count||0])) as Record<ListingType,number>;
}

const escapeLike=(s:string)=>s.replace(/[%_\\]/g,m=>"\\"+m);

function filterDemo(items:Listing[],filters:CentreFilters){
  const q=filters.q?.trim().toLowerCase();const location=filters.location?.trim().toLowerCase();
  return items.filter(c=>{
    const haystack=[c.name,c.type,c.location,...c.tags].join(" ").toLowerCase();
    const qMatch=!q||inferType(q)!==undefined||haystack.includes(q)||q.split(/\s+/).some(term=>term.length>3&&haystack.includes(term));
    const locationMatch=!location||c.location.toLowerCase().includes(location)||location.includes(c.location.split(",").pop()?.trim().toLowerCase()||"");
    return qMatch&&locationMatch;
  });
}

export async function getConnectionHealth(){
  const supabase=publicClient();
  if(!supabase)return {connected:false,message:"Supabase environment variables are missing."};
  const {count,error}=await supabase.from("service_centres").select("id",{count:"exact",head:true}).eq("is_active",true);
  return error?{connected:false,message:error.message}:{connected:true,message:"Vercel can reach Supabase.",centreCount:count||0};
}
