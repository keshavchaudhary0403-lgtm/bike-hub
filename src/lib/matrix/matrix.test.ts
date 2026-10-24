import {describe,expect,it} from "vitest";
import {BIKE_LEVELS,MIN_STATUS,SERVICE_LEVELS,meetsMinimum,type BikeLevel,type CellStatus,type ServiceLevel} from "./config";
import {bestCell,compareMatches,distanceKm,findMatches,matchLines,widenedNote,type Cell,type Match,type Shop} from "./match";
import {deriveShopTypes} from "./shop-types";
import {resolveNeed,symptomService} from "./intents";
import {evaluateCell} from "./proven";
import {parseQuery} from "./search";
import {BIKE_MODELS,bikeModel,findModelInText,levelForSize} from "@/data/bike-models";

const cell=(level:BikeLevel,service:ServiceLevel,status:CellStatus="visited",brands:string[]=[]):Cell=>({level,service,status,brands});
let n=0;
const shop=(o:Partial<Shop>={}):Shop=>({id:`s${++n}`,name:`Shop ${n}`,city:"Noida",lat:null,lng:null,listingType:"repair_shop",officialBrands:[],brandExclusive:false,skills:[],cells:[],rating:null,ratingCount:0,...o});
const NOIDA={lat:28.57,lng:77.32};

describe("minimum status table",()=>{
  it("covers every cell",()=>{for(const l of BIKE_LEVELS)for(const s of SERVICE_LEVELS)expect(MIN_STATUS[l][s]).toBeTruthy()});
  it("lets claims show only for everyday routine work and repairs",()=>{
    expect(meetsMinimum("L1","S1","claimed")).toBe(true);
    expect(meetsMinimum("L2","S2","claimed")).toBe(true);
    expect(meetsMinimum("CLASSIC","S2","claimed")).toBe(true);
    expect(meetsMinimum("L1","S3","claimed")).toBe(false);
    expect(meetsMinimum("L3","S1","claimed")).toBe(false);
    expect(meetsMinimum("EV","S1","claimed")).toBe(false);
    expect(meetsMinimum("L4","S5","visited")).toBe(true);
    expect(meetsMinimum("L4","S5","proven")).toBe(true);
  });
  it("hides claimed big-bike cells from riders but keeps them for the fallback",()=>{
    const s=shop({cells:[cell("L3","S3","claimed")]});
    expect(bestCell(s,{level:"L3",service:"S3"})).toBeNull();
    expect(bestCell(s,{level:"L3",service:"S3"},true)?.status).toBe("claimed");
  });
  it("respects brands on a cell and brand-exclusive dealers",()=>{
    const ktmOnly=shop({cells:[cell("L2","S3","visited",["KTM"])]});
    expect(bestCell(ktmOnly,{level:"L2",service:"S3",brand:"KTM"})).not.toBeNull();
    expect(bestCell(ktmOnly,{level:"L2",service:"S3",brand:"Triumph"})).toBeNull();
    const dealer=shop({officialBrands:["Honda"],brandExclusive:true,cells:[cell("L1","S1","claimed",["Honda"])]});
    expect(findMatches([dealer],{level:"L1",service:"S1",brand:"Yamaha"}).matches).toHaveLength(0);
    expect(findMatches([dealer],{level:"L1",service:"S1",brand:"Honda"}).matches).toHaveLength(1);
  });
});

