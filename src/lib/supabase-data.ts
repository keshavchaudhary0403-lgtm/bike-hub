import {createClient,type SupabaseClient} from "@supabase/supabase-js";
import {centres} from "@/lib/data";
import {CITIES,inferType,listingImage,matchCity,officialLabel,photoUrl,typeLabel,type Listing,type ListingDetail,type ListingType} from "@/lib/listings";
import {distanceKm,formatKm,type Origin} from "@/lib/matrix/match";

export const PAGE_SIZE=24;
export const CARD_FIELDS="slug,name,listing_type,centre_type,locality,city,phone,opening_hours_text,brands,official_brands,photos,rating_avg,rating_count";

/** Anonymous client: sees only what RLS makes public. */
export function publicClient(){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url&&key?createClient(url,key,{auth:{persistSession:false}}):null;
}

export type CardRow={slug:string;name:string;listing_type:ListingType;centre_type:string|null;locality:string|null;city:string;phone:string|null;opening_hours_text:string|null;brands:string[]|null;official_brands?:string[]|null;photos?:string[]|null;rating_avg?:number|null;rating_count?:number|null};
export function toListing(r:CardRow):Listing{
  const brands=(r.brands||[]).slice(0,3);
  return {slug:r.slug,name:r.name,listingType:r.listing_type,type:r.centre_type||typeLabel(r.listing_type),location:[r.locality,r.city].filter(Boolean).join(", "),
    image:listingImage(r.listing_type,r.slug),tags:brands.length?brands:[typeLabel(r.listing_type)],official:officialLabel(r.official_brands),photo:r.photos?.[0]?photoUrl(r.photos[0]):null,phone:r.phone,open:r.opening_hours_text,rating:r.rating_count?Number(r.rating_avg):undefined,reviews:r.rating_count||0};
}
const demoListings=():Listing[]=>centres.map(c=>({...c,listingType:"service_centre" as const}));

export type CentreFilters={q?:string;location?:string;type?:string;status?:string;page?:string|number};
export type MapPoint={slug:string;name:string;listingType:ListingType;location:string;lat:number;lng:number;rating?:number};

/** Applies the public search filters. `location` matching a known city filters by city; other text is matched against the listing's search text. */
function searchListings(supabase:SupabaseClient,columns:string,filters:CentreFilters,withCount=false){
  let query=supabase.from("service_centres").select(columns,withCount?{count:"exact"}:undefined);
  const type=(["service_centre","repair_shop","gear_shop"].includes(filters.type||"")?filters.type:undefined)||inferType(filters.q);
  const city=matchCity(filters.location);
  query=query.eq("is_active",true).in("city",CITIES);
  if(type)query=query.eq("listing_type",type);
  if(filters.status==="verified")query=query.eq("verification_status","verified");
  else if(filters.status==="phone")query=query.not("phone","is",null);
  else if(filters.status==="hours")query=query.not("opening_hours_text","is",null);
  else if(filters.status==="reviewed")query=query.gt("rating_count",0);
  else if(filters.status==="official")query=query.neq("official_brands","{}");
  if(city)query=query.eq("city",city);
  else if(filters.location?.trim())query=query.ilike("search_text",`%${escapeLike(filters.location.trim().toLowerCase())}%`);
  // Category phrases ("Riding gear fitting") are handled by the type filter; anything else is a text search.
  if(filters.q?.trim()&&!inferType(filters.q)&&!/service\s*(&|and)\s*repair/i.test(filters.q)){
    for(const term of filters.q.toLowerCase().split(/\s+/).filter(t=>t.length>2).slice(0,5))query=query.ilike("search_text",`%${escapeLike(term)}%`);
  }
  return query;
}

/** Searches active listings, one page at a time. With an origin (the rider's location) they come nearest first;
 *  otherwise featured first, then the most reviewed, then by name. */
