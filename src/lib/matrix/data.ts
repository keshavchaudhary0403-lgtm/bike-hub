// Loads what the matching code needs: shops in the rider's area with their cells and rider reports.
import {matchCity,nearestCity,type Listing} from "@/lib/listings";
import {CARD_FIELDS,publicClient,toListing,type CardRow} from "@/lib/supabase-data";
import {bikeModel,bikeName,levelForSize,SIZE_BUCKETS,type BikeModel,type SizeBucket} from "@/data/bike-models";
import {LEVEL_INFO,RADIUS_KM,SERVICE_INFO,isBikeLevel,isServiceLevel,isStatus,levelFromSlug,regionOf,serviceFromSlug,type BikeLevel,type ServiceLevel,type Skill} from "./config";
import {isIntent,resolveNeed,type Need} from "./intents";
import {findMatches,formatKm,matchLines,widenedNote,type Cell,type MatchQuery,type Origin,type Shop,type Widened} from "./match";
import {parseQuery} from "./search";

export type Params=Record<string,string|undefined>;
/** Everything the results page knows about the rider's request. */
export type RiderContext={need:Need|null;service:ServiceLevel|null;skill:Skill|null;preferRating:boolean;touringKit:boolean;summary:string|null;
  model:BikeModel|null;brand:string|null;level:BikeLevel|null;bikeLabel:string|null;warranty:boolean;
  city:string|null;area:string|null;origin:Origin|null;originLabel:string|null;gear:boolean;leftover:string};

const num=(v?:string)=>{const n=Number(v);return v&&Number.isFinite(n)?n:null};

/** Reads the request from the URL. Explicit choices (tiles, bike picker, filters) win over words typed in the search box. */
export function readContext(p:Params):RiderContext{
  const parsed=parseQuery(p.q);
  const need:Need|null=isIntent(p.need)?{intent:p.need,option:p.opt,symptom:p.sym,ride:p.ride,service:isServiceLevel(p.svc)?p.svc:null}:parsed.need;
  const model=bikeModel(p.bike)??(p.brand?null:parsed.model);
  const brand=model?.brand??p.brand??parsed.brand??null;
  const size=SIZE_BUCKETS.some(b=>b.id===p.size)?p.size as SizeBucket:null;
  const browseLevel=levelFromSlug(p.class);
  let level:BikeLevel|null=browseLevel??model?.level??(brand&&size?levelForSize(brand,size):null);
  const resolved=need?resolveNeed(need,{fuel:model?.fuel??null,level}):null;
  if(resolved?.level)level=resolved.level;
  const service=serviceFromSlug(p.job)??resolved?.service??null;
  const bikeLabel=model?bikeName(model):brand&&level?`${brand} (${LEVEL_INFO[level].handles})`:brand??(level?LEVEL_INFO[level].name:null);
  const city=matchCity(p.location)??parsed.city??null;
  const lat=num(p.lat),lng=num(p.lng);
  let origin=lat!=null&&lng!=null&&Math.abs(lat)<=90&&Math.abs(lng)<=180?{lat,lng}:null;
  // A city typed after sharing a location wins: the old position belongs to somewhere else.
  if(origin&&city&&nearestCity(origin)&&nearestCity(origin)!==city)origin=null;
  const area=p.area?.trim().slice(0,60)||null;
  return {need,service,skill:resolved?.skill??null,preferRating:!!resolved?.preferRating,touringKit:!!resolved?.touringKit,
    summary:resolved?.summary??(service?SERVICE_INFO[service].name:null),model,brand,level,bikeLabel,warranty:p.warranty==="1",
    city,area,origin,originLabel:origin?(area||(city?`near you in ${city}`:"near you")):area&&city?`${area}, ${city}`:city,gear:parsed.gear||need?.intent==="gear",leftover:parsed.leftover};
}
/** Matrix results apply when the rider told us a job or a kind of bike. */
export const isMatrixRequest=(c:RiderContext)=>!c.gear&&!!(c.service||c.level);

export type CardView={listing:Listing;lines:string[];kind:"match"|"unverified"|"official"|"unchecked"};
export type MatrixView={best:CardView[];rest:CardView[];unchecked:CardView[];widened:Widened;note:string|null;total:number};

type ShopRow=CardRow&{id:string;latitude:number|null;longitude:number|null;brand_exclusive:boolean;skills:string[]|null;shop_capabilities:{bike_level:string;service_level:string;brands:string[];status:string;source?:string}[]|null};
const toCells=(rows:ShopRow["shop_capabilities"]):Cell[]=>(rows||[]).flatMap(c=>isBikeLevel(c.bike_level)&&isServiceLevel(c.service_level)&&isStatus(c.status)?[{level:c.bike_level,service:c.service_level,brands:c.brands||[],status:c.status,source:c.source}]:[]);