describe("ranking",()=>{
  it("orders proven > visited > claimed, then reports on the same model, then distance",()=>{
    const q={level:"L2" as const,service:"S1" as const,origin:NOIDA};
    const near=shop({name:"Near",lat:28.571,lng:77.321,cells:[cell("L2","S1","claimed")]});
    const visited=shop({name:"Visited",lat:28.6,lng:77.35,cells:[cell("L2","S1","visited")]});
    const proven=shop({name:"Proven",lat:28.62,lng:77.36,cells:[cell("L2","S1","proven")]});
    const reviewed=shop({name:"Reviewed",lat:28.63,lng:77.37,cells:[cell("L2","S1","visited")],reports:{sameModel:4,sameModelAvg:4.5,sameLevel:6,sameLevelAvg:4.4}});
    const names=findMatches([near,visited,proven,reviewed],q).matches.map(m=>m.shop.name);
    expect(names).toEqual(["Proven","Reviewed","Visited","Near"]);
  });
  it("puts official centres first for riders under warranty",()=>{
    const q={level:"L2" as const,service:"S1" as const,brand:"KTM",warranty:true};
    const official=shop({name:"KTM dealer",officialBrands:["KTM"],brandExclusive:true,cells:[cell("L2","S1","claimed",["KTM"])]});
    const proven=shop({name:"Proven",cells:[cell("L2","S1","proven")]});
    expect(findMatches([proven,official],q).matches.map(m=>m.shop.name)).toEqual(["KTM dealer","Proven"]);
    expect(findMatches([proven,official],{...q,warranty:false}).matches.map(m=>m.shop.name)).toEqual(["Proven","KTM dealer"]);
  });
  it("uses distance when everything else is equal",()=>{
    const a={shop:shop({name:"Far"}),cell:cell("L1","S1"),distance:8,kind:"match",official:false} as Match;
    const b={shop:shop({name:"Close"}),cell:cell("L1","S1"),distance:2,kind:"match",official:false} as Match;
    expect([a,b].sort(compareMatches({})).map(m=>m.shop.name)).toEqual(["Close","Far"]);
  });
  it("prefers the rider's speciality over distance",()=>{
    const a={shop:shop({name:"Tyre shop",skills:["tyres"]}),cell:cell("L1","S2"),distance:8,kind:"match",official:false} as Match;
    const b={shop:shop({name:"General"}),cell:cell("L1","S2"),distance:2,kind:"match",official:false} as Match;
    expect([b,a].sort(compareMatches({skill:"tyres"}))[0].shop.name).toBe("Tyre shop");
  });
  it("measures distance correctly",()=>{expect(distanceKm({lat:28.6139,lng:77.209},{lat:19.076,lng:72.8777})).toBeGreaterThan(1100)});
});

describe("empty-cell fallback",()=>{
  const q={level:"L3" as const,service:"S3" as const,brand:"Triumph",origin:NOIDA,city:"Noida"};
  it("widens the radius first",()=>{
    const far=shop({lat:28.85,lng:77.3,cells:[cell("L3","S3","visited")]}); // ~31 km
    const r=findMatches([far],q);
    expect(r.widened).toBe("radius");expect(r.matches).toHaveLength(1);
    expect(widenedNote(r.widened,q)).toMatch(/looked further/);
  });
  it("then shows shops that only say they can, labelled as not verified",()=>{
    const claimed=shop({lat:28.58,lng:77.33,cells:[cell("L3","S3","claimed")]});
    const r=findMatches([claimed],q);
    expect(r.widened).toBe("unverified");expect(r.matches[0].kind).toBe("unverified");
    expect(matchLines(r.matches[0],q)[0]).toMatch(/^Shop says: .*not yet verified/);
  });
  it("then official service centres for the brand",()=>{
    const dealer=shop({lat:28.58,lng:77.33,officialBrands:["Triumph"],brandExclusive:true});
    const r=findMatches([dealer],q);
    expect(r.widened).toBe("official");expect(r.matches[0].kind).toBe("official");
  });
  it("never leaves the page empty without saying so, and lists unchecked workshops nearby",()=>{
    const unknown=shop({lat:28.575,lng:77.325});
    const r=findMatches([unknown],q);
    expect(r.widened).toBe("none");expect(widenedNote("none",q)).toBeTruthy();
    expect(r.unchecked.map(u=>u.shop.id)).toEqual([unknown.id]);
  });
  it("keeps gear shops and other brands' dealers out",()=>{
    const gear=shop({listingType:"gear_shop",lat:28.575,lng:77.325});
    const honda=shop({officialBrands:["Honda"],brandExclusive:true,lat:28.575,lng:77.325});
    expect(findMatches([gear,honda],q).unchecked).toHaveLength(0);
  });
  it("searches by city and region when there is no location",()=>{
    const gurugram=shop({city:"Gurugram",cells:[cell("L1","S1","visited")]});
    const r=findMatches([gurugram],{level:"L1",service:"S1",city:"Noida"});
    expect(r.widened).toBe("radius");
  });
});

