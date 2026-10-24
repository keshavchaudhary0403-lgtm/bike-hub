// Shop type labels, always computed from the shop's cells (its "footprint"), never typed in by hand.
import {SHOP_TYPE_RULES as R,SKILL_INFO,isSkill,meetsMinimum,type BikeLevel,type Skill} from "./config";
import type {Cell} from "./match";

export type ShopTypeKey="official"|"neighbourhood"|"big_bike"|"performance"|"single_skill"|"classic"|"ev";
export type ShopType={key:ShopTypeKey;label:string;brands?:string[];skill?:Skill};

/** Labels for a shop. Only cells riders can see (meeting the minimum status) count, unless `includeClaimed`. */
export function deriveShopTypes(capabilities:Cell[],shop:{officialBrands:string[];skills:string[]},includeClaimed=false):ShopType[]{
  const cells=includeClaimed?capabilities:capabilities.filter(c=>meetsMinimum(c.level,c.service,c.status));
  const types:ShopType[]=[];
  const has=(level:BikeLevel,service:string)=>cells.some(c=>c.level===level&&c.service===service);

  if(shop.officialBrands.length)types.push({key:"official",label:`Official ${shop.officialBrands.join(" & ")} service`,brands:shop.officialBrands});

  // Multi-brand big-bike workshop: a whole L3 or L4 row from routine care to major work, for 2+ brands (empty brands = all).
  const bigRow=(["L3","L4"] as BikeLevel[]).find(level=>R.bigBikeServices.every(s=>has(level,s)));
  if(bigRow){
    const rowCells=cells.filter(c=>c.level===bigRow);
    const allBrands=rowCells.some(c=>c.brands.length===0);
    const brands=new Set(rowCells.flatMap(c=>c.brands));
    if(allBrands||brands.size>=R.bigBikeMinBrands)types.push({key:"big_bike",label:"Multi-brand big-bike workshop"});
  }

  // Performance specialist: performance & specialist work on 2+ bike levels.
  if(new Set(cells.filter(c=>c.service==="S5").map(c=>c.level)).size>=R.performanceMinLevels)types.push({key:"performance",label:"Performance specialist"});

  if(cells.some(c=>c.level==="CLASSIC"&&R.classicServices.includes(c.service)))types.push({key:"classic",label:"Classic & restoration specialist"});
  if(cells.some(c=>c.level==="EV"))types.push({key:"ev",label:"EV specialist"});

  // Single-skill specialist: one speciality tag, and the footprint stays within one service area.
  const skills=shop.skills.filter(isSkill);
  if(skills.length===1&&new Set(cells.map(c=>c.service)).size<=1)types.push({key:"single_skill",label:SKILL_INFO[skills[0]].specialist,skill:skills[0]});

  // Neighbourhood workshop: most of the footprint is routine care and repairs on everyday bikes.
  const everyday=cells.filter(c=>(c.level==="L1"||c.level==="L2")&&(c.service==="S1"||c.service==="S2")).length;
  if(cells.length&&everyday/cells.length>=R.neighbourhoodShare&&!types.some(t=>t.key==="official"||t.key==="single_skill"))types.push({key:"neighbourhood",label:"Neighbourhood workshop"});
  return types;
}