/** A rough centre for an area name typed by the rider ("Sector 62"), from our own listings there. No geocoding service needed. */
async function areaOrigin(city:string,area:string):Promise<Origin|null>{
  const supabase=publicClient();if(!supabase)return null;
  const {data}=await supabase.from("service_centres").select("latitude,longitude").eq("city",city).ilike("search_text",`%${area.toLowerCase().replace(/[%_\\]/g,"")}%`).not("latitude","is",null).limit(50);
  if(!data?.length)return null;
  return {lat:data.reduce((s,r)=>s+Number(r.latitude),0)/data.length,lng:data.reduce((s,r)=>s+Number(r.longitude),0)/data.length};
}

export async function getMatrixView(ctx:RiderContext):Promise<MatrixView|null>{
  const supabase=publicClient();if(!supabase)return null;
  const origin=ctx.origin??(ctx.city&&ctx.area?await areaOrigin(ctx.city,ctx.area):null);
  let query=supabase.from("service_centres").select(`${CARD_FIELDS},id,latitude,longitude,brand_exclusive,skills,shop_capabilities(bike_level,service_level,brands,status,source)`).eq("is_active",true).neq("listing_type","gear_shop");
  const cities=ctx.city?regionOf(ctx.city):[];
  if(origin){
    const dLat=RADIUS_KM.wide/111,dLng=RADIUS_KM.wide/(111*Math.cos(origin.lat*Math.PI/180));
    const box=`and(latitude.gte.${origin.lat-dLat},latitude.lte.${origin.lat+dLat},longitude.gte.${origin.lng-dLng},longitude.lte.${origin.lng+dLng})`;
    query=cities.length?query.or(`${box},city.in.(${cities.map(c=>`"${c}"`).join(",")})`):query.or(box);
  }else if(cities.length)query=query.in("city",cities);
  const {data,error}=await query.limit(3000);
  if(error){console.error("getMatrixView",error.message);return null}
  const rows=(data||[]) as unknown as ShopRow[];

  // Rider reports for this job: same model first, then same kind of bike.
  const withCells=rows.filter(r=>r.shop_capabilities?.length).map(r=>r.id);
  const reports=new Map<string,{model:number[];level:number[]}>();
  if(withCells.length&&(ctx.service||ctx.level)){
    let rq=supabase.from("reviews").select("centre_id,bike_model_id,bike_level,overall_rating").eq("status","published").in("centre_id",withCells.slice(0,300));
    if(ctx.service)rq=rq.eq("service_level",ctx.service);
    if(ctx.level)rq=rq.eq("bike_level",ctx.level);
    const {data:revs}=await rq;
    for(const r of revs||[]){const e=reports.get(r.centre_id)||{model:[],level:[]};if(ctx.model&&r.bike_model_id===ctx.model.id)e.model.push(r.overall_rating);e.level.push(r.overall_rating);reports.set(r.centre_id,e)}
  }
  const avg=(a:number[])=>a.length?a.reduce((x,y)=>x+y,0)/a.length:null;
  const shops:Shop[]=rows.map(r=>{const rep=reports.get(r.id);return {id:r.id,name:r.name,city:r.city,lat:r.latitude==null?null:Number(r.latitude),lng:r.longitude==null?null:Number(r.longitude),
    listingType:r.listing_type,officialBrands:r.official_brands||[],brandExclusive:r.brand_exclusive,skills:r.skills||[],cells:toCells(r.shop_capabilities),
    rating:r.rating_count?Number(r.rating_avg):null,ratingCount:r.rating_count||0,
    reports:rep?{sameModel:rep.model.length,sameModelAvg:avg(rep.model),sameLevel:rep.level.length,sameLevelAvg:avg(rep.level)}:undefined}});
  const byId=new Map(rows.map(r=>[r.id,r]));

  const q:MatchQuery={level:ctx.level,service:ctx.service,brand:ctx.brand,modelName:ctx.model?.model??null,warranty:ctx.warranty,skill:ctx.skill,preferRating:ctx.preferRating,origin,city:ctx.city};
  const res=findMatches(shops,q);
  const card=(id:string,distance:number|null,lines:string[],kind:CardView["kind"]):CardView=>({listing:{...toListing(byId.get(id)!),distance:distance!=null?formatKm(distance):null},lines,kind});
  const views=res.matches.map(m=>card(m.shop.id,m.distance,matchLines(m,q),m.kind));
  return {best:views.slice(0,3),rest:views.slice(3),unchecked:res.unchecked.map(u=>card(u.shop.id,u.distance,["BikeHub hasn’t checked what bikes they handle yet"],"unchecked")),
    widened:res.widened,note:widenedNote(res.widened,{...q,city:ctx.city}),total:views.length};
}

/** A shop's cells for its listing page. */
export async function getShopCells(shopId:string):Promise<Cell[]>{
  const supabase=publicClient();if(!supabase)return [];
  const {data}=await supabase.from("shop_capabilities").select("bike_level,service_level,brands,status").eq("shop_id",shopId);
  return toCells(data as ShopRow["shop_capabilities"]);
}