describe("card lines",()=>{
  it("shows plain language and at most three lines",()=>{
    const m={shop:shop({officialBrands:["Triumph"],reports:{sameModel:9,sameModelAvg:4.6,sameLevel:12,sameLevelAvg:4.5}}),cell:cell("L3","S3","proven"),distance:2.1,kind:"match",official:true} as Match;
    const lines=matchLines(m,{level:"L3",service:"S3",modelName:"Trident 660",warranty:true});
    expect(lines).toEqual(["✓ Keeps your warranty safe","✓ Handles big bikes","✓ Electronics & warning lights"]);
    const plain=matchLines(m,{level:"L3",service:"S3",modelName:"Trident 660"});
    expect(plain).toContain("9 Trident 660 owners reviewed");
    expect(plain.join(" ")).not.toMatch(/\b(L[1-4]|S[1-5])\b|capabilit/i);
  });
});

describe("shop types",()=>{
  it("labels an official dealer",()=>{
    expect(deriveShopTypes([cell("L1","S1","claimed",["Honda"])],{officialBrands:["Honda"],skills:[]}).map(t=>t.label)).toContain("Official Honda service");
  });
  it("labels a neighbourhood workshop",()=>{
    expect(deriveShopTypes([cell("L1","S1","claimed"),cell("L1","S2","claimed"),cell("L2","S1","claimed")],{officialBrands:[],skills:[]}).map(t=>t.key)).toEqual(["neighbourhood"]);
  });
  it("labels a multi-brand big-bike workshop only for 2+ brands",()=>{
    const row=(brands:string[])=>(["S1","S2","S3","S4"] as ServiceLevel[]).map(s=>cell("L3",s,"visited",brands));
    expect(deriveShopTypes(row(["Triumph","Kawasaki"]),{officialBrands:[],skills:[]}).map(t=>t.key)).toContain("big_bike");
    expect(deriveShopTypes(row([]),{officialBrands:[],skills:[]}).map(t=>t.key)).toContain("big_bike");
    expect(deriveShopTypes(row(["Triumph"]),{officialBrands:[],skills:[]}).map(t=>t.key)).not.toContain("big_bike");
  });
  it("labels performance, classic and EV specialists",()=>{
    const keys=deriveShopTypes([cell("L2","S5"),cell("L3","S5"),cell("CLASSIC","S4"),cell("EV","S1")],{officialBrands:[],skills:[]}).map(t=>t.key);
    expect(keys).toEqual(expect.arrayContaining(["performance","classic","ev"]));
  });
  it("labels a single-skill specialist with its skill",()=>{
    const t=deriveShopTypes([cell("L1","S2","claimed"),cell("L2","S2","claimed")],{officialBrands:[],skills:["tyres"]});
    expect(t.find(x=>x.key==="single_skill")).toMatchObject({label:"Tyre specialist",skill:"tyres"});
  });
  it("ignores cells riders can't see yet",()=>{
    expect(deriveShopTypes([cell("EV","S1","claimed")],{officialBrands:[],skills:[]})).toEqual([]);
    expect(deriveShopTypes([cell("EV","S1","claimed")],{officialBrands:[],skills:[]},true).map(t=>t.key)).toEqual(["ev"]);
  });
});

describe("symptoms and needs",()=>{
  it("maps symptoms to the right depth of job",()=>{
    expect(symptomService("noise",null)).toBe("S2");
    expect(symptomService("warning_light",null)).toBe("S3");
    expect(symptomService("wont_start","fi")).toBe("S3");
    expect(symptomService("wont_start","carb")).toBe("S2");
    expect(symptomService("brakes",null)).toBe("S2");
    expect(symptomService("oil_leak",null)).toBe("S2");
    expect(symptomService("wobble",null)).toBe("S2");
    expect(symptomService("fall",null,"yes")).toBe("S2");
    expect(symptomService("fall",null,"no")).toBe("S4");
    expect(symptomService("unsure",null)).toBe("S2");
  });
  it("treats a classic bike that won't start as a carburettor job",()=>{
    expect(resolveNeed({intent:"problem",symptom:"wont_start"},{fuel:null,level:"CLASSIC"})?.service).toBe("S2");
  });
  it("ranks 'not sure' by general rating",()=>{expect(resolveNeed({intent:"problem",symptom:"unsure"})?.preferRating).toBe(true)});
  it("maps tiles",()=>{
    expect(resolveNeed({intent:"service",option:"wash"})).toMatchObject({service:"S1",skill:"washing_detailing"});
    expect(resolveNeed({intent:"accident",ride:"no"})?.service).toBe("S4");
    expect(resolveNeed({intent:"accident",ride:"unsure"})?.service).toBe("S2");
    expect(resolveNeed({intent:"perform"})?.service).toBe("S5");
    expect(resolveNeed({intent:"custom",option:"restore"})).toMatchObject({service:"S4",level:"CLASSIC"});
    expect(resolveNeed({intent:"gear"})).toBeNull();
  });
});

