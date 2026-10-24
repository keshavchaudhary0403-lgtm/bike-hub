// Matching riders to shops: which shops cover the rider's (bike level, job) cell, in what order,
// and how the search widens when nothing matches. Pure functions: no database access here.
import {LEVEL_INFO,RADIUS_KM,STATUS_RANK,meetsMinimum,levelLine,regionOf,serviceLine,type BikeLevel,type CellStatus,type ServiceLevel,type Skill} from "./config";

/** `source` "osm" = taken from an authorised dealer's OpenStreetMap brand tag, not said by the shop. */
export type Cell={level:BikeLevel;service:ServiceLevel;brands:string[];status:CellStatus;source?:string};
export type Reports={sameModel:number;sameModelAvg:number|null;sameLevel:number;sameLevelAvg:number|null};
export type Shop={id:string;name:string;city:string;lat:number|null;lng:number|null;listingType:string;
  officialBrands:string[];brandExclusive:boolean;skills:string[];cells:Cell[];rating:number|null;ratingCount:number;reports?:Reports};
export type Origin={lat:number;lng:number};
export type MatchQuery={level?:BikeLevel|null;service?:ServiceLevel|null;brand?:string|null;modelName?:string|null;
  warranty?:boolean;skill?:Skill|null;preferRating?:boolean;origin?:Origin|null;city?:string|null};

export type MatchKind="match"|"unverified"|"official";
export type Match={shop:Shop;cell:Cell|null;distance:number|null;kind:MatchKind;official:boolean};
/** How far the search had to widen. null = exact matches close by. */
export type Widened=null|"radius"|"unverified"|"official"|"none";
export type Results={matches:Match[];widened:Widened;unchecked:{shop:Shop;distance:number|null}[]};

const same=(a:string,b:string)=>a.trim().toLowerCase()===b.trim().toLowerCase();

/** Great-circle distance in km. */
export function distanceKm(a:Origin,b:Origin){
  const R=6371,rad=Math.PI/180,dLat=(b.lat-a.lat)*rad,dLng=(b.lng-a.lng)*rad;
  const h=Math.sin(dLat/2)**2+Math.cos(a.lat*rad)*Math.cos(b.lat*rad)*Math.sin(dLng/2)**2;
  return 2*R*Math.asin(Math.sqrt(h));
}
export const formatKm=(km:number)=>km<10?`${km.toFixed(1)} km`:`${Math.round(km)} km`;

/** A cell with no brands covers every brand at its level. */
export const brandFits=(cell:Pick<Cell,"brands">,brand?:string|null)=>!brand||cell.brands.length===0||cell.brands.some(b=>same(b,brand));
/** A brand-exclusive shop (an authorised dealer) is only shown to riders of its own brand. */
export const exclusiveFits=(shop:Pick<Shop,"brandExclusive"|"officialBrands">,brand?:string|null)=>!shop.brandExclusive||(!!brand&&shop.officialBrands.some(b=>same(b,brand)));
export const isOfficialFor=(shop:Pick<Shop,"officialBrands">,brand?:string|null)=>!!brand&&shop.officialBrands.some(b=>same(b,brand));

/** The strongest cell of this shop that fits the query. Unless `includeClaimed`, the cell must meet the minimum status for riders. */
export function bestCell(shop:Shop,q:MatchQuery,includeClaimed=false):Cell|null{
  let best:Cell|null=null;
  for(const c of shop.cells){
    if(q.level&&c.level!==q.level)continue;
    if(q.service&&c.service!==q.service)continue;
    if(!brandFits(c,q.brand))continue;
    if(!includeClaimed&&!meetsMinimum(c.level,c.service,c.status))continue;
    if(!best||STATUS_RANK[c.status]>STATUS_RANK[best.status])best=c;
  }
  return best;
}

/** Ranking: warranty-safe official centres first when the rider is under warranty, then verification strength,
 *  rider reports on the same model then the same level, the rider's speciality, distance, and finally general rating. */
export function compareMatches(q:MatchQuery){
  const num=(v:number|null|undefined)=>v??-1;
  return (a:Match,b:Match)=>{
    if(q.warranty&&a.official!==b.official)return a.official?-1:1;
    const s=(b.cell?STATUS_RANK[b.cell.status]:0)-(a.cell?STATUS_RANK[a.cell.status]:0);if(s)return s;
    if(q.preferRating){const r=num(b.shop.rating)-num(a.shop.rating);if(r)return r}
    const ra=a.shop.reports,rb=b.shop.reports;
    const rep=(rb?.sameModel||0)-(ra?.sameModel||0)||num(rb?.sameModelAvg)-num(ra?.sameModelAvg)||(rb?.sameLevel||0)-(ra?.sameLevel||0)||num(rb?.sameLevelAvg)-num(ra?.sameLevelAvg);if(rep)return rep;
    if(q.skill){const k=Number(b.shop.skills.includes(q.skill))-Number(a.shop.skills.includes(q.skill));if(k)return k}
    if(a.distance!=null||b.distance!=null){if(a.distance==null)return 1;if(b.distance==null)return -1;const d=a.distance-b.distance;if(Math.abs(d)>0.05)return d}
    return num(b.shop.rating)-num(a.shop.rating)||b.shop.ratingCount-a.shop.ratingCount||a.shop.name.localeCompare(b.shop.name);
  };
}