export async function getCentres(filters:CentreFilters={},limit=PAGE_SIZE,origin?:Origin|null):Promise<{items:Listing[];total:number;live:boolean}>{
  const supabase=publicClient();
  if(!supabase){const items=filterDemo(demoListings(),filters);return {items,total:items.length,live:false}}
  const page=Math.max(1,Number(filters.page)||1);
  const from=(page-1)*limit;
  if(origin){
    // Sort every match by distance here (a few hundred rows at most), then load the cards for this page only.
    const {data,error}=await searchListings(supabase,"slug,latitude,longitude",filters).limit(3000);
    if(error){console.error("getCentres",error.message);return {items:[],total:0,live:true}}
    const rows=(data as unknown as {slug:string;latitude:number|null;longitude:number|null}[]).map(r=>({slug:r.slug,d:r.latitude!=null&&r.longitude!=null?distanceKm(origin,{lat:Number(r.latitude),lng:Number(r.longitude)}):null}))
      .sort((a,b)=>(a.d??1e9)-(b.d??1e9));
    const pageRows=rows.slice(from,from+limit);
    if(!pageRows.length)return {items:[],total:rows.length,live:true};
    const {data:cards}=await supabase.from("service_centres").select(CARD_FIELDS).in("slug",pageRows.map(r=>r.slug));
    const bySlug=new Map(((cards||[]) as unknown as CardRow[]).map(c=>[c.slug,c]));
    return {items:pageRows.flatMap(r=>{const c=bySlug.get(r.slug);return c?[{...toListing(c),distance:r.d!=null?formatKm(r.d):null}]:[]}),total:rows.length,live:true};
  }
  const {data,count,error}=await searchListings(supabase,CARD_FIELDS,filters,true).order("is_featured",{ascending:false}).order("rating_count",{ascending:false}).order("name").range(from,from+limit-1);
  if(error){console.error("getCentres",error.message);return {items:[],total:0,live:true}}
  return {items:(data as unknown as CardRow[]).map(toListing),total:count||0,live:true};
}

/** Every matching listing that has coordinates, for the map view (no paging). */
export async function getMapPoints(filters:CentreFilters={}):Promise<MapPoint[]>{
  const supabase=publicClient();if(!supabase)return [];
  const {data,error}=await searchListings(supabase,"slug,name,listing_type,locality,city,latitude,longitude,rating_avg,rating_count",filters).not("latitude","is",null).not("longitude","is",null).limit(2000);
  if(error){console.error("getMapPoints",error.message);return []}
  type Point={slug:string;name:string;listing_type:ListingType;locality:string|null;city:string;latitude:number;longitude:number;rating_avg:number|null;rating_count:number};
  return ((data||[]) as unknown as Point[]).map(r=>({slug:r.slug,name:r.name,listingType:r.listing_type,location:[r.locality,r.city].filter(Boolean).join(", "),lat:Number(r.latitude),lng:Number(r.longitude),rating:r.rating_count?Number(r.rating_avg):undefined}));
}

export async function getCentre(slug:string):Promise<ListingDetail|null>{
  const supabase=publicClient();
  if(!supabase){const c=centres.find(x=>x.slug===slug);return c?{...c,listingType:"service_centre",city:c.location.split(",").pop()!.trim(),brands:[],officialBrands:[],skills:[],photos:[],source:"demo",verification:"unverified"}:null}
  const {data:r,error}=await supabase.from("service_centres").select("*").eq("slug",slug).eq("is_active",true).in("city",CITIES).maybeSingle();
  if(error||!r)return null;
  return {...toListing(r as CardRow),id:r.id,description:r.description,address:r.address_line,locality:r.locality,city:r.city,state:r.state,postalCode:r.postal_code,
    latitude:r.latitude==null?null:Number(r.latitude),longitude:r.longitude==null?null:Number(r.longitude),website:r.website,email:r.email,
    brands:r.brands||[],officialBrands:r.official_brands||[],skills:r.skills||[],photos:(r.photos||[]).map(photoUrl),source:r.source,sourceId:r.source_id,verification:r.verification_status};
}

export async function getNearby(c:ListingDetail,limit=4){
  const supabase=publicClient();if(!supabase)return [];
  if(c.latitude!=null&&c.longitude!=null){
    const {items}=await getCentres({location:c.city,type:c.listingType},limit+1,{lat:c.latitude,lng:c.longitude});
    return items.filter(i=>i.slug!==c.slug).slice(0,limit);
  }
  const {data}=await supabase.from("service_centres").select(CARD_FIELDS).eq("is_active",true).eq("city",c.city).eq("listing_type",c.listingType).neq("slug",c.slug).order("rating_count",{ascending:false}).order("name").limit(limit);
  return ((data||[]) as CardRow[]).map(toListing);
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