describe("proven upgrade and downgrade",()=>{
  it("upgrades a visited cell after 3 reviews",()=>{expect(evaluateCell("visited",[5,4,4])).toEqual({status:"proven",change:"upgraded"})});
  it("needs a visit first",()=>{expect(evaluateCell("claimed",[5,5,5,5])).toEqual({status:"claimed",change:null})});
  it("stays visited under 3 reviews",()=>{expect(evaluateCell("visited",[5,5])).toEqual({status:"visited",change:null})});
  it("downgrades on poor ratings",()=>{expect(evaluateCell("proven",[2,2,3])).toEqual({status:"claimed",change:"downgraded"})});
  it("returns to visited when reviews are removed",()=>{expect(evaluateCell("proven",[5,5])).toEqual({status:"visited",change:"reverted"})});
  it("is stable when run again",()=>{expect(evaluateCell("proven",[5,4,4]).change).toBeNull()});
});

describe("bike models",()=>{
  it("has unique ids and no codes in names",()=>{
    const ids=BIKE_MODELS.map(m=>m.id);expect(new Set(ids).size).toBe(ids.length);
  });
  it("classifies by model, not engine size",()=>{
    expect(bikeModel("bmw-g-310-r")?.level).toBe("L2");
    expect(bikeModel("bmw-g-310-r")?.brandTools).toEqual(["BMW"]);
    expect(bikeModel("triumph-trident-660")?.level).toBe("L3");
    expect(bikeModel("ducati-scrambler-icon")?.level).toBe("L4");
    expect(bikeModel("yamaha-rd350")?.level).toBe("CLASSIC");
  });
  it("finds models in rider text",()=>{
    expect(findModelInText("duke 390 service")?.id).toBe("ktm-390-duke");
    expect(findModelInText("my himalayan is making noise")?.id).toBe("royal-enfield-himalayan-450");
    expect(findModelInText("classic 350")?.id).toBe("royal-enfield-classic-350");
  });
  it("guesses a level from brand and size",()=>{
    expect(levelForSize("Royal Enfield","mid")).toBe("L2");
    expect(levelForSize("Royal Enfield","big")).toBe("L3");
    expect(levelForSize("Ducati","big")).toBe("L4");
    expect(levelForSize("Bajaj","small")).toBe("L1");
    expect(levelForSize("Anything","old")).toBe("CLASSIC");
  });
});

describe("search understands rider language",()=>{
  it("reads Hinglish and models",()=>{
    const p=parseQuery("Duke 390 service karwana Noida");
    expect(p.model?.id).toBe("ktm-390-duke");expect(p.need).toMatchObject({intent:"service"});expect(p.city).toBe("Noida");
  });
  it("reads symptoms",()=>{
    expect(parseQuery("warning light jal rahi hai").need).toMatchObject({intent:"problem",symptom:"warning_light"});
    expect(parseQuery("chain noise").need).toMatchObject({symptom:"noise"});
    expect(parseQuery("start nahi ho rahi").need).toMatchObject({symptom:"wont_start"});
    expect(parseQuery("remap").need).toMatchObject({intent:"perform"});
    expect(parseQuery("tyre change").need).toMatchObject({intent:"tyres"});
    expect(parseQuery("washing").need).toMatchObject({intent:"service",option:"wash"});
    expect(parseQuery("mistri").need).toMatchObject({intent:"service"});
  });
  it("reads places and near me",()=>{
    expect(parseQuery("bike garage near me").nearMe).toBe(true);
    expect(parseQuery("himalayan bangalore").city).toBe("Bengaluru");
  });
  it("sends gear searches to gear shops",()=>{expect(parseQuery("helmet").gear).toBe(true)});
  it("leaves shop names alone",()=>{expect(parseQuery("Varshaa Motors")).toMatchObject({need:null,model:null,leftover:"varshaa motors"})});
});