/** Finds shops for the query. Never returns an empty page without saying why: when nothing matches it widens,
 *  in order, to (1) a larger area, (2) shops that only say they can do it, (3) official service centres for the brand. */
export function findMatches(shops:Shop[],q:MatchQuery):Results{
  const withDistance=shops.map(shop=>({shop,distance:q.origin&&shop.lat!=null&&shop.lng!=null?distanceKm(q.origin,{lat:shop.lat,lng:shop.lng}):null}));
  const region=q.city?regionOf(q.city):null;
  const near=(s:Shop,d:number|null)=>d!=null?d<=RADIUS_KM.near:q.city?s.city===q.city:!q.origin;
  const wide=(s:Shop,d:number|null)=>d!=null?d<=RADIUS_KM.wide:region?region.includes(s.city):!q.origin;
  const eligible=withDistance.filter(({shop})=>shop.listingType!=="gear_shop"&&exclusiveFits(shop,q.brand));
  const toMatch=(x:{shop:Shop;distance:number|null},cell:Cell|null,kind:MatchKind):Match=>({...x,cell,kind,official:isOfficialFor(x.shop,q.brand)});
  const pick=(inArea:(s:Shop,d:number|null)=>boolean,includeClaimed:boolean,kind:MatchKind)=>eligible.filter(x=>inArea(x.shop,x.distance)).flatMap(x=>{const c=bestCell(x.shop,q,includeClaimed);return c?[toMatch(x,c,kind)]:[]});

  let widened:Widened=null;
  let matches=pick(near,false,"match");
  if(!matches.length){matches=pick(wide,false,"match");if(matches.length)widened="radius"}
  if(!matches.length){matches=pick(wide,true,"unverified");if(matches.length)widened="unverified"}
  if(!matches.length&&q.brand){matches=eligible.filter(x=>wide(x.shop,x.distance)&&isOfficialFor(x.shop,q.brand)).map(x=>toMatch(x,null,"official"));if(matches.length)widened="official"}
  if(!matches.length)widened="none";
  matches.sort(compareMatches(q));

  // Workshops close by that BikeHub knows nothing about yet: shown below the matches, clearly labelled.
  const shown=new Set(matches.map(m=>m.shop.id));
  const unchecked=eligible.filter(x=>!shown.has(x.shop.id)&&x.shop.cells.length===0&&x.shop.officialBrands.length===0&&near(x.shop,x.distance))
    .sort((a,b)=>(a.distance??1e9)-(b.distance??1e9)||(b.shop.rating??-1)-(a.shop.rating??-1)||a.shop.name.localeCompare(b.shop.name)).slice(0,6);
  return {matches,widened,unchecked};
}

/** Plain-words explanation shown above results when the search had to widen. */
export function widenedNote(w:Widened,q:MatchQuery){
  const where=q.origin?`within ${RADIUS_KM.near} km`:q.city?`in ${q.city}`:"yet";
  switch(w){
    case "radius":return q.origin?`Nothing checked ${where} of you, so we looked further, up to ${RADIUS_KM.wide} km.`:`Nothing checked ${where} yet, so we included nearby cities.`;
    case "unverified":return "BikeHub hasn’t checked a shop for this yet. These shops say they can do it, so call ahead to confirm.";
    case "official":return `We couldn’t find a checked workshop for this yet. These are official ${q.brand} service centres, which work on your bike.`;
    case "none":return "We don’t have a match for this yet. Try a nearby city, or call one of the workshops below.";
    default:return null;
  }
}

/** Up to three plain-language lines for a result card, relevant to what the rider asked for. */
export function matchLines(m:Match,q:MatchQuery):string[]{
  const lines:string[]=[];
  if(m.official&&q.warranty)lines.push("✓ Keeps your warranty safe");
  if(m.cell?.source==="osm"&&m.cell.status==="claimed")lines.push(`Sells and services ${m.cell.brands.join(" & ")||"its brand’s"} bikes (not yet checked by BikeHub)`);
  else if(m.cell){
    if(q.level)lines.push(levelLine(m.cell.level,m.cell.status));
    if(q.service)lines.push(serviceLine(m.cell.service,m.cell.status));
  }
  const r=m.shop.reports;
  if(r?.sameModel&&q.modelName)lines.push(`${r.sameModel} ${q.modelName} ${r.sameModel===1?"owner":"owners"} reviewed`);
  else if(r?.sameLevel&&q.level)lines.push(`${r.sameLevel} ${r.sameLevel===1?"rider":"riders"} with ${LEVEL_INFO[q.level].handles} reviewed`);
  return lines.slice(0,3);
}
